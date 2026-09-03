import React, { useState } from 'react'
import TabelaAlimentos from './TabelaAlimentos'
import Modelos from './Modelos'
import Receitas from './Receitas'

// Alimentos e Modelos eram dois itens separados no menu — viraram abas de
// uma página só (mesmo padrão que Financeiro.jsx usa pra Orçamentos e
// Afiliados) pra abrir espaço no menu lateral pro CRM. Nenhum dos dois
// componentes mudou por dentro, só ganharam um wrapper com abas. Receitas
// entrou depois como 3ª aba, pelo mesmo motivo — é catálogo/biblioteca
// igual aos outros dois.
export default function Biblioteca({ userId }) {
  const [abaAtiva, setAbaAtiva] = useState('alimentos') // 'alimentos' | 'modelos' | 'receitas'

  return (
    <div className="space-y-4 max-w-full min-w-0">
      {/* Alimentos e Modelos já trazem seu próprio título/contexto lá
          dentro (ver TabelaAlimentos.jsx e Modelos.jsx), então a Biblioteca
          não repete um título por cima — só a barra de abas. */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setAbaAtiva('alimentos')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
            abaAtiva === 'alimentos'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
          }`}
        >
          Alimentos
        </button>
        <button
          onClick={() => setAbaAtiva('modelos')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
            abaAtiva === 'modelos'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
          }`}
        >
          Modelos
        </button>
        <button
          onClick={() => setAbaAtiva('receitas')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
            abaAtiva === 'receitas'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
          }`}
        >
          Receitas
        </button>
      </div>

      {abaAtiva === 'alimentos' && <TabelaAlimentos userId={userId} />}
      {abaAtiva === 'modelos' && <Modelos />}
      {abaAtiva === 'receitas' && <Receitas userId={userId} />}
    </div>
  )
}
