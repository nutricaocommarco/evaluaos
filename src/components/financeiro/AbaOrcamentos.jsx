import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Pencil, Trash2, FileDown, MessageCircle, ClipboardList } from 'lucide-react'
import ModalOrcamento from './ModalOrcamento'
import GeradorPdfOrcamento from '../GeradorPdfOrcamento'

function fmtMoeda(n) {
  return (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

const STATUS_LABEL = { pendente: 'Pendente', aceito: 'Aceito', recusado: 'Recusado' }
const STATUS_COR = {
  pendente: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  aceito: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  recusado: 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400',
}

// Aba "Orçamentos" dentro de Financeiro.jsx — gera Orçamentos/Protocolos
// em PDF (marca própria + chave Pix + link de pagamento opcional) pra
// um paciente já cadastrado ou um lead avulso, e manda o link via
// WhatsApp manualmente (mesmo padrão do Questionário, sem API).
export default function AbaOrcamentos({ userId }) {
  const [orcamentos, setOrcamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [orcamentoEditando, setOrcamentoEditando] = useState(null)
  const [orcamentoParaPdf, setOrcamentoParaPdf] = useState(null)

  const carregar = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*, pacientes(nome_completo, telefone)')
      .eq('id_avaliador', userId)
      .order('created_at', { ascending: false })
    if (!error && data) setOrcamentos(data)
    setLoading(false)
  }

  useEffect(() => {
    if (userId) carregar()
  }, [userId])

  const abrirNovo = () => {
    setOrcamentoEditando(null)
    setShowModal(true)
  }

  const abrirEdicao = (o) => {
    setOrcamentoEditando(o)
    setShowModal(true)
  }

  const aoSalvar = (salvo) => {
    setOrcamentos((prev) => {
      const existe = prev.some((o) => o.id === salvo.id)
      return existe ? prev.map((o) => (o.id === salvo.id ? salvo : o)) : [salvo, ...prev]
    })
    setShowModal(false)
    setOrcamentoEditando(null)
  }

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir este orçamento?')) return
    const { error } = await supabase.from('orcamentos').delete().eq('id', id)
    if (error) return alert('Erro ao excluir: ' + error.message)
    setOrcamentos((prev) => prev.filter((o) => o.id !== id))
  }

  const handleMudarStatus = async (o, novoStatus) => {
    const { error } = await supabase.from('orcamentos').update({ status: novoStatus }).eq('id', o.id)
    if (error) return alert('Erro ao atualizar status: ' + error.message)
    setOrcamentos((prev) => prev.map((item) => (item.id === o.id ? { ...item, status: novoStatus } : item)))
  }

  const linkWhatsApp = (o) => {
    const nome = o.pacientes?.nome_completo || o.nome_lead || 'tudo bem'
    const telefone = (o.pacientes?.telefone || o.telefone_lead || '').replace(/\D/g, '')
    if (!telefone) return null
    const link = `${window.location.origin}/orcamento/${o.token_publico}`
    const mensagem = `Olá ${nome}, tudo bem?\n\nSegue seu ${o.titulo} — ${fmtMoeda(o.valor_total)}.\n\nVeja os detalhes aqui: ${link}\n\nQualquer dúvida, me chama!`
    const numeroCompleto = telefone.startsWith('55') ? telefone : `55${telefone}`
    return `https://wa.me/${numeroCompleto}?text=${encodeURIComponent(mensagem)}`
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={abrirNovo}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors"
        >
          + Novo Orçamento
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-sm text-primary-600 font-semibold text-center py-8 animate-pulse">Carregando...</p>
        ) : orcamentos.length === 0 ? (
          <div className="text-center py-10 px-4">
            <ClipboardList className="mx-auto text-gray-300 dark:text-slate-700" size={32} />
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">
              Nenhum orçamento ainda. Gere um pra um paciente ou pra um lead novo.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {orcamentos.map((o) => {
              const nomeCliente = o.pacientes?.nome_completo || o.nome_lead || 'Sem nome'
              const wa = linkWhatsApp(o)
              return (
                <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-800 dark:text-slate-100">{o.titulo}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                      {!o.pacientes && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400">Lead</span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      {nomeCliente} · {fmtMoeda(o.valor_total)} · {formatarData(o.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    <select
                      value={o.status}
                      onChange={(e) => handleMudarStatus(o, e.target.value)}
                      className="text-xs font-semibold border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 outline-none"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="aceito">Aceito</option>
                      <option value="recusado">Recusado</option>
                    </select>
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noreferrer"
                        title="Enviar por WhatsApp"
                        className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        <MessageCircle size={16} />
                      </a>
                    )}
                    <button onClick={() => setOrcamentoParaPdf(o)} title="Baixar PDF" className="p-2 text-gray-400 hover:text-primary-600">
                      <FileDown size={16} />
                    </button>
                    <button onClick={() => abrirEdicao(o)} title="Editar" className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleExcluir(o.id)} title="Excluir" className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ModalOrcamento
          userId={userId}
          orcamento={orcamentoEditando}
          aoFechar={() => {
            setShowModal(false)
            setOrcamentoEditando(null)
          }}
          aoSalvar={aoSalvar}
        />
      )}

      {orcamentoParaPdf && (
        <GeradorPdfOrcamento
          orcamento={orcamentoParaPdf}
          nomeCliente={orcamentoParaPdf.pacientes?.nome_completo || orcamentoParaPdf.nome_lead}
          avaliadorUserId={userId}
          aoFechar={() => setOrcamentoParaPdf(null)}
        />
      )}
    </div>
  )
}
