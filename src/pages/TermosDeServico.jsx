import React from 'react'
import { Link } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'

function Secao({ titulo, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-black text-slate-900">{titulo}</h2>
      <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function TermosDeServico() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <PublicHeader />

      <section className="pt-12 pb-8 bg-gradient-to-b from-emerald-50/60 via-white to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Termos de Serviço</h1>
          <p className="text-sm text-slate-500">Última atualização: agosto de 2026</p>
        </div>
      </section>

      <section className="pb-20 max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        <Secao titulo="1. Aceitação dos termos">
          <p>
            Ao criar uma conta ou usar o EvaluaOS, você concorda com estes Termos de Serviço e com a nossa{' '}
            <Link to="/politica-de-privacidade" className="text-emerald-600 font-semibold hover:underline">
              Política de Privacidade
            </Link>. Se você não concorda, não deve usar o sistema.
          </p>
        </Secao>

        <Secao titulo="2. O que é o EvaluaOS">
          <p>
            O EvaluaOS é um sistema de gestão para nutricionistas e antropometristas: cadastro de pacientes,
            avaliações antropométricas, planos alimentares, prontuário, agenda de consultas e portal do paciente,
            entre outras funcionalidades. O EvaluaOS é uma ferramenta de apoio à prática profissional — não presta
            atendimento nutricional nem substitui o julgamento clínico do profissional responsável.
          </p>
        </Secao>

        <Secao titulo="3. Contas e responsabilidades">
          <p>
            O nutricionista é responsável por manter a confidencialidade da própria senha, pela veracidade dos dados
            que cadastra, e por obter o consentimento necessário dos pacientes para registrar e compartilhar as
            informações deles no sistema, incluindo dados de saúde. O EvaluaOS não verifica registro profissional
            (CRN/CREF) nem se responsabiliza por decisões clínicas tomadas pelo profissional.
          </p>
        </Secao>

        <Secao titulo="4. Planos e cobrança">
          <p>
            O EvaluaOS oferece um plano gratuito com limites de uso e planos pagos com recursos adicionais,
            detalhados na página de{' '}
            <Link to="/precos" className="text-emerald-600 font-semibold hover:underline">Preços</Link>. Cobranças de
            planos pagos são recorrentes até o cancelamento, que pode ser feito a qualquer momento pelo próprio
            usuário.
          </p>
        </Secao>

        <Secao titulo="5. Integrações opcionais (Google Calendar e WhatsApp)">
          <p>
            O nutricionista pode conectar, de forma totalmente opcional, sua própria conta do Google Calendar e seu
            próprio número de WhatsApp para automatizar agendamentos e avisos aos pacientes. O uso dessas
            integrações é de responsabilidade do nutricionista, incluindo o cumprimento dos termos de uso dessas
            plataformas de terceiros. Mais detalhes sobre o que cada integração acessa estão na{' '}
            <Link to="/politica-de-privacidade" className="text-emerald-600 font-semibold hover:underline">
              Política de Privacidade
            </Link>.
          </p>
        </Secao>

        <Secao titulo="6. Uso aceitável">
          <p>
            É proibido usar o EvaluaOS para fins ilegais, para armazenar dados de pessoas sem base legal/consentimento
            adequado, para enviar mensagens não solicitadas em massa através das integrações de WhatsApp, ou para
            tentar acessar dados de outros nutricionistas sem autorização.
          </p>
        </Secao>

        <Secao titulo="7. Propriedade intelectual">
          <p>
            O software, marca e design do EvaluaOS pertencem à Nutrição com Marco. Os dados que você cadastra
            (pacientes, avaliações, planos) continuam sendo seus — você pode exportá-los ou solicitar a exclusão a
            qualquer momento.
          </p>
        </Secao>

        <Secao titulo="8. Limitação de responsabilidade">
          <p>
            O EvaluaOS é fornecido "como está". Fazemos o possível para manter o sistema disponível e os dados
            seguros, mas não garantimos disponibilidade ininterrupta e não nos responsabilizamos por decisões
            clínicas, nutricionais ou de saúde tomadas com base no uso do sistema — essa responsabilidade é do
            profissional que presta o atendimento.
          </p>
        </Secao>

        <Secao titulo="9. Cancelamento e encerramento">
          <p>
            Você pode encerrar sua conta a qualquer momento. Podemos suspender ou encerrar contas que violem estes
            termos, mediante aviso prévio quando possível.
          </p>
        </Secao>

        <Secao titulo="10. Alterações nestes termos">
          <p>
            Podemos atualizar estes termos eventualmente. A data no topo desta página sempre reflete a versão mais
            recente. O uso continuado do sistema após uma atualização representa concordância com os novos termos.
          </p>
        </Secao>

        <Secao titulo="11. Lei aplicável e contato">
          <p>
            Estes termos são regidos pela legislação brasileira. Dúvidas? Fale conosco em{' '}
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
