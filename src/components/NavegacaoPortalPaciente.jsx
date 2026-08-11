import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, TrendingUp, FileText, Utensils, MessageSquare, ClipboardList, ListChecks, Menu as MenuIcon, X } from 'lucide-react'

// Navegação entre as telas do paciente (Início, Evolução, Laudo, Plano,
// Orientações, Listas, Questionários) — só aparece pra quem está vendo o
// link sem estar logado (paciente de verdade). Quando o nutri abre o
// próprio link estando logado, ele já tem a navegação do app normal, então
// essa barra ficaria redundante/confusa.
// No celular vira um botão de menu (☰) que abre um drawer — a lista só
// tende a crescer, e uma grade fixa não escala bem em tela pequena.
// No desktop continua uma grade sempre visível (tem espaço de sobra).
export default function NavegacaoPortalPaciente({ tokenPaciente, tokenLaudo, ativo }) {
  const navigate = useNavigate()
  const [mobileAberto, setMobileAberto] = useState(false)

  const itens = [
    { key: 'inicio', label: 'Início', icone: Home, href: `/area/${tokenPaciente}` },
    { key: 'evolucao', label: 'Evolução', icone: TrendingUp, href: `/evolucao/${tokenPaciente}` },
    { key: 'laudo', label: 'Laudo', icone: FileText, href: tokenLaudo ? `/laudo/${tokenLaudo}` : null },
    { key: 'plano', label: 'Plano', icone: Utensils, href: `/area/${tokenPaciente}/plano` },
    { key: 'orientacoes', label: 'Orientações', icone: MessageSquare, href: `/area/${tokenPaciente}/orientacoes` },
    { key: 'listas', label: 'Listas', icone: ListChecks, href: `/area/${tokenPaciente}/listas` },
    { key: 'questionarios', label: 'Questionários', icone: ClipboardList, href: `/area/${tokenPaciente}/questionarios` },
  ]

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
                      disabled={!item.href}
                      title={!item.href ? 'Ainda não disponível' : ''}
                      className={`w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
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
              onClick={() => item.href && navigate(item.href)}
              disabled={!item.href}
              title={!item.href ? 'Ainda não disponível' : ''}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-lg text-[11px] font-semibold text-center leading-tight transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
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
