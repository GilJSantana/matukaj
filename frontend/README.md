# Matukaj - Frontend

React + Vite + TypeScript + Tailwind CSS v4 + Lucide.

```bash
cp .env.example .env.local   # preencha as variaveis do Supabase
npm install
npm run dev                  # http://localhost:5173
```

O app sobe mesmo sem o `.env.local`; nesse caso o cliente Supabase fica `null`.

## Estrutura

```text
src/
├── components/   # Componentes de UI reutilizaveis
├── hooks/        # Hooks customizados
├── pages/        # Telas
└── services/     # Acesso a dados e integracoes (Supabase, wa.me)
```
