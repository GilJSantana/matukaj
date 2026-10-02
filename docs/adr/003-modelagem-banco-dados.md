# 003. Modelagem de banco de dados hibrida (relacional + JSONB) no Supabase

Date: 2026-09-25

## Status

Aceito

## Contexto

O Matukaj persiste seus dados no **PostgreSQL do Supabase Free Tier**, conforme o [ADR 001](001-arquitetura-serverless.md). O modelo de dados precisa atender dois tipos de informacao com naturezas bem diferentes:

1. **Dados estaveis do negocio**: clientes, veiculos, ordens de servico (OS), orcamentos, itens de servico e garantias. Tem estrutura conhecida, relacionamentos fortes entre si (um cliente possui varios veiculos; um veiculo possui varias OS) e sao usados em buscas, filtros, relatorios e alertas (ex.: aniversariantes do dia).
2. **Dados da vistoria de recepcao**: o checklist de itens (estepe, macaco, nivel de combustivel, triangulo, etc.) e a marcacao grafica de avarias na lataria (riscos, amassados, trincas), feita tocando sobre o desenho do carro. Estes dados mudam com frequencia conforme a oficina ajusta o processo: itens entram e saem do checklist, surgem novos tipos de avaria, e cada vistoria tem um numero variavel de marcacoes.

Restricoes relevantes:

- **Limite de 500 MB** do banco no plano gratuito, exigindo armazenamento enxuto.
- **Equipe pequena**, sem espaco para migracoes de schema frequentes a cada ajuste no checklist.
- **Integridade** e obrigatoria nos dados que geram documentos (OS, orcamento, garantia) e que sao enviados ao cliente pelo WhatsApp ([ADR 002](002-estrategia-whatsapp.md)).

Alternativas avaliadas:

| Opcao | Flexibilidade do checklist | Integridade / consultas | Adequacao |
| --- | --- | --- | --- |
| **100% relacional** (uma coluna ou linha por item de checklist e por avaria) | Baixa: cada item novo exige migracao ou modelo EAV com muitas linhas e joins | Alta | Custo de manutencao alto para dados que mudam sempre |
| **100% documental** (tudo em JSONB ou banco NoSQL) | Alta | Baixa: sem chaves estrangeiras, sem garantia de tipos nos dados financeiros e cadastrais | Arriscado para OS, valores e garantias; desperdica o PostgreSQL |
| **Hibrido: relacional + colunas JSONB** | Alta onde precisa | Alta onde precisa | **Atende todos os requisitos** |

## Decisao

Adotar um **modelo relacional hibrido**: tabelas relacionais normalizadas para as entidades estaveis do negocio e para a gestao do sistema, e **colunas `JSONB`** apenas para os dados variaveis da vistoria (itens do checklist e coordenadas das avarias).

### 1. Tabelas relacionais fixas (nucleo do negocio)

Estas entidades tem estrutura estavel, se relacionam entre si e sao consultadas por campos especificos, por isso usam colunas tipadas, chaves estrangeiras e constraints:

| Tabela | Responsabilidade | Principais campos |
| --- | --- | --- |
| `clientes` | Cadastro de quem traz o veiculo | `id`, `nome`, `cpf_cnpj` (unico), `telefone` (normalizado para `wa.me`), `email`, `data_nascimento`, `created_at` |
| `veiculos` | Veiculos de cada cliente | `id`, `cliente_id` (FK), `placa` (unica), `marca`, `modelo`, `ano`, `cor`, `chassi` |
| `ordens_servico` | Orcamentos e OS no mesmo registro, diferenciados por `status` | `id`, `numero` (sequencial), `veiculo_id` (FK), `cliente_id` (FK), `status` (`orcamento`, `aprovada`, `em_execucao`, `concluida`, `entregue`, `cancelada`), `km_entrada`, `valor_total`, `pdf_path`, `created_by`, datas de abertura/conclusao |
| `itens_os` | Servicos e pecas de cada OS | `id`, `ordem_servico_id` (FK), `servico_id` (FK opcional para o catalogo), `descricao`, `quantidade`, `valor_unitario` (`numeric(12,2)`) |
| `garantias` | Termos de garantia emitidos | `id`, `ordem_servico_id` (FK), `prazo_dias`, `km_limite`, `condicoes`, `emitida_em`, `pdf_path` |
| `vistorias` | Vistoria de recepcao de uma OS | `id`, `ordem_servico_id` (FK), `checklist_modelo_id` (FK), `nivel_combustivel`, `checklist` (**JSONB**), `avarias` (**JSONB**), `observacoes`, `realizada_por`, `realizada_em` |

Justificativas:

- **Integridade referencial**: nao existe OS sem veiculo, nem veiculo sem cliente. Isso e garantido pelo banco, nao pela aplicacao.
- **Orcamento e OS na mesma tabela**: a funcionalidade "converter orcamento em OS com 1 clique" vira apenas uma mudanca de `status`, sem copia de dados entre tabelas.
- **Valores monetarios** em `numeric`, nunca em JSON ou `float`, evitando erros de arredondamento em documentos enviados ao cliente.
- **Consultas diretas e indexaveis**: busca por placa, por telefone, OS por status e aniversariantes do dia (indice sobre mes/dia de `data_nascimento`) usam indices B-tree comuns.

### 2. Tabelas de gestao do sistema

Alem do nucleo do negocio, o sistema precisa de um conjunto **minimo** de tabelas de gestao. Elas entram no escopo desta ADR porque sustentam diretamente as funcionalidades descritas no README e a propria estrategia de JSONB (ver `checklist_modelos`). Nao serao criadas tabelas proprias de login/senha: a autenticacao e do **Supabase Auth** (`auth.users`).

| Tabela | Responsabilidade | Principais campos |
| --- | --- | --- |
| `perfis` | Dados de aplicacao do usuario autenticado, 1:1 com `auth.users` | `id` (PK e FK para `auth.users.id`), `nome`, `papel` (`admin`, `atendente`, `mecanico`), `ativo` |
| `oficina_config` | Dados da oficina usados no cabecalho dos PDFs e nas mensagens | `id` (linha unica), `razao_social`, `cnpj`, `endereco`, `telefone`, `logo_path`, `garantia_prazo_padrao_dias`, `validade_orcamento_dias` |
| `catalogo_servicos` | Servicos pre-cadastrados para o autocomplete | `id`, `descricao`, `valor_sugerido`, `ativo` |
| `checklist_modelos` | Definicao versionada dos itens do checklist e dos tipos de avaria | `id`, `versao`, `definicao` (**JSONB**), `ativo`, `created_at` |
| `auditoria` | Registro de alteracoes em OS, valores e status | `id`, `tabela`, `registro_id`, `acao`, `dados_anteriores` (JSONB), `usuario_id`, `created_at` |

Justificativas:

- **`perfis`** permite controlar o que cada papel pode fazer via **Row Level Security (RLS)** do Supabase, ja que o frontend acessa o banco diretamente em parte dos fluxos.
- **`oficina_config`** evita dados da oficina fixos no codigo; mudar telefone, endereco ou prazo padrao de garantia nao exige novo deploy.
- **`catalogo_servicos`** e relacional porque e consultado por texto (indice `pg_trgm` para o autocomplete). `itens_os.descricao` guarda uma copia do texto, entao alterar o catalogo nao altera OS ja emitidas; a digitacao livre continua possivel com `servico_id` nulo.
- **`checklist_modelos`** e a peca que torna o JSONB seguro: a definicao dos itens fica versionada no banco e cada vistoria referencia a versao usada, preservando o historico (ver secao 3).
- **`auditoria`** e preenchida por *trigger* apenas nas tabelas sensiveis (`ordens_servico`, `itens_os`, `garantias`), registrando quem mudou status ou valores:
  - O trigger `registrar_auditoria()` (`AFTER INSERT OR UPDATE OR DELETE`, por linha) grava `tabela`, `registro_id`, `acao` (`INSERT`, `UPDATE`, `DELETE`), a linha anterior inteira em `dados_anteriores` (nulo no `INSERT`), `usuario_id` (`auth.uid()`; nulo em mudancas feitas fora da API) e `created_at`. `UPDATE` que nao altera nenhum valor nao gera registro.
  - **Somente leitura e somente admin**: RLS permite `SELECT` apenas a quem tem `perfis.papel = 'admin'` (funcao `is_admin()`). Nao ha policy de escrita e os privilegios de `INSERT`, `UPDATE`, `DELETE` e `TRUNCATE` sao revogados de `anon`, `authenticated` e `service_role`; so o trigger e o expurgo (ambos `security definer`) escrevem na tabela.
  - **Expurgo**: para respeitar o limite de 500 MB, `expurgar_auditoria(retencao interval default '1 year')` remove registros mais antigos que a retencao. Roda diariamente as 03:00 UTC via `pg_cron` (job `expurgo-auditoria`) e nao pode ser chamada pela API. Para mudar a retencao, reagendar o job com outro intervalo.

Ficam **fora do escopo** (sem necessidade atual, reavaliar quando surgirem): multiempresa/multiplas oficinas, filas de notificacao (o envio e manual via `wa.me`, ADR 002), controle de estoque de pecas e tabelas de permissao granular alem dos papeis acima.

### 3. Colunas JSONB para dados dinamicos da vistoria

Os dados que mudam de formato ao longo do tempo ficam em colunas `JSONB` da tabela `vistorias`.

**Checklist** (`vistorias.checklist`): respostas aos itens definidos pela versao do modelo usada.

```json
{
  "estepe": { "presente": true },
  "macaco": { "presente": true },
  "triangulo": { "presente": false, "obs": "Cliente informou que esta em casa" },
  "som": { "presente": true, "marca": "Pioneer" }
}
```

**Avarias** (`vistorias.avarias`): lista de marcacoes feitas sobre o desenho do veiculo.

```json
[
  { "vista": "lateral_esquerda", "x": 0.42, "y": 0.61, "tipo": "risco", "descricao": "Risco na porta traseira" },
  { "vista": "frente", "x": 0.18, "y": 0.35, "tipo": "amassado" }
]
```

Regras:

1. **Coordenadas normalizadas** entre `0` e `1`, relativas a imagem da vista (`frente`, `traseira`, `lateral_esquerda`, `lateral_direita`, `teto`). Assim a marcacao e reproduzida corretamente em qualquer tamanho de tela e no PDF.
2. **Fotos nao ficam no JSON**: imagens das avarias vao para o **Supabase Storage** e o JSON guarda somente o caminho (`foto_path`), mantendo o banco pequeno.
3. **A definicao do checklist** (rotulos, tipos de resposta, ordem de exibicao, tipos de avaria) fica em `checklist_modelos.definicao`, e a vistoria guarda `checklist_modelo_id`. Uma vistoria antiga continua sendo exibida com os itens que existiam quando foi feita.
4. **Validacao de formato no banco** por `CHECK` com `jsonb_typeof` (ex.: `avarias` deve ser array) e, quando necessario, pela extensao `pg_jsonschema`, disponivel no Supabase. A aplicacao valida o mesmo schema antes de enviar.
5. **Nada que precise de integridade referencial, calculo financeiro ou filtro frequente entra no JSONB.** Se um campo do checklist passar a ser usado em relatorios, ele e promovido a coluna relacional.

### Vantagens de performance e flexibilidade

- **Alteracoes no checklist sem migracao de schema**: incluir, remover ou renomear um item (ex.: "cabo de chupeta", "tag de pedagio") ou um novo tipo de avaria e apenas inserir uma nova linha em `checklist_modelos`. Nao ha `ALTER TABLE`, nao ha deploy de migracao e as vistorias antigas nao sao afetadas.
- **Leitura em uma unica linha**: a tela e o PDF da vistoria carregam checklist e todas as avarias em um unico `SELECT` por `id`, sem joins com tabelas de itens nem dezenas de linhas por vistoria como em um modelo EAV.
- **Escrita atomica**: a vistoria inteira e salva em uma operacao, o que simplifica o fluxo no tablet/celular da recepcao e o funcionamento do PWA com conexao instavel.
- **Formato binario indexavel**: `JSONB` e armazenado ja decomposto, sem reparse na leitura, e aceita indice **GIN** (`jsonb_path_ops`) para consultas eventuais como "vistorias com avaria do tipo trinca" (`avarias @> '[{"tipo": "trinca"}]'`).
- **Armazenamento compacto**: uma vistoria tipica ocupa poucos KB, com compressao TOAST automatica em documentos maiores; com fotos no Storage, o impacto no limite de 500 MB e pequeno.
- **Nucleo relacional intacto**: clientes, veiculos e OS mantem indices B-tree, chaves estrangeiras e tipos fortes; o JSONB fica isolado onde a flexibilidade compensa.

## Consequencias

### Positivas

- **Evolucao rapida do checklist** pela propria oficina, sem depender de migracao ou de desenvolvedor para cada ajuste.
- **Historico fiel das vistorias**, gracas ao versionamento em `checklist_modelos`, importante como registro do estado do veiculo na entrada em caso de disputa com o cliente.
- **Integridade garantida pelo banco** nos dados cadastrais, financeiros e de garantia.
- **Controle de acesso e rastreabilidade** com `perfis` + RLS e `auditoria` nas tabelas sensiveis.
- **Uso eficiente do Free Tier**, com dados enxutos e arquivos pesados no Storage.
- **Menos componentes**: tudo continua em um unico PostgreSQL, sem banco documental adicional.

### Negativas

- **Validacao do JSONB e responsabilidade nossa**: sem schema validado (CHECK/`pg_jsonschema` e validacao na aplicacao), dados malformados podem ser gravados.
- **Consultas analiticas sobre o JSONB sao mais verbosas** (operadores `->`, `->>`, `@>`) e menos eficientes que colunas dedicadas; relatorios frequentes exigem promover campos a colunas.
- **Renomear chaves do checklist** exige cuidado: vistorias antigas mantem a chave antiga e o frontend precisa ler a definicao da versao correspondente.
- **Tipagem no frontend**: os tipos TypeScript gerados pelo Supabase representam JSONB como `Json` generico, exigindo tipos manuais para `checklist` e `avarias`.
- **Tabelas de gestao adicionam trabalho inicial** (triggers de auditoria, politicas de RLS e seed de `oficina_config` e do primeiro `checklist_modelos`).

### Reavaliacao

Esta decisao deve ser revista se relatorios sobre itens do checklist ou avarias se tornarem frequentes (promover campos a colunas ou criar *views* materializadas), se o sistema passar a atender multiplas oficinas (introduzir `oficina_id` e RLS por inquilino em todas as tabelas) ou se o volume de dados se aproximar do limite de 500 MB.
