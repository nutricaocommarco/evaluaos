import React, { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'
import { obterTabelaReferencia } from '../utils/escalasNormativas'

const CORES_BADGE = {
  red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
  gray: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300',
}

// Ícone "i" que abre um popup com a tabela de referência completa de um
// indicador — dados vêm de obterTabelaReferencia (utils/escalasNormativas.js),
// a mesma fonte usada pelas funções classificar* que já geram o badge
// colorido, então o popup nunca diverge do que o app realmente calcula.
// `tipo` é a chave do indicador (ex: 'imc', 'morrow', 'imo'); `sexo`/`idade`
// selecionam a tabela certa quando o indicador é estratificado.
export default function BotaoReferencia({ tipo, sexo, idade, className = '' }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!aberto) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [aberto])

  const dados = obterTabelaReferencia(tipo, { sexo, idade })
  if (!dados) return null

  return (
    <span className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setAberto((v) => !v) }}
        title="Ver valores de referência"
        className="text-gray-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <Info size={12} />
      </button>

      {aberto && (
        <div
          className="absolute z-30 top-full mt-1.5 left-0 w-64 max-w-[80vw] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-bold text-gray-800 dark:text-slate-100 mb-2 pr-4">{dados.titulo}</p>

          {dados.tipo === 'lista' && (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {dados.linhas.map((l, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-gray-500 dark:text-slate-400 shrink-0">{l.faixa}</span>
                  <span className={`px-1.5 py-0.5 rounded font-semibold text-right ${CORES_BADGE[l.cor] || CORES_BADGE.gray}`}>
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {dados.tipo === 'matriz' && (
            <div className="overflow-x-auto max-h-64">
              <table className="text-[10px] border-collapse w-full">
                <thead>
                  <tr>
                    <th className="text-left font-bold text-gray-500 dark:text-slate-400 pb-1 pr-2 sticky left-0 bg-white dark:bg-slate-900">—</th>
                    {dados.colunas.map((c) => (
                      <th key={c} className="text-center font-bold text-gray-500 dark:text-slate-400 pb-1 px-1.5 whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dados.linhas.map((l, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-slate-800">
                      <td className="py-1 pr-2 font-semibold text-gray-600 dark:text-slate-300 whitespace-nowrap sticky left-0 bg-white dark:bg-slate-900">{l.label}</td>
                      {l.valores.map((v, j) => (
                        <td key={j} className="py-1 px-1.5 text-center text-gray-500 dark:text-slate-400 whitespace-nowrap">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[9px] text-gray-400 dark:text-slate-500 mt-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            Fonte: {dados.fonte}
          </p>
        </div>
      )}
    </span>
  )
}
