-- Chave Pix do nutricionista, cadastrada uma vez no perfil e usada
-- automaticamente em todo Orçamento/Protocolo gerado (evita digitar de
-- novo em cada PDF).
alter table public.avaliadores add column if not exists chave_pix text;

comment on column public.avaliadores.chave_pix is 'Chave Pix exibida automaticamente nos orçamentos/protocolos gerados.';
