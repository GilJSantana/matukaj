# 001. Arquitetura Serverless com custo mensal zero

Date: 2026-09-14

## Status

Aceito

## Contexto

O Matukaj precisa de uma infraestrutura inicial com **custo fixo de R$ 0,00/mês**, sem abrir mao de hospedagem publica, autenticacao de usuarios e persistencia relacional.

Ao mesmo tempo, a solucao precisa permitir entrega continua simples, operacao com baixo esforco e capacidade de crescer sem exigir provisionamento manual de servidores.

## Decisao

Adotar uma stack **serverless** baseada em:

- **Vercel** para hospedagem e deploy do frontend.
- **Supabase Free Tier** para **PostgreSQL** e **Auth**.

A Vercel atende bem o frontend web/PWA com deploy integrado ao repositorio, distribuicao gerenciada e pipeline de publicacao simples.

O Supabase Free Tier centraliza autenticacao e banco PostgreSQL gerenciado, reduzindo a necessidade de operar infraestrutura propria logo no inicio do projeto.

Essa combinacao atende o objetivo de manter **opex inicial zero**, com servicos gerenciados suficientes para validar o produto e suportar as primeiras iteracoes.

## Consequencias

### Positivas

- **Custo operacional mensal zero** no estagio inicial do produto.
- **Escalabilidade automatica** para a camada de hospedagem do frontend, sem configuracao manual de servidores.
- **CI/CD simplificado**, com fluxo de deploy mais direto a partir do repositorio.
- **Menor carga operacional**, pois hospedagem, autenticacao e banco sao oferecidos como servicos gerenciados.
- **Menor tempo de setup**, acelerando o inicio do desenvolvimento e das validacoes de negocio.

### Negativas

- O **Supabase Free Tier** possui **limite de 500 MB** para o banco de dados.
- O banco no plano gratuito pode **pausar por inatividade**, aumentando a latencia no primeiro acesso apos periodo ocioso.
- A solucao fica condicionada aos **limites operacionais e comerciais** dos tiers gratuitos.
- Eventual crescimento de uso pode exigir **migracao para planos pagos** ou revisao da arquitetura.
