# 🛠️ Sistema de Gestão - Retífica de Motores Matukaj

Sistema web progressivo (PWA) para gestão de ordens de serviço, checklist de vistoria veicular, emissão de termos de garantia e controle de orçamentos para oficina mecânica e retífica.


## 📌 Sobre o Projeto

O **Matukaj** visa modernizar e digitalizar o atendimento presencial de oficina mecânica, substituindo talões de papel por uma aplicação em nuvem de alto desempenho e **custo zero de manutenção mensal (Serverless Free Tier)**.

### ✨ Funcionalidades Principais

* **Recepção e Vistoria Visual:** Checklist interativo de itens (estepe, combustível, macaco) e marcação gráfica de avarias na lataria (riscos, batidas).
* **Gestão Dinâmica:** Conversão rápida de Orçamentos em Ordens de Serviço (OS) com 1 clique.
* **Catálogo Inteligente:** Sugestão automática (autocomplete) de serviços pré-cadastrados + digitação livre.
* **Fidelização:** Painel com alertas de aniversariantes do dia.
* **Integração WhatsApp:** Envio direto de PDFs de OS, Orçamentos e Certificados de Garantia.
* **Segurança e Backup:** Armazenamento resiliente no PostgreSQL/Supabase com backups diários na nuvem.

---

## 🚀 Teclogias Utilizadas

* **Frontend:** React + Vite + Tailwind CSS (Deploy na Vercel)
* **Backend / API:** Supabase (PostgreSQL, Auth, Storage e Edge Functions), sem API dedicada
* **Banco de Dados & Auth:** PostgreSQL + Supabase (Free Tier)
* **Integração WhatsApp:** API Baileys (Node.js) ou Link Direct Dispatch (`wa.me`)
* **CI/CD:** GitHub Actions

---

## 🛠️ Como Executar Localmente

### Pré-requisitos
* Node.js v18+
* Docker (para o Supabase local)
* Supabase CLI: já incluído como dependência em `backend/` (use `npx supabase`)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/GilJSantana/matukaj.git](https://github.com/GilJSantana/matukaj.git)
   cd matukaj
   ```

2. **Suba o Supabase local:**
   ```bash
   cd backend
   npm install
   npm start          # ao final, copie "API URL" e "anon key"
   ```

3. **Configure e rode o frontend:**
   ```bash
   cd ../frontend
   cp .env.example .env.local   # cole a API URL e a anon key
   npm install
   npm run dev                  # http://localhost:5173
   ```

## 📁 Estrutura do Repositório

```text
matukaj/
├── .github/              # Workflows de CI/CD (GitHub Actions)
├── docs/                 # Documentação C4 Model, ADRs e diagramas
│   ├── architecture/     # Diagramas Mermaid (Contexto, Container, Componentes)
│   └── adr/              # Architecture Decision Records
├── frontend/             # Aplicação React (Vite, Tailwind CSS, PWA)
└── backend/              # Supabase: migrations, seed, Edge Functions e config local
```
