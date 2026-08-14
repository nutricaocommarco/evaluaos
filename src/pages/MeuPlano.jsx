import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { usePlano } from '../contexts/PlanoContext'

export default function MeuPlano() {
  const { planoStatus, isPro } = usePlano()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [totalPacientes, setTotalPacientes] = useState(0)

  // Estado do FAQ (Acordeão)
  const [faqOpen, setFaqOpen] = useState(null)

  // Links do Checkout da Hotmart
  const LINK_CHECKOUT_MENSAL = "https://pay.hotmart.com/R106982290A?off=jfqiilu6"
  const LINK_CHECKOUT_ANUAL = "https://pay.hotmart.com/R106982290A?off=1xmn7a6b"

  // Link de Gerenciamento / Cancelamento Oficial da Hotmart
  const LINK_CANCELAMENTO_HOTMART = "https://help.hotmart.com/pt-br/article/115002183968/como-cancelar-minha-assinatura-"

  // Número do WhatsApp de Suporte do EvaluaOS
  const NUMERO_WHATSAPP_SUPORTE = "5521997704300"

  useEffect(() => {
    async function carregarDadosPlano() {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const email = session.user.email
      setUserEmail(email)

      // plano_status em si já vem do PlanoContext — aqui só falta o total
      // de pacientes, pra barra de uso do plano Grátis.
      const { count } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })

      setTotalPacientes(count || 0)
      setLoading(false)
    }

    carregarDadosPlano()
  }, [])

  // Redireciona para o checkout injetando o e-mail do cliente
  const handleGoToCheckout = (baseUrl) => {
    if (!baseUrl || baseUrl.includes("SEU_CHECKOUT")) {
      alert("⚠️ Os links de checkout serão ativados em breve! Entre em contato com o suporte.")
      return
    }
    const finalUrl = `${baseUrl}?email=${encodeURIComponent(userEmail)}`
    window.open(finalUrl, '_blank')
  }

  // Ação de Cancelamento Direcionado para a Hotmart
  const handleCancelarAssinatura = () => {
    window.open(LINK_CANCELAMENTO_HOTMART, '_blank')
  }

  // Ação de Suporte no WhatsApp
  const handleFaleConosco = () => {
    const mensagem = encodeURIComponent(`Olá! Preciso de suporte com minha conta/assinatura do EvaluaOS.\nE-mail cadastrado: ${userEmail}`)
    window.open(`https://wa.me/${NUMERO_WHATSAPP_SUPORTE}?text=${mensagem}`, '_blank')
  }

  const toggleFaq = (index) => {
    setFaqOpen(faqOpen === index ? null : index)
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-slate-400">
        Carregando informações do plano...
      </div>
    )
  }

  const percentUsoFree = Math.min(Math.round((totalPacientes / 7) * 100), 100)

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <span>Meu Plano & Assinatura</span>
            <span className="text-xl">🌟</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Gerencie seu nível de acesso, vagas de pacientes e recursos de personalização.
          </p>
        </div>

        {/* BOTÃO FALE CONOSCO (SUPORTE) */}
        <button
          onClick={handleFaleConosco}
          className="px-4 py-2 border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 dark:bg-primary-900/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0"
        >
          <span>💬</span> Fale Conosco no WhatsApp
        </button>
      </div>

      {/* 🟢 CARD DE STATUS DA CONTA */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider block">Status Atual</span>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-100">
                {isPro ? 'Plano EvaluaOS Pro' : 'Plano Gratuito'}
              </h3>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                isPro
                  ? 'bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800'
                  : planoStatus === 'suspenso'
                  ? 'bg-red-50 dark:bg-red-900/20 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
              }`}>
                {isPro ? '⭐ ATIVO' : planoStatus === 'suspenso' ? '⚠️ SUSPENSO' : '🌱 GRATUITO'}
              </span>
            </div>
          </div>

          {isPro && (
            <div className="text-left sm:text-right">
              <span className="text-xs text-gray-400 dark:text-slate-400 block">Recursos Ilimitados</span>
              <span className="text-xs font-bold text-primary-600">Acesso Total Liberado</span>
            </div>
          )}
        </div>

        {/* BARRA DE PROGRESSO DO PLANO GRATUITO */}
        {!isPro ? (
          <div className="space-y-2 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-700 dark:text-slate-300">Uso de Pacientes Grátis</span>
              <span className={totalPacientes >= 7 ? 'text-red-600' : 'text-primary-700 dark:text-primary-400'}>
                {totalPacientes} de 7 Pacientes
              </span>
            </div>

            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  totalPacientes >= 7 ? 'bg-red-500' : 'bg-primary-600'
                }`}
                style={{ width: `${percentUsoFree}%` }}
              ></div>
            </div>

            {totalPacientes >= 7 && (
              <p className="text-[11px] text-red-600 font-semibold pt-1">
                ⚠️ Você atingiu a capacidade máxima do Plano Gratuito. Assine o Pro para cadastrar novos pacientes.
              </p>
            )}
          </div>
        ) : (
          /* GERENCIAMENTO E CANCELAMENTO DA ASSINATURA PRO */
          <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300 block">Sua assinatura é gerida pela Hotmart</span>
              <p className="text-[11px] text-gray-400 dark:text-slate-400">
                Você pode gerenciar pagamentos ou solicitar o cancelamento a qualquer momento diretamente pelo portal da Hotmart.
              </p>
            </div>

            <button
              onClick={handleCancelarAssinatura}
              className="text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-red-600 underline transition-colors shrink-0"
            >
              Como Cancelar Assinatura (Hotmart)
            </button>
          </div>
        )}
      </div>

      {/* 💳 CARDS DE OFERTA / TABELA DE PLANOS */}
      <div className="space-y-4">
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Escolha o Plano Ideal para Sua Consultoria</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">Sem taxa de adesão ou contrato de fidelidade. Cancele quando quiser.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* PLANO MENSAL */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-6 relative hover:border-gray-300 transition-all">
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Flexibilidade Total</span>
              <h4 className="text-xl font-bold text-gray-900 dark:text-slate-100">Mensal Pro</h4>
              
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-900 dark:text-slate-100">R$ 29,90</span>
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">/ mês</span>
              </div>

              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Ideal para testar o sistema com total liberdade e pagamentos mensais sem compromisso de longo prazo.
              </p>

              <hr className="border-gray-100 dark:border-slate-800" />

              <ul className="text-xs text-gray-700 dark:text-slate-300 space-y-2.5 font-medium">
                <li className="flex items-center gap-2"><span className="text-primary-600 font-bold">✓</span> Pacientes Ilimitados</li>
                <li className="flex items-center gap-2"><span className="text-primary-600 font-bold">✓</span> Sua Logomarca nos Laudos</li>
                <li className="flex items-center gap-2"><span className="text-primary-600 font-bold">✓</span> Nome da sua Empresa nos Relatórios</li>
                <li className="flex items-center gap-2"><span className="text-primary-600 font-bold">✓</span> Gerenciamento e Exclusão Completa</li>
                <li className="flex items-center gap-2"><span className="text-primary-600 font-bold">✓</span> Compartilhamento de Links Interativos</li>
              </ul>
            </div>

            <button
              onClick={() => handleGoToCheckout(LINK_CHECKOUT_MENSAL)}
              className="w-full py-3 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-black shadow-sm transition-all"
            >
              {isPro ? 'Migrar para Mensal' : 'Assinar Plano Mensal'}
            </button>
          </div>

          {/* PLANO ANUAL */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-primary-500 shadow-lg flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
              🏆 Economize 30%
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">Mais Popular & Recomendado</span>
              <h4 className="text-xl font-bold text-gray-900 dark:text-slate-100">Anual Pro</h4>
              
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-primary-700 dark:text-primary-400">R$ 249,00</span>
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">/ ano</span>
              </div>
              <span className="text-[11px] text-primary-700 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 px-2 py-0.5 rounded border border-primary-100 dark:border-primary-900/40 inline-block">
                Equivalente a apenas R$ 20,75 / mês
              </span>

              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                A melhor escolha para profissionais estabelecidos. Garanta 12 meses de acesso pelo menor preço do ano.
              </p>

              <hr className="border-primary-100 dark:border-primary-900/40" />

              <ul className="text-xs text-gray-700 dark:text-slate-300 space-y-2.5 font-medium">
                <li className="flex items-center gap-2"><span className="text-primary-600 font-bold">✓</span> <strong>Todos os recursos do Plano Pro</strong></li>
                <li className="flex items-center gap-2"><span className="text-primary-600 font-bold">✓</span> Pacientes Ilimitados o ano todo</li>
                <li className="flex items-center gap-2"><span className="text-primary-600 font-bold">✓</span> Economia de R$ 109,80 comparado ao Mensal</li>
                <li className="flex items-center gap-2"><span className="text-primary-600 font-bold">✓</span> Prioridade no Suporte e Novas Atualizações</li>
              </ul>
            </div>

            <button
              onClick={() => handleGoToCheckout(LINK_CHECKOUT_ANUAL)}
              className="w-full py-3.5 bg-primary-600 text-white font-extrabold text-sm rounded-xl hover:bg-primary-700 shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{isPro ? 'Migrar para Anual (Com Desconto)' : 'Assinar Plano Anual Pro'}</span>
              <span>➔</span>
            </button>
          </div>

        </div>
      </div>

      {/* ❓ SEÇÃO DE FAQ */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-800 dark:text-slate-100 border-b border-gray-100 dark:border-slate-800 pb-3">
          Dúvidas Frequentes sobre a Assinatura
        </h3>

        <div className="space-y-2 text-xs">
          {[
            {
              q: "Posso cancelar a assinatura quando quiser?",
              a: "Sim, sem nenhuma burocracia ou taxa de cancelamento. O gerenciamento de assinatura é feito diretamente pela Hotmart, onde você pode solicitar a interrupção da renovação a qualquer momento."
            },
            {
              q: "O que acontece com os meus dados se eu voltar para o Plano Grátis?",
              a: "Seu histórico, avaliações já feitas e dados dos pacientes cadastrados continuam 100% preservados e seguros. Apenas o cadastro de novos pacientes ficará travado se você tiver mais de 7 cadastrados."
            },
            {
              q: "Como funciona a inclusão da minha Logomarca nos laudos?",
              a: "Assim que sua assinatura Pro é ativada, o envio de imagem na aba Painel do Nutricionista é liberado. Você pode enviar sua marca em JPG ou PNG de até 2MB e ela passa a aparecer automaticamente nos PDFs e links de laudos dos seus alunos."
            },
            {
              q: "Quais são as formas de pagamento aceitas?",
              a: "Aceitamos Cartão de Crédito (com aprovação imediata) e PIX. No plano Anual, você também pode parcelar no cartão de crédito."
            }
          ].map((item, idx) => (
            <div key={idx} className="border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full text-left p-3.5 bg-gray-50/50 dark:bg-slate-800/70 hover:bg-gray-50 dark:hover:bg-slate-800 font-bold text-gray-800 dark:text-slate-100 flex justify-between items-center transition-colors"
              >
                <span>{item.q}</span>
                <span className="text-gray-400 dark:text-slate-400 font-black">{faqOpen === idx ? '−' : '+'}</span>
              </button>
              {faqOpen === idx && (
                <div className="p-3.5 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 leading-relaxed border-t border-gray-100 dark:border-slate-800 animate-fade-in">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}