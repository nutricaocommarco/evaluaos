-- Conexão WhatsApp por nutricionista (Evolution API — protocolo
-- WhatsApp Web/Baileys via QR Code, não a API oficial da Meta). A chave
-- da gateway (EVOLUTION_API_KEY) e a URL dela NUNCA entram no banco —
-- ficam só como env var nas funções serverless (api/whatsapp/*.js,
-- api/_lib/evolution.js). Aqui só fica o nome da instância e o status
-- de conexão, informação não-sensível, com o mesmo acesso normal do
-- resto da tabela avaliadores.
alter table public.avaliadores
  add column if not exists whatsapp_instancia text;

alter table public.avaliadores
  add column if not exists whatsapp_conectado boolean not null default false;

alter table public.avaliadores
  add column if not exists whatsapp_numero text;
