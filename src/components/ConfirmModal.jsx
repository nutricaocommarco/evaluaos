import React from 'react'

// Confirmação de exclusão mais difícil de "clicar sem querer" que um
// window.confirm nativo (que aceita Enter/clique automático de teclado
// repetido) — modal de verdade, com o que vai ser perdido explícito e um
// botão vermelho que exige um clique deliberado.
export default function ConfirmModal({ titulo, mensagem, detalhes, textoConfirmar = 'Excluir', onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onCancelar}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-gray-800 dark:text-slate-100">{titulo}</h3>
        <p className="text-sm text-gray-600 dark:text-slate-300">{mensagem}</p>
        {detalhes && <p className="text-xs text-gray-400 dark:text-slate-500">{detalhes}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancelar} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200">
            Cancelar
          </button>
          <button type="button" onClick={onConfirmar} className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700">
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
