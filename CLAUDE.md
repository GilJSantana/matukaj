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