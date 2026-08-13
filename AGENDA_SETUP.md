# Setup do módulo de Agenda (Google Calendar + Meet + WhatsApp)

O código já está pronto e commitado na branch `Nutricionista`. Falta configurar 3 coisas fora do repositório antes de dar pra testar/usar de verdade: rodar as migrations, criar as credenciais do Google, e subir a VM do WhatsApp. Nenhuma delas tem custo.

## 1. Rodar as migrations

Rode `0039_agendamentos.sql`, `0040_google_conexao_avaliador.sql` e `0041_whatsapp_avaliador.sql` no SQL Editor do Supabase, nessa ordem (já te mandei os 3 arquivos).

## 2. Google Cloud — OAuth do Calendar/Meet

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) com a sua conta Google (a mesma que você quer usar pra faturamento/VM grátis).
2. Crie um projeto novo (ou reaproveite um existente).
3. Em **APIs e serviços > Biblioteca**, ative a **Google Calendar API**.
4. Em **APIs e serviços > Tela de consentimento OAuth**: tipo "Externo", preencha nome do app ("EvaluaOS") e e-mail de contato. Não precisa de verificação do Google pra uso inicial (fica em modo "Teste" — funciona igual, só limita a 100 usuários de teste, que dá pra aumentar depois).
5. Em **APIs e serviços > Credenciais > Criar credenciais > ID do cliente OAuth**: tipo "Aplicativo da Web". Em "URIs de redirecionamento autorizados", adicione:
   - `https://evaluaos.nutricaocommarco.com.br/oauth/google/callback`
   - (e a URL de qualquer ambiente de Preview da Vercel que você for testar, se for o caso)
6. Copie o **Client ID** e o **Client Secret** gerados.

## 3. Google Cloud — VM grátis pro WhatsApp (Evolution API)

1. No mesmo projeto do Google Cloud, ative o **Compute Engine**.
2. Crie uma VM `e2-micro`, numa das regiões elegíveis pro Always Free: `us-west1`, `us-central1` ou `us-east1`.
3. Na VM, instale o Docker ([passo a passo oficial](https://docs.docker.com/engine/install/debian/) pra Debian).
4. A imagem atual e mantida do projeto é `evoapicloud/evolution-api` (a antiga `atendai/evolution-api` foi descontinuada). A versão 2.x **exige um banco Postgres** — não roda mais só com um container. Setup mínimo (Redis desligado, cache local no lugar):
   ```bash
   sudo docker network create evolution-net

   sudo docker run -d --name evolution-postgres --restart unless-stopped \
     --network evolution-net \
     -e POSTGRES_USER=evolution \
     -e POSTGRES_PASSWORD=<senha forte> \
     -e POSTGRES_DB=evolution_db \
     -v evolution_postgres_data:/var/lib/postgresql/data \
     postgres:15

   sudo docker run -d --name evolution-api --restart unless-stopped \
     --network evolution-net \
     -p 8080:8080 \
     -e AUTHENTICATION_API_KEY=<gere uma chave forte aqui> \
     -e DATABASE_PROVIDER=postgresql \
     -e DATABASE_CONNECTION_URI="postgresql://evolution:<senha forte>@evolution-postgres:5432/evolution_db?schema=evolution_api" \
     -e CACHE_REDIS_ENABLED=false \
     -e CACHE_LOCAL_ENABLED=true \
     -v evolution_data:/evolution/instances \
     evoapicloud/evolution-api:latest
   ```
   Se `docker login` pedir autenticação num pull público, pode ser rate-limit de conta anônima do Docker Hub — crie uma conta grátis e rode `sudo docker login -u <usuario>` (com sudo, senão as credenciais não valem pro `docker run` que também usa sudo) usando um Personal Access Token como senha.
5. Libere a porta 8080 no firewall da VM: **VPC network → Firewall → Criar regra de firewall**, destinos "Todas as instâncias na rede", origem `0.0.0.0/0`, TCP porta `8080`.
6. Anote a URL (`http://<ip-externo-da-vm>:8080`) e a `AUTHENTICATION_API_KEY` que você definiu.

## 4. Variáveis de ambiente na Vercel

Em **Project Settings > Environment Variables** no projeto da Vercel, adicione (todas sem prefixo `VITE_`, pra nunca irem pro client):

| Variável | Valor |
|---|---|
| `GOOGLE_CLIENT_ID` | do passo 2 |
| `GOOGLE_CLIENT_SECRET` | do passo 2 |
| `GOOGLE_OAUTH_STATE_SECRET` | qualquer string aleatória longa (ex: `openssl rand -hex 32`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API > `service_role` (secret) |
| `EVOLUTION_API_URL` | `http://<ip-externo-da-vm>:8080` (passo 3) |
| `EVOLUTION_API_KEY` | a `AUTHENTICATION_API_KEY` que você definiu (passo 3) |
| `CRON_SECRET` | qualquer string aleatória longa (ex: `openssl rand -hex 32`) |

Depois de adicionar, faça um novo deploy (ou redeploy) pra elas entrarem em vigor.

## 5. Testar

1. Painel do Nutricionista > seção "5. Integrações" > "Conectar Google Calendar" — deve te levar pro consentimento do Google e voltar mostrando o e-mail conectado.
2. "Conectar WhatsApp" — deve mostrar um QR Code; escaneie com um **número de teste** (não seu WhatsApp real ainda, dado o risco de bloqueio já combinado).
3. Vá em Agenda > Criar agendamento — confirme que aparece o evento no Google Calendar real com link do Meet, e que chega uma mensagem de confirmação no WhatsApp de teste.
4. Pra testar o lembrete sem esperar o cron rodar sozinho (ele roda 1x por dia, 8h BRT):
   ```bash
   curl -H "Authorization: Bearer <CRON_SECRET>" https://evaluaos.nutricaocommarco.com.br/api/cron/lembretes-agendamento
   ```
   contra um agendamento marcado pra daqui ~24h.
