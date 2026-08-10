import React, { useState } from 'react'
import { Eye, MoreHorizontal } from 'lucide-react'

const ABAS = [
  { chave: 'respondidos', label: 'Respondidos', statuses: ['respondido'] },
  { chave: 'revisados', label: 'Revisados', statuses: ['revisado'] },
  { chave: 'aguardando', label: 'Aguardando resposta', statuses: ['aguardando'] },
]

const STATUS_LABEL = {
  aguardando: 'Aguardando',
  respondido: 'Respondido',
  revisado: 'Revisado',
}

const STATUS_COR = {
  aguardando: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  respondido: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300',
  revisado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

// Lista de envios reutilizada tanto na tela global de Questionários quanto na
// tela por-paciente (que já chega com `envios` pré-filtrado por paciente e
// esconde a coluna de busca, já que só existe um paciente possível ali).
export default function ListaEnvios({ envios, onVerRespostas, onExcluir, mostrarFiltroPaciente = true }) {
  const [abaAtiva, setAbaAtiva] = useState('respondidos')
  const [busca, setBusca] = useState('')
  const [menuAbertoId, setMenuAbertoId] = useState(null)

  const abaSelecionada = ABAS.find((a) => a.chave === abaAtiva)
  const filtrados = envios
    .filter((e) => abaSelecionada.statuses.includes(e.status))
    .filter((e) => !busca.trim() || (e.pacientes?.nome_completo || '').toLowerCase().includes(busca.trim().toLowerCase()))

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {ABAS.map((aba) => {
          const total = envios.filter((e) => aba.statuses.includes(e.status)).length
          return (
            <button
              key={aba.chave}
              onClick={() => setAbaAtiva(aba.chave)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                abaAtiva === aba.chave
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              {aba.label} {total > 0 && <span className="opacity-75">({total})</span>}
            </button>
          )
        })}
      </div>

      {mostrarFiltroPaciente && (
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Filtrar por paciente..."
          className="w-full sm:w-72 px-3 py-2 mb-4 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900"
        />
      )}

      {filtrados.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
          <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhum envio nessa categoria ainda.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800">
                {mostrarFiltroPaciente && <th className="p-4">Paciente</th>}
                <th className="p-4">Questionário</th>
                <th className="p-4">Criado em</th>
                <th className="p-4">Respondido em</th>
                <th className="p-4">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((envio) => (
                <tr key={envio.id} className="border-b border-gray-50 dark:border-slate-800/50 last:border-0">
                  {mostrarFiltroPaciente && (
                    <td className="p-4">
                      {envio.pacientes ? (
                        <span className="font-semibold text-gray-800 dark:text-slate-100">{envio.pacientes.nome_completo}</span>
                      ) : (
                        <span className="italic text-gray-400 dark:text-slate-500">Sem paciente associado</span>
                      )}
                    </td>
                  )}
                  <td className="p-4 text-gray-700 dark:text-slate-300">{envio.questionarios?.titulo || '-'}</td>
                  <td className="p-4 text-gray-500 dark:text-slate-400">{formatarData(envio.created_at)}</td>
                  <td className="p-4 text-gray-500 dark:text-slate-400">{formatarData(envio.respondido_em)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${STATUS_COR[envio.status]}`}>
                      {STATUS_LABEL[envio.status]}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 justify-end">
                      {envio.status !== 'aguardando' && (
                        <button
                          onClick={() => onVerRespostas(envio)}
                          className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
                        >
                          <Eye size={14} /> Ver respostas
                        </button>
                      )}
                      <div className="relative">
                        <button
                          onClick={() => setMenuAbertoId((v) => (v === envio.id ? null : envio.id))}
                          className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 p-1"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {menuAbertoId === envio.id && (
                          <ul className="absolute right-0 z-20 mt-1 w-40 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
                            <li>
                              <button
                                onClick={() => { setMenuAbertoId(null); onExcluir(envio.id) }}
                                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                Excluir envio
                              </button>
                            </li>
                          </ul>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
