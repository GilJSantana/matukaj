# Arquitetura Técnica e de Dados - Modelo C4

Este documento descreve a arquitetura do sistema **Matukaj** em 3 níveis do modelo C4, usando diagramas Mermaid compatíveis com o preview do GitHub.

## Nível 1 - Contexto

```mermaid
flowchart TB
    mecanico["Mecânico<br/>Opera atendimentos, vistorias e ordens de serviço"]
    cliente["Cliente<br/>Recebe orçamentos, OS, garantias e aprovações"]

    subgraph matukaj["Sistema Matukaj"]
        sistema["Plataforma web para gestão de oficina,<br/>vistoria veicular, orçamento, OS e garantia"]
    end

    subgraph supabase["Supabase"]
        supa["Auth, banco de dados PostgreSQL e armazenamento de arquivos"]
    end

    whatsapp["WhatsApp API / wa.me<br/>Canal de envio e abertura de conversa"]

    mecanico -->|"Usa via navegador/PWA"| sistema
    cliente -->|"Interage por links, PDFs e mensagens"| sistema
    sistema -->|"Autenticação, persistência e arquivos"| supa
    sistema -->|"Gera links e despacha comunicação"| whatsapp
    cliente <-->|"Recebe mensagens, links e documentos"| whatsapp
```

## Nível 2 - Contêineres

```mermaid
flowchart TB
    mecanico["Mecânico"]
    cliente["Cliente"]

    subgraph vercel["Vercel"]
        pwa["Frontend PWA<br/>React + Vite + Tailwind<br/>UI, fluxos operacionais e experiência mobile"]
    end

    subgraph backend_api["Backend API"]
        api["Supabase Edge Functions<br/>Regras de negócio, composição de dados e integração externa"]
    end

    subgraph supabase["Supabase"]
        auth["Supabase Auth<br/>Login, sessão e controle de acesso"]
        postgres["PostgreSQL<br/>Clientes, veículos, checklists, orçamentos, OS e garantias"]
        storage["Supabase Storage<br/>PDFs, anexos e artefatos emitidos"]
    end

    whatsapp["WhatsApp API / wa.me"]

    mecanico -->|"Opera a aplicação"| pwa
    cliente -->|"Recebe links e documentos"| whatsapp

    pwa -->|"Autenticação do usuário"| auth
    pwa -->|"Consulta e grava dados do negócio"| api
    pwa -->|"Upload e leitura de arquivos"| storage

    api -->|"Valida identidade e permissões"| auth
    api -->|"Lê e persiste dados transacionais"| postgres
    api -->|"Armazena PDFs e anexos"| storage
    api -->|"Dispara compartilhamento e links"| whatsapp

    auth -->|"Tokens e contexto de acesso"| pwa
    storage -->|"Arquivos publicados/privados"| pwa
```

## Nível 3 - Componentes

```mermaid
flowchart TB
    pwa["PWA React/Vite"]
    auth["Supabase Auth"]
    postgres["PostgreSQL"]
    storage["Supabase Storage"]
    whatsapp["WhatsApp API / wa.me"]

    subgraph api["Backend API"]
        checklist["Checklist / Vistoria<br/>Captura inspeção visual, itens e avarias"]
        osengine["OS Engine<br/>Converte orçamento em OS e orquestra ciclo operacional"]
        pdf["PDF Generator<br/>Monta OS, orçamento e garantia para compartilhamento"]
    end

    pwa -->|"Envia dados de vistoria"| checklist
    pwa -->|"Solicita criação e atualização de OS"| osengine
    pwa -->|"Solicita emissão de documentos"| pdf

    pwa -->|"Autentica usuário"| auth

    checklist -->|"Lê/grava checklists, veículos e clientes"| postgres
    osengine -->|"Lê/grava orçamentos, OS e garantias"| postgres
    pdf -->|"Lê dados consolidados do processo"| postgres

    pdf -->|"Armazena PDFs gerados"| storage
    pwa -->|"Consulta/baixa documentos"| storage

    osengine -->|"Aciona envio de documentos e links"| whatsapp
    pdf -->|"Fornece arquivo pronto para compartilhamento"| osengine
```

## Observações de Arquitetura

- O **Frontend PWA** concentra a experiência operacional do mecânico e pode funcionar como interface principal em desktop e mobile.
- O **Supabase** atua como núcleo de dados, autenticação e armazenamento de artefatos do sistema.
- O **Backend API** encapsula regras de negócio e integrações, mantendo o frontend desacoplado da lógica operacional.
- O fluxo de **WhatsApp** é orientado a compartilhamento de links e documentos gerados, incluindo uso de `wa.me` quando aplicável.
