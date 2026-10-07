# US-34: Gestão de Usuários, Vínculo de Perfis e RBAC

## Contexto & Objetivo
Como **Administrador da Oficina**,
Quero **gerenciar os usuários do sistema, atribuir papéis (admin, atendente, mecânico) e ativar/desativar acessos**,
Para que **o controle de segurança (Row Level Security - RLS) proteja os dados sensíveis da oficina e cada colaborador acesse apenas o escopo operacional correspondente à sua função**.

---

## Critérios de Aceite (BDD)

### Cenário 1: Sincronização automática de perfil no primeiro cadastro
- **Dado** que um novo usuário é cadastrado no Supabase Auth via convite ou inserção administrativa,
- **Quando** o registro é concluído no banco de dados,
- **Então** a trigger do Postgres deve inserir automaticamente uma linha correspondente na tabela `perfis`,
- **E** o papel inicial deve ser definido como `mecanico` com o status `ativo = true`.

### Cenário 2: Gerenciamento de papéis e status por Administrador
- **Dado** que estou autenticado com o perfil `admin` na tela de Gestão de Usuários (`/usuarios`),
- **Quando** altero o papel de um usuário (para `admin`, `atendente` ou `mecanico`) ou alterno seu status para inativo,
- **E** clico em salvar,
- **Então** as alterações devem ser persistidas com sucesso e refletidas imediatamente nas permissões do usuário.

### Cenário 3: Bloqueio de acesso para usuários inativos
- **Dado** que o perfil de um usuário possui o campo `ativo = false`,
- **Quando** esse usuário tenta realizar qualquer operação de leitura ou escrita na aplicação,
- **Então** as políticas de Row Level Security (RLS) do Supabase devem bloquear a requisição e retornar erro de permissão.

### Cenário 4: Restrição de acesso à tela de usuários para não-administradores
- **Dado** que estou autenticado com o perfil `atendente` ou `mecanico`,
- **Quando** tento acessar a rota de administração de usuários (`/usuarios`),
- **Então** o roteador frontend deve redirecionar o acesso para o dashboard e exibir um aviso de restrição.

---

## Requisitos Técnicos & Contratos

### 1. Banco de Dados, Triggers & RLS (`supabase/migrations/20260104_perfis_rbac.sql`)
- **Tabela `perfis`:**
  - `id` (`uuid`, PK e FK para `auth.users.id` com `ON DELETE CASCADE`)
  - `nome` (`text`)
  - `papel` (`text`, valores permitidos: `'admin'`, `'atendente'`, `'mecanico'`)
  - `ativo` (`boolean`, DEFAULT `true`)
- **Trigger de Auto-criação:**
  - Função disparada em `AFTER INSERT ON auth.users` para popular automaticamente a tabela `perfis`.
- **Funções de Apoio & RLS:**
  - `public.get_meu_papel()`: Função performástica para ler o papel do usuário autenticado atual.
  - Políticas RLS na tabela `perfis`:
    - `SELECT`: Usuários veem o próprio perfil; administradores visualizam todos.
    - `UPDATE / DELETE`: Restrito estritamente a usuários com papel `admin`.

### 2. Camada de Serviços (`frontend/src/services/userService.ts`)
- `listarUsuarios()`: Retorna a lista unificada de usuários e seus respectivos perfis.
- `atualizarPerfilUsuario(userId, payload)`: Modifica o papel e o status ativo do usuário selecionado.
- `convidarUsuario(email, papel)`: Dispara convite de acesso utilizando a API administrativa do Supabase Auth (`supabase.auth.admin.inviteUserByEmail`).

### 3. Interface Visual & Rotas (`frontend/src/pages/UsuariosPage.tsx`)
- **Tabela de Usuários:**
  - Exibição de Nome, E-mail, Papel (com badges coloridas) e Status (Ativo/Inativo).
  - Modal ou menu suspenso para alteração rápida de papel e chave seletora (*Toggle*) para ativação/desativação.
- **Modal de Convite:**
  - Formulário para inserção de e-mail e atribuição do papel inicial.
- **Proteção de Rotas:**
  - Integração do papel no `AuthContext`.
  - Configuração do `AdminRoute` para blindagem de rotas administrativas.

---

## Regras de Negócio & Edge Cases
1. **Relacionamento 1:1:** Cada registro em `auth.users` possui obrigatoriamente um único reflexo na tabela `perfis` gerenciado por automação de banco.
2. **Segurança em Camadas:** A proteção ocorre tanto no Frontend (escondendo rotas e botões) quanto no Backend (garantido pelas políticas strictas de RLS do PostgreSQL).

---

## Referências & ADRs Relacionadas
- ADRs de Arquitetura de Autenticação e Controle de Acesso Baseado em Papéis (RBAC).