-- Liga/Desliga do Diário Alimentar por paciente — o nutricionista pode
-- desativar pra um paciente específico (ex: não quer que esse paciente
-- fique registrando/comparando comida agora). Default true: quem já tem
-- plano ativo continua vendo o diário normalmente, sem precisar de nenhuma
-- ação manual pra "ligar" pra todo mundo que já usa a feature.
alter table public.pacientes
  add column if not exists diario_alimentar_ativo boolean not null default true;
