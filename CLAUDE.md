# 🛠️ CLAUDE.md - Guia de Desenvolvimento do Projeto Matukaj

Este documento contém as diretrizes, comandos e padrões do projeto **Matukaj** para auxiliar sessões de desenvolvimento e agentes de IA.

---

## 📌 Contexto & Escopo do Projeto
O **Matukaj** é um sistema web progressivo (PWA) de gestão leve, seguro e de custo zero ($0/mês - Serverless Free Tier) desenvolvido sob medida para a **Retífica de Motores Matukaj**. O sistema gerencia o fluxo de vistorias veiculares, orçamentos, Ordens de Serviço (OS), certificados de garantia e alertas de fidelização com integração ao WhatsApp.

---

## 🛠️ Tech Stack & Arquitetura

- **Frontend:** React + Vite + Tailwind CSS + Supabase JS SDK (`/frontend`)
- **Backend / Infra:** Supabase CLI / PostgreSQL Serverless / Supabase Auth & Storage (`/backend`)
- **Hospedagem & CI/CD:** Vercel (Frontend) + GitHub Actions
- **Integração WhatsApp:** Envio via Deep Link (`wa.me`) / WhatsApp Direct Dispatch
- **Estratégia Backend:** Utilização direta do Supabase (BaaS) via CLI/Migrations e SDK no frontend, dispensando camadas intermediárias.

---

## 📁 Estrutura do Repositório

```text
matukaj/
├── .github/              # Workflows de CI/CD (GitHub Actions)
├── docs/                 # Documentação C4 Model, ADRs e diagramas
│   ├── architecture/     # Diagramas Mermaid
│   └── adr/              # Architecture Decision Records
├── frontend/             # Aplicação React (Vite, Tailwind CSS)
│   ├── src/
│   │   ├── components/   # Componentes de UI reutilizáveis
│   │   ├── pages/        # Telas/Páginas da aplicação
│   │   ├── services/     # Clientes de API e SDK Supabase
│   │   └── hooks/        # Hooks customizados
│   └── .env.example      # Exemplo de variáveis (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
└── backend/              # Infraestrutura e Migrações Supabase CLI
    └── supabase/
        ├── config.toml   # Configuração do projeto Supabase
        └── migrations/   # Scripts SQL do banco de dados
```

### ⚡ Comandos Úteis
- **Supabase CLI**
  - `supabase login` - Autenticar no Supabase CLI
  - `supabase init` - Inicializar projeto Supabase
  - `supabase start` - Iniciar ambiente local Supabase
  - `supabase db push` - Aplicar migrações no banco de dados
  - `supabase functions deploy <nome>` - Deploy de funções serverless
- **Vite / React**
  - `npm install` - Instalar dependências
  - `npm run dev` - Iniciar servidor de desenvolvimento
  - `npm run build` - Gerar build de produção

### 📌 Padrões de Desenvolvimento
- **Componentização:** Componentes React devem ser pequenos, reutilizáveis e seguir a convenção de nomenclatura PascalCase.
- **Estilização:** Utilizar Tailwind CSS para consistência visual e responsividade. Evitar CSS inline.
- **Hooks:** Criar hooks customizados para lógica de estado e efeitos colaterais, mantendo a separação de preocupações.
- **Gerenciamento de Estado:** Preferir o uso de React Context ou Zustand para estados globais, evitando prop drilling excessivo.
- **Acessibilidade:** Garantir que todos os elementos interativos sejam acessíveis via teclado e compatíveis com leitores de tela (WCAG 2.1).

## 📝 Documentação e ADRs
- **ADR (Architecture Decision Records):** Todas as decisões arquiteturais devem ser registradas em arquivos Markdown dentro de `docs/adr/`, seguindo o template padrão.
- **Diagramas:** Diagramas de arquitetura devem ser criados em Mermaid e armazenados em `docs/architecture/`.

### 📌 Contribuição e Pull Requests
- commits devem seguir o padrão **Conventional Commits**.
- não inserir menção ao claude ou chatgpt nos commits, PRs ou issues.