# 004. Controle de acesso por papeis (RBAC) e convite de usuarios via Edge Function

Date: 2026-10-07

## Status

Aceito

## Contexto

O frontend acessa o banco diretamente pelo SDK do Supabase ([ADR 001](001-arquitetura-serverless.md)), entao a seguranca precisa estar no PostgreSQL, nao na interface. A tabela `perfis` ([ADR 003](003-modelagem-banco-dados.md)) ja guarda `papel` (`admin`, `atendente`, `mecanico`) e `ativo`, e as policies de RLS usam `is_admin()` e `usuario_ativo()`.

A US-34 pede que o administrador gerencie usuarios, papeis e convites. Tres pontos exigem decisao:

1. **Convite**: `supabase.auth.admin.inviteUserByEmail` so funciona com a chave `service_role`, que ignora todo o RLS. Exposta no navegador, daria acesso total ao banco a qualquer pessoa.
2. **E-mail**: fica em `auth.users`, que a API nao expoe.
3. **Perfil do novo usuario**: precisa existir sem depender de passo manual.

## Decisao

- **Perfil criado por trigger** (`criar_perfil_usuario`, `AFTER INSERT ON auth.users`) como `mecanico` ativo. O papel **nunca** e lido de `raw_user_meta_data`, porque o proprio usuario controla esse campo no cadastro; so o nome e aproveitado.
- **Convite por Edge Function** (`convidar-usuario`): confere `is_admin()` com o JWT de quem chamou e so entao usa a `service_role`, que existe apenas no servidor. Depois do convite, ajusta o papel no perfil criado pelo trigger. Edge Functions estao no Free Tier, mantendo o custo zero.
- **Listagem por funcao `security definer`** (`listar_usuarios()`): junta `perfis` e `auth.users`, e recusa com `42501` quem nao e admin.
- **RLS em `perfis`**: cada usuario le o proprio perfil; o admin le todos. Update usa `with check (is_admin())`, para que nao-admin receba `42501` em vez de um update silencioso. Nao ha delete: usuario e apenas desativado.
- **Pelo menos um admin ativo**: o trigger `manter_um_admin` impede rebaixar ou desativar o ultimo admin, evitando que a oficina fique trancada para fora.
- **Frontend em camadas**: `get_meu_papel()` (nulo para inativo) esconde a tela de usuarios de nao-admin e mostra aviso de acesso desativado. E so conveniencia: a protecao real e o RLS.

## Consequencias

### Positivas

- A `service_role` nunca sai do servidor.
- Mudanca de papel ou status vale na proxima requisicao, pois o RLS consulta `perfis` a cada chamada, sem depender de claims no JWT.
- Usuario desativado perde acesso mesmo com sessao valida.

### Negativas

- Primeira Edge Function do projeto: exige `supabase functions deploy convidar-usuario` alem do `db push`.
- O convite depende do envio de e-mail do Supabase Auth, com limite baixo de envios por hora no Free Tier; para mais volume, configurar SMTP proprio.
- Se o cadastro publico estiver habilitado no projeto, qualquer pessoa que se cadastrar entra como `mecanico` ativo. O cadastro publico deve permanecer desligado.
