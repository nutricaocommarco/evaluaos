import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Home, TrendingUp, FileText, Utensils, NotebookPen, MessageSquare, ClipboardList, ClipboardCheck, ListChecks, FlaskConical, Calendar, ChefHat, Menu as MenuIcon, X } from 'lucide-react'

// Navegação entre as telas do paciente (Início, Evolução, Laudo, Plano,
// Orientações, Listas, Questionários) — só aparece pra quem está vendo o
// link sem estar logado (paciente de verdade). Quando o nutri abre o
// próprio link estando logado, ele já tem a navegação do app normal, então
// essa barra ficaria redundante/confusa.
// No celular vira um botão de menu (☰) que abre um drawer — a lista só
// tende a crescer, e uma grade fixa não escala bem em tela pequena.
// No desktop continua uma grade sempre visível (tem espaço de sobra).
//
// temAgendamentos é opcional — quando a página já sabe a resposta (ex:
// AreaPaciente.jsx, que já busca essa contagem pra outra coisa), passa
// direto e evita uma query à toa. Quando não passa (a maioria das
// páginas do portal), o componente resolve sozinho consultando pelo
// tokenPaciente — assim o item "Agenda" aparece certo em todo lugar,
// sem precisar duplicar a mesma contagem em cada página.
export default function NavegacaoPortalPaciente({ tokenPaciente, tokenLaudo, temAgendamentos, ativo }) {
  const navigate = useNavigate()
  const [mobileAberto, setMobileAberto] = useState(false)
  const [temAgendamentosResolvido, setTemAgendamentosResolvido] = useState(false)
  const [temCheckins, setTemCheckins] = useState(false)
  const [temPlano, setTemPlano] = useState(false)
  const [diarioAtivo, setDiarioAtivo] = useState(false)
  const [temReceitas, setTemReceitas] = useState(false)

  useEffect(() => {
    let cancelado = false

    async function checar() {
      const { data: pacData } = await supabase
        .from('pacientes')
        .select('id, diario_alimentar_ativo')
        .eq('token_publico', tokenPaciente)
        .maybeSingle()
      if (!pacData || cancelado) return

      if (temAgendamentos === undefined) {
        const { count } = await supabase
          .from('agendamentos')
          .select('id', { count: 'exact', head: true })
          .eq('id_paciente', pacData.id)
          .eq('status', 'confirmado')
          .eq('visivel_paciente', true)
          .gte('data_inicio', new Date().toISOString())

        if (!cancelado) setTemAgendamentosResolvido((count || 0) > 0)
      }

      const { count: countCheckins } = await supabase
        .from('checkins_semanais_pacientes')
        .select('id', { count: 'exact', head: true })
        .eq('id_paciente', pacData.id)

      if (!cancelado) setTemCheckins((countCheckins || 0) > 0)

      const { count: countPlano } = await supabase
        .from('planos_alimentares')
        .select('id', { count: 'exact', head: true })
        .eq('id_paciente', pacData.id)
        .eq('ativo', true)

      if (!cancelado) setTemPlano((countPlano || 0) > 0)
      if (!cancelado) setDiarioAtivo(pacData.diario_alimentar_ativo !== false)

      const { count: countReceitas } = await supabase
        .from('receitas_pacientes')
        .select('id', { count: 'exact', head: true })
        .eq('id_paciente', pacData.id)

      if (!cancelado) setTemReceitas((countReceitas || 0) > 0)
    }
    checar()

    return () => { cancelado = true }
  }, [tokenPaciente, temAgendamentos])

  const agendaDisponivel = temAgendamentos !== undefined ? temAgendamentos : temAgendamentosResolvido

  // Laudo e Evolução só existem se o paciente já tem alguma avaliação
  // antropométrica visível — sem isso, nem aparecem no menu (em vez de
  // aparecer desabilitado/cinza, o que só confunde).
  const itensTodos = [
    { key: 'inicio', label: 'Início', icone: Home, href: `/area/${tokenPaciente}` },
    { key: 'evolucao', label: 'Evolução', icone: TrendingUp, href: tokenLaudo ? `/evolucao/${tokenPaciente}` : null },
    { key: 'laudo', label: 'Laudo', icone: FileText, href: tokenLaudo ? `/laudo/${tokenLaudo}` : null },
    { key: 'plano', label: 'Plano', icone: Utensils, href: `/area/${tokenPaciente}/plano` },
    { key: 'diario', label: 'Diário', icone: NotebookPen, href: temPlano && diarioAtivo ? `/area/${tokenPaciente}/diario` : null },
    { key: 'orientacoes', label: 'Orientações', icone: MessageSquare, href: `/area/${tokenPaciente}/orientacoes` },
    { key: 'listas', label: 'Listas', icone: ListChecks, href: `/area/${tokenPaciente}/listas` },
    { key: 'receitas', label: 'Receitas', icone: ChefHat, href: temReceitas ? `/area/${tokenPaciente}/receitas` : null },
    { key: 'exames', label: 'Exames', icone: FlaskConical, href: `/area/${tokenPaciente}/exames` },
    { key: 'agenda', label: 'Agenda', icone: Calendar, href: agendaDisponivel ? `/area/${tokenPaciente}/agenda` : null },
    { key: 'checkin', label: 'Check-in', icone: ClipboardCheck, href: temCheckins ? `/area/${tokenPaciente}/checkin` : null },
    { key: 'questionarios', label: 'Questionários', icone: ClipboardList, href: `/area/${tokenPaciente}/questionarios` },
  ]
  const itens = itensTodos.filter((i) => i.href)

  const itemAtivo = itens.find((i) => i.key === ativo)

  const irPara = (item) => {
    if (!item.href) return
    setMobileAberto(false)
    navigate(item.href)
  }

  return (
    <>
      {/* Celular: botão de menu + drawer */}
      <div className="sm:hidden">
        <button
          onClick={() => setMobileAberto(true)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-300"
        >
          <span className="flex items-center gap-2 min-w-0">
            <MenuIcon size={18} className="shrink-0" />
            <span className="truncate">{itemAtivo?.label || 'Menu'}</span>
          </span>
        </button>

        {mobileAberto && (
          <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileAberto(false)} />
            <div className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 shadow-xl flex flex-col ml-auto">
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <p className="text-sm font-black text-gray-800 dark:text-slate-100">Menu</p>
                <button onClick={() => setMobileAberto(false)} className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                {itens.map((item) => {
                  const Icone = item.icone
                  return (
                    <button
                      key={item.key}
                      onClick={() => irPara(item)}
                      className={`w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        ativo === item.key
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icone size={16} className="shrink-0" />
                      {item.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Desktop/tablet: grade sempre visível */}
      <div className="hidden sm:grid sm:grid-cols-4 gap-2">
        {itens.map((item) => {
          const Icone = item.icone
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.href)}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-lg text-[11px] font-semibold text-center leading-tight transition-colors ${
                ativo === item.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icone size={16} />
              {item.label}
            </button>
          )
        })}
      </div>
    </>
  )
}
