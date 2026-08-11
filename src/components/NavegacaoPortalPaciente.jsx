import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, TrendingUp, FileText, Utensils, MessageSquare, ClipboardList, ListChecks } from 'lucide-react'

// Barra de navegação entre as telas do paciente (Início, Evolução, Laudo,
// Plano, Orientações, Listas, Questionários) — só aparece pra quem está
// vendo o link sem estar logado (paciente de verdade). Quando o nutri abre
// o próprio link estando logado, ele já tem a navegação do app normal,
// então essa barra ficaria redundante/confusa.
// Grade (não linha com scroll) pra caber os 7 itens sem precisar arrastar
// o dedo no celular.
export default function NavegacaoPortalPaciente({ tokenPaciente, tokenLaudo, ativo }) {
  const navigate = useNavigate()

  const itens = [
    { key: 'inicio', label: 'Início', icone: Home, href: `/area/${tokenPaciente}` },
    { key: 'evolucao', label: 'Evolução', icone: TrendingUp, href: `/evolucao/${tokenPaciente}` },
    { key: 'laudo', label: 'Laudo', icone: FileText, href: tokenLaudo ? `/laudo/${tokenLaudo}` : null },
    { key: 'plano', label: 'Plano', icone: Utensils, href: `/area/${tokenPaciente}/plano` },
    { key: 'orientacoes', label: 'Orientações', icone: MessageSquare, href: `/area/${tokenPaciente}/orientacoes` },
    { key: 'listas', label: 'Listas', icone: ListChecks, href: `/area/${tokenPaciente}/listas` },
    { key: 'questionarios', label: 'Questionários', icone: ClipboardList, href: `/area/${tokenPaciente}/questionarios` },
  ]

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
  )
}
