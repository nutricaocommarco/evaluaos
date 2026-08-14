import React from 'react'
import PublicHeader from '../components/PublicHeader'

function Secao({ titulo, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-black text-slate-900">{titulo}</h2>
      <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <PublicHeader />

      <section className="pt-12 pb-8 bg-gradient-to-b from-emerald-50/60 via-white to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Política de Privacidade</h1>
          <p className="text-sm text-slate-500">Última atualização: agosto de 2026</p>
        </div>
      </section>

      <section className="pb-20 max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        <Secao titulo="1. Quem somos">
          <p>
            O EvaluaOS é um sistema de gestão para nutricionistas, operado por Nutrição com Marco
            (nutricaocommarco.com.br). Esta política explica quais dados coletamos, como usamos, e quais escolhas
            você tem — tanto se você é nutricionista usando o sistema quanto paciente acompanhado por um
            nutricionista que usa o EvaluaOS.
          </p>
        </Secao>

        <Secao titulo="2. Quais dados coletamos">
          <p><strong>Do nutricionista:</strong> nome, e-mail, telefone, CRN/CREF/NUMEP, dados de login e configurações da conta.</p>
          <p>
            <strong>Do paciente</strong> (cadastrados pelo nutricionista responsável pelo atendimento): nome, e-mail,
            telefone, data de nascimento e dados de saúde relacionados ao acompanhamento nutricional/antropométrico
            (medidas corporais, avaliações, planos alimentares, exames laboratoriais, respostas a questionários).
          </p>
          <p>
            Dados de saúde são tratados com cuidado adicional: por padrão, informações sensíveis (como resultados de
            exames) só ficam visíveis ao paciente quando o nutricionista libera explicitamente essa visibilidade.
          </p>
        </Secao>

        <Secao titulo="3. Como usamos os dados">
          <p>
            Usamos os dados exclusivamente para operar o EvaluaOS: permitir que o nutricionista registre e acompanhe
            seus pacientes, gere relatórios/laudos, organize sua agenda de consultas e disponibilize informações ao
            paciente através da Área do Paciente. Não usamos os dados dos pacientes para publicidade nem os
            vendemos a terceiros.
          </p>
        </Secao>

        <Secao titulo="4. Integração com o Google Calendar">
          <p>
            O nutricionista pode, de forma opcional, conectar sua própria conta do Google (Nutricionista &gt;
            Integrações) para que o EvaluaOS crie automaticamente eventos na agenda do Google Calendar dele quando
            ele marca uma consulta, incluindo um link de videochamada do Google Meet.
          </p>
          <p>
            Essa conexão exige autorização explícita do nutricionista via OAuth do Google. O EvaluaOS acessa
            <strong> somente</strong> o escopo necessário para criar/gerenciar esses eventos de consulta
            (<code>calendar.events</code>) — não lemos outros eventos, contatos, e-mails ou qualquer outro dado da
            conta Google do nutricionista, e não compartilhamos esses dados com terceiros. O nutricionista pode
            desconectar essa integração a qualquer momento.
          </p>
        </Secao>

        <Secao titulo="5. Integração com WhatsApp">
          <p>
            O nutricionista pode, de forma opcional, conectar o próprio número de WhatsApp para enviar avisos de
            agendamento e lembretes de consulta aos pacientes. Essas mensagens são enviadas pelo número do próprio
            nutricionista, não por um número da plataforma, e o conteúdo se limita a informações da consulta
            (data, horário, local ou link de videochamada).
          </p>
        </Secao>

        <Secao titulo="6. Armazenamento e segurança">
          <p>
            Os dados são armazenados em infraestrutura do Supabase, com controle de acesso por usuário (cada
            nutricionista só acessa os dados dos próprios pacientes) e conexão criptografada. Tokens de acesso a
            integrações (Google, WhatsApp) são armazenados de forma restrita, acessível apenas pelos serviços
            internos do EvaluaOS que precisam deles para funcionar.
          </p>
        </Secao>

        <Secao titulo="7. Compartilhamento com terceiros">
          <p>
            Não vendemos nem compartilhamos dados pessoais ou de saúde com terceiros para fins comerciais. Dados só
            são compartilhados com prestadores de infraestrutura estritamente necessários pra operar o sistema
            (hospedagem, banco de dados), sempre sob obrigação de confidencialidade.
          </p>
        </Secao>

        <Secao titulo="8. Seus direitos (LGPD)">
          <p>
            Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar a confirmação da
            existência de tratamento, acesso, correção, anonimização, portabilidade ou exclusão dos seus dados, além
            de revogar consentimentos dados anteriormente. Pacientes devem direcionar essas solicitações ao
            nutricionista responsável pelo seu atendimento (titular dos dados cadastrados); nutricionistas podem
            solicitar diretamente pelo contato abaixo.
          </p>
        </Secao>

        <Secao titulo="9. Alterações nesta política">
          <p>
            Podemos atualizar esta política eventualmente para refletir mudanças no sistema ou na legislação. A data
            da última atualização sempre aparece no topo desta página.
          </p>
        </Secao>

        <Secao titulo="10. Contato">
          <p>
            Dúvidas sobre esta política ou sobre o tratamento dos seus dados? Fale conosco em{' '}
            <a href="mailto:contato@nutricaocommarco.com.br" className="text-emerald-600 font-semibold hover:underline">
              contato@nutricaocommarco.com.br
            </a>.
          </p>
        </Secao>
      </section>

      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="font-bold text-white text-sm">EvaluaOS</span>
            <p className="text-slate-500">Desenvolvido com rigor científico pra nutricionistas cuidarem de toda a jornada do paciente.</p>
          </div>
          <div className="flex items-center gap-6 text-slate-300 font-semibold">
            <a href="mailto:contato@nutricaocommarco.com.br" className="hover:text-emerald-400 transition-colors">
              ✉️ contato@nutricaocommarco.com.br
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
