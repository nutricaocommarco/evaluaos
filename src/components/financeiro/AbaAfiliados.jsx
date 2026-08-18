import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Users, Wallet } from 'lucide-react'

function fmtMoeda(n) {
  return (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function valorIndicacao(periodicidade) {
  return periodicidade === 'mensal' ? 5 : periodicidade === 'anual' ? 50 : 0
}

function liberadoEm(virouProEm) {
  return new Date(new Date(virouProEm).getTime() + 7 * 24 * 60 * 60 * 1000)
}

// Previsão de pagamento: 1ª semana do mês seguinte ao mês em que os 7 dias
// de carência terminaram (mesma regra da view indicacoes_a_pagar).
function previsaoPagamento(dataLiberacao) {
  const proximoMes = new Date(dataLiberacao.getFullYear(), dataLiberacao.getMonth() + 1, 1)
  const texto = proximoMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return `1ª semana de ${texto}`
}

// Aba "Afiliados" dentro de Financeiro.jsx — mostra pro nutricionista
// quanto ele tem provisionado (liberado, ainda não pago) e quanto já
// recebeu das próprias indicações do programa Indique & Ganhe. Segue a
// mesma trava/lógica de indicacao_virou_pro_em / indicacao_paga_em /
// indicacao_cancelada_em já usada em Configuracoes.jsx.
export default function AbaAfiliados({ userId }) {
  const [loading, setLoading] = useState(true)
  const [indicados, setIndicados] = useState([])

  useEffect(() => {
    async function carregar() {
      if (!userId) return
      setLoading(true)
      const { data: avalData } = await supabase
        .from('avaliadores')
        .select('id')
        .eq('auth_id', userId)
        .maybeSingle()

      if (!avalData) {
        setIndicados([])
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('avaliadores')
        .select('id, nome_completo, email, periodicidade_plano, indicacao_virou_pro_em, indicacao_paga_em, indicacao_cancelada_em')
        .eq('indicado_por', avalData.id)
        .not('indicacao_virou_pro_em', 'is', null)
        .order('indicacao_virou_pro_em', { ascending: false })

      setIndicados(data || [])
      setLoading(false)
    }

    carregar()
  }, [userId])

  const agora = new Date()

  const provisionados = indicados.filter(
    (i) => !i.indicacao_cancelada_em && !i.indicacao_paga_em && liberadoEm(i.indicacao_virou_pro_em) <= agora
  )
  const aguardando = indicados.filter(
    (i) => !i.indicacao_cancelada_em && !i.indicacao_paga_em && liberadoEm(i.indicacao_virou_pro_em) > agora
  )
  const pagos = indicados.filter((i) => i.indicacao_paga_em)
  const cancelados = indicados.filter((i) => i.indicacao_cancelada_em)

  const totalProvisionado = provisionados.reduce((soma, i) => soma + valorIndicacao(i.periodicidade_plano), 0)
  const totalRecebido = pagos.reduce((soma, i) => soma + valorIndicacao(i.periodicidade_plano), 0)

  if (loading) {
    return <p className="text-sm text-primary-600 font-semibold text-center py-8 animate-pulse">Carregando...</p>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Provisionado</p>
            <p className="text-lg font-black text-gray-800 dark:text-slate-100">{fmtMoeda(totalProvisionado)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Recebido</p>
            <p className="text-lg font-black text-gray-800 dark:text-slate-100">{fmtMoeda(totalRecebido)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {provisionados.length === 0 && aguardando.length === 0 && pagos.length === 0 && cancelados.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Users className="mx-auto text-gray-300 dark:text-slate-700" size={32} />
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">Nenhuma indicação sua virou Pro ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {provisionados.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate">{i.nome_completo || i.email}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    Previsto pra {previsaoPagamento(liberadoEm(i.indicacao_virou_pro_em))}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400">
                    Provisionado
                  </span>
                  <span className="text-sm font-black text-primary-600 dark:text-primary-400">
                    + {fmtMoeda(valorIndicacao(i.periodicidade_plano))}
                  </span>
                </div>
              </div>
            ))}

            {aguardando.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate">{i.nome_completo || i.email}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    Libera em {liberadoEm(i.indicacao_virou_pro_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                    Aguardando liberação
                  </span>
                  <span className="text-sm font-black text-gray-400 dark:text-slate-500">
                    {fmtMoeda(valorIndicacao(i.periodicidade_plano))}
                  </span>
                </div>
              </div>
            ))}

            {pagos.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate">{i.nome_completo || i.email}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    Pago em {new Date(i.indicacao_paga_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                    Pago
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    + {fmtMoeda(valorIndicacao(i.periodicidade_plano))}
                  </span>
                </div>
              </div>
            ))}

            {cancelados.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 p-4 opacity-60">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate">{i.nome_completo || i.email}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    Cancelado em {new Date(i.indicacao_cancelada_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 shrink-0">
                  Cancelado
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
