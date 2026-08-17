import React from 'react'
import { ArrowLeft } from 'lucide-react'

// Cabeçalho de marca compartilhado entre as páginas públicas da Área do
// Paciente — mesmo padrão visual (logo/empresa/avaliador + crédito "Gerado
// via EvaluaOS") já usado em ResultadoAvaliacao.jsx e EvolucaoPaciente.jsx,
// só que num componente único em vez de duplicado em cada página.
export default function CabecalhoPortalPaciente({ logomarcaUrl, nomeEmpresa, nomeAvaliador, aoVoltar }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {logomarcaUrl ? (
            <img src={logomarcaUrl} alt="Logo" className="h-14 w-auto object-contain" />
          ) : (
            <div className="h-12 w-12 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wide">{nomeEmpresa || 'Consultório'}</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">Nutricionista: <span className="font-semibold text-gray-700 dark:text-slate-300">{nomeAvaliador || '-'}</span></p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-400 dark:text-slate-400 font-medium tracking-wide">
            Gerado via <a href="https://evaluaos.nutricaocommarco.com.br" target="_blank" rel="noopener noreferrer" className="font-bold text-primary-600 hover:underline">EvaluaOS</a>
          </span>
          {aoVoltar && (
            <button onClick={aoVoltar} className="flex items-center gap-1 text-xs text-primary-600 font-semibold hover:underline mt-2">
              <ArrowLeft size={13} /> Voltar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
