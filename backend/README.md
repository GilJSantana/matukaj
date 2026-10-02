# Matukaj - Backend (Supabase)

O backend e o proprio Supabase: PostgreSQL, Auth, Storage e, quando houver regra de negocio que nao deve rodar no navegador, Edge Functions (Deno/TypeScript). Nao ha API dedicada.

## Pre-requisitos

- Node.js v18+ (o Supabase CLI e instalado como devDependency)
- Docker em execucao (para o ambiente local)

## Comandos

```bash
npm install
npm start                          # sobe Postgres, Auth, Storage e Studio locais
npm run status                     # mostra URL da API e anon key para o frontend/.env.local
npm run migration:new -- <nome>    # cria supabase/migrations/<timestamp>_<nome>.sql
npm run db:reset                   # recria o banco aplicando migrations + seed.sql
npm run types                      # gera frontend/src/services/database.types.ts
npx supabase test db               # roda os testes pgTAP de supabase/tests/database
npm stop
```

Studio local: http://127.0.0.1:54323

Usuario local criado pelo `seed.sql`: `admin@matukaj.local` / `matukaj123`.

O cadastro publico esta desligado (`enable_signup = false`): usuarios sao criados pelo Studio e precisam de uma linha ativa em `perfis` para acessar os dados. Na nuvem, desligue em Authentication > Sign In / Providers > "Allow new users to sign up".

## Estrutura

```text
supabase/
├── config.toml    # configuracao do ambiente local
├── migrations/    # schema versionado (ver docs/adr/003-modelagem-banco-dados.md)
├── tests/         # testes pgTAP (supabase test db)
├── functions/     # Edge Functions
└── seed.sql       # dados iniciais (oficina_config, checklist_modelos)
```
