import React from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Liga/Desliga reutilizável pra controlar o que o paciente vê (planos,
// avaliações/laudo, orientações, listas de recomendações). `onToggle`
// recebe o evento do clique — quem usa decide se precisa de
// e.stopPropagation() (ex: quando o switch fica dentro de um elemento
// clicável maior, como o pill de seleção de plano).
export default function InterruptorVisibilidade({ ativo, onToggle, titulo, textoAtivo, textoInativo }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={titulo || (ativo ? 'Visível pro paciente — clique pra esconder' : 'Oculto pro paciente — clique pra mostrar')}
      className={`shrink-0 flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full text-[10px] font-bold transition-colors ${
        ativo
          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
          : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
      }`}
    >
      <span
        className={`relative w-8 h-4 rounded-full transition-colors ${ativo ? 'bg-primary-600' : 'bg-gray-300 dark:bg-slate-600'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${ativo ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </span>
      {ativo ? <Eye size={11} /> : <EyeOff size={11} />}
      {(textoAtivo || textoInativo) && <span>{ativo ? textoAtivo : textoInativo}</span>}
    </button>
  )
}
