# 002. Estrategia de integracao com WhatsApp via links diretos (wa.me)

Date: 2026-09-25

## Status

Aceito

## Contexto

O Matukaj precisa enviar ao cliente final a Ordem de Servico (OS) por WhatsApp, canal ja usado no dia a dia da recepcao. A restricao central segue a do [ADR 001](001-arquitetura-serverless.md): **custo operacional de R$ 0,00/mes**, sem servidores proprios e sem manutencao continua.

Alternativas avaliadas:

| Opcao | Custo | Manutencao | Risco de banimento | Adequacao |
| --- | --- | --- | --- | --- |
| **WhatsApp Business Platform (Cloud API oficial)** | Cobranca por conversa/mensagem, alem de verificacao de conta e templates aprovados | Media (templates, tokens, webhooks) | Baixo | Viola o requisito de custo zero |
| **APIs pagas de terceiros** (Twilio, Z-API, Evolution hospedada, etc.) | Mensalidade ou por mensagem | Media (dependencia de fornecedor) | Medio a alto quando nao usam a API oficial | Viola o requisito de custo zero |
| **Baileys** (biblioteca nao oficial, protocolo do WhatsApp Web) | R$ 0,00 de licenca, mas exige processo persistente 24/7 | Alta (sessao/QR Code, quebras a cada mudanca do protocolo) | **Alto** (automacao nao oficial viola os Termos de Servico) | Incompativel com serverless e com o risco aceitavel |
| **Links diretos `wa.me`** | R$ 0,00 | Nenhuma | **Nenhum** (envio feito pelo proprio usuario) | Atende todos os requisitos |

Baileys e APIs pagas tambem exigem um backend sempre ativo (ou contrato com terceiro), o que contradiz a stack serverless adotada no ADR 001.

## Decisao

Adotar **links diretos `wa.me`** (click-to-chat) como unica estrategia de integracao com o WhatsApp. Nao havera integracao por API, biblioteca nao oficial ou servico de terceiros.

O frontend monta a URL e abre o WhatsApp (app ou Web) do atendente ja com a conversa e a mensagem preenchidas. **O atendente revisa e toca em "Enviar"**; o Matukaj nunca envia mensagens por conta propria.

### Construcao da URL

Formato:

```
https://wa.me/<telefone>?text=<mensagem codificada>
```

Regras:

1. **Telefone** em formato internacional, somente digitos, sem `+`, espacos, parenteses ou hifens. Para numeros brasileiros, prefixar `55` ao DDD + numero (ex.: `5511987654321`). O cadastro do cliente deve normalizar o telefone antes de montar o link.
2. **Mensagem** codificada com `encodeURIComponent`, garantindo que acentos, quebras de linha (`%0A`), `&`, `#` e emojis nao quebrem a URL.
3. **Link para o PDF da OS** incluido no corpo da mensagem. O PDF fica armazenado (ex.: Supabase Storage) e o link enviado deve ser acessivel pelo cliente sem login, preferencialmente uma URL assinada ou de token nao adivinhavel.

Exemplo de implementacao:

```ts
function buildWhatsAppLink(phone: string, os: { numero: string; pdfUrl: string; cliente: string }) {
  const digits = phone.replace(/\D/g, '');
  const e164 = digits.startsWith('55') ? digits : `55${digits}`;

  const message = [
    `Ola, ${os.cliente}!`,
    `Segue a sua Ordem de Servico n. ${os.numero}:`,
    os.pdfUrl,
  ].join('\n');

  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}
```

O link e aberto com `window.open(url, '_blank', 'noopener')` a partir de um botao "Enviar por WhatsApp" na tela da OS.

## Consequencias

### Positivas

- **Custo operacional de R$ 0,00**: sem tarifa por mensagem, mensalidade ou licenca, alinhado ao ADR 001.
- **Zero manutencao**: `wa.me` e um endpoint publico e estavel do WhatsApp; nao ha sessao, QR Code, token, webhook nem processo em execucao para manter.
- **Risco zero de banimento**: o envio e uma acao manual do atendente pelo proprio cliente WhatsApp oficial. Nao ha automacao, portanto nao ha violacao dos Termos de Servico nem risco para o numero da clinica/loja.
- **Facilidade de uso na recepcao**: um clique abre a conversa com telefone e mensagem prontos; nao exige treinamento nem configuracao de nenhum servico.
- **Compativel com serverless**: toda a logica roda no frontend, sem novo componente de infraestrutura.
- **Numero e historico ficam com o cliente**: as conversas permanecem no WhatsApp da recepcao, sem dependencia de fornecedor.

### Negativas

- **Envio nao e automatico**: cada mensagem exige um clique do atendente em "Enviar". Nao ha disparo em lote, agendamento nem lembretes automaticos.
- **Sem confirmacao de entrega/leitura no sistema**: o Matukaj nao sabe se a mensagem foi realmente enviada ou lida.
- **Sem recebimento de respostas na aplicacao**: respostas do cliente ficam apenas no WhatsApp do atendente.
- **Dependencia de um WhatsApp logado** no dispositivo ou no WhatsApp Web usado pela recepcao.
- **Telefone precisa estar bem cadastrado**: numero invalido ou sem DDD gera link para conversa inexistente; e necessaria validacao/normalizacao no cadastro.
- **Link do PDF e o unico meio de entrega do documento**: `wa.me` nao anexa arquivos. Se a URL for assinada com expiracao, o cliente pode encontrar o link vencido; o prazo de validade deve ser definido na implementacao.
- **Limite de tamanho de URL**: mensagens muito longas podem ser truncadas; a mensagem deve permanecer curta, apenas com saudacao, numero da OS e link.

### Reavaliacao

Esta decisao deve ser revista se surgir necessidade comprovada de envio automatico, lembretes em massa ou rastreio de status, casos em que a **WhatsApp Business Platform oficial** seria a alternativa a considerar, ja com orcamento aprovado. Baileys permanece descartado por risco de banimento.
