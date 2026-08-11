import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { ChevronDown, ChevronRight, UtensilsCrossed, ClipboardList, FileText, Stethoscope } from 'lucide-react'

function formatarDataHora(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleString('pt-BR')
}

// Uma linha de modelo, com renomear inline (clique no título) e excluir. O
// conteúdo expandido é livre (children), já que cada tipo de modelo mostra
// algo diferente (itens de refeição, refeições de um plano, texto livre...).
function LinhaModelo({ modelo, aberto, onToggle, onRenomear, onExcluir, resumo, children }) {
  const [renomeando, setRenomeando] = useState(false)
  const [novoTitulo, setNovoTitulo] = useState(modelo.titulo)

  const salvarRenomear = () => {
    const valor = novoTitulo.trim()
    setRenomeando(false)
    if (!valor || valor === modelo.titulo) { setNovoTitulo(modelo.titulo); return }
    onRenomear(modelo.id, valor)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center gap-3 p-4">
        {renomeando ? (
          <input
            autoFocus
            type="text"
            value={novoTitulo}
            onChange={(e) => setNovoTitulo(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setNovoTitulo(modelo.titulo); setRenomeando(false) } }}
            onBlur={salvarRenomear}
            className="flex-1 px-2 py-1 border border-primary-300 rounded text-sm font-black outline-none focus:ring-2 focus:ring-primary-500"
          />
        ) : (
          <button type="button" onClick={onToggle} className="flex-1 flex items-center gap-2 text-left min-w-0">
            {aberto ? (
              <ChevronDown size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
            ) : (
              <ChevronRight size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-sm font-black text-gray-800 dark:text-slate-100 truncate block">{modelo.titulo}</span>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">
                Criado em {formatarDataHora(modelo.created_at)}{resumo ? ` · ${resumo}` : ''}
              </p>
            </div>
          </button>
        )}
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => setRenomeando(true)}
            className="text-xs font-semibold text-primary-600 hover:underline"
          >
            Renomear
          </button>
          <button
            onClick={() => onExcluir(modelo.id)}
            className="text-xs font-semibold text-red-600 hover:underline"
          >
            Excluir
          </button>
        </div>
      </div>
      {aberto && !renomeando && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function labelQuantidade(item) {
  if (item.unidade_medida === 'a_vontade') return 'à vontade'
  if (item.unidade_medida && item.quantidade_medida) return `${item.quantidade_medida} ${item.unidade_medida} (≈${item.quantidade_g}g)`
  return `${item.quantidade_g}g`
}

function Secao({ titulo, icone: Icone, cor, itens, carregando, vazio, children }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-slate-800">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cor}`}>
          <Icone size={18} />
        </div>
        <h3 className="text-base font-bold text-gray-800 dark:text-slate-100">{titulo}</h3>
        <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">{itens.length}</span>
      </div>
      {carregando ? (
        <p className="text-sm text-primary-600 font-semibold text-center py-6 animate-pulse">Carregando...</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6 px-4">{vazio}</p>
      ) : (
        <div className="p-4 space-y-3">{children}</div>
      )}
    </div>
  )
}

export default function Modelos() {
  const [loading, setLoading] = useState(true)
  const [modelosRefeicoes, setModelosRefeicoes] = useState([])
  const [modelosPlanos, setModelosPlanos] = useState([])
  const [modelosOrientacoes, setModelosOrientacoes] = useState([])
  const [modelosAnamneses, setModelosAnamneses] = useState([])
  const [abertos, setAbertos] = useState(new Set())

  const carregarTudo = async () => {
    setLoading(true)
    const [refRes, planoRes, orientRes, anamRes] = await Promise.all([
      supabase.from('modelos_refeicoes').select('*, modelos_refeicoes_itens(*, tabela_alimentos(nome))').order('titulo'),
      supabase.from('modelos_planos').select('*, modelos_planos_refeicoes(*, modelos_planos_itens(*, tabela_alimentos(nome)))').order('titulo'),
      supabase.from('modelos_orientacoes').select('*').order('titulo'),
      supabase.from('modelos_anamneses').select('*').order('titulo'),
    ])
    setModelosRefeicoes(refRes.data || [])
    setModelosPlanos(planoRes.data || [])
    setModelosOrientacoes(orientRes.data || [])
    setModelosAnamneses(anamRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarTudo()
  }, [])

  const toggleAberto = (chave) => {
    setAbertos((prev) => {
      const novo = new Set(prev)
      if (novo.has(chave)) novo.delete(chave)
      else novo.add(chave)
      return novo
    })
  }

  const excluir = async (tabela, id, atualizarLista) => {
    if (!window.confirm('Excluir este modelo? Isso não afeta o que já foi criado a partir dele.')) return
    const { error } = await supabase.from(tabela).delete().eq('id', id)
    if (error) { alert('Erro ao excluir modelo: ' + error.message); return }
    atualizarLista((prev) => prev.filter((m) => m.id !== id))
  }

  const renomear = async (tabela, id, titulo, atualizarLista) => {
    atualizarLista((prev) => prev.map((m) => (m.id === id ? { ...m, titulo } : m)))
    await supabase.from(tabela).update({ titulo }).eq('id', id)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Modelos</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Organize num só lugar os modelos reutilizáveis que você salvou. Modelos de refeição e plano alimentar
          são criados a partir do Plano Alimentar de qualquer paciente; orientações e anamnese, a partir das
          respectivas telas do paciente.
        </p>
      </div>

      <Secao
        titulo="Refeições"
        icone={UtensilsCrossed}
        cor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
        itens={modelosRefeicoes}
        carregando={loading}
        vazio='Nenhum modelo de refeição ainda. Salve um em "Salvar como modelo", dentro de uma refeição no Plano Alimentar.'
      >
        {modelosRefeicoes.map((m) => (
          <LinhaModelo
            key={m.id}
            modelo={m}
            aberto={abertos.has(`refeicao-${m.id}`)}
            onToggle={() => toggleAberto(`refeicao-${m.id}`)}
            onRenomear={(id, titulo) => renomear('modelos_refeicoes', id, titulo, setModelosRefeicoes)}
            onExcluir={(id) => excluir('modelos_refeicoes', id, setModelosRefeicoes)}
            resumo={`${m.modelos_refeicoes_itens?.length || 0} item(ns)`}
          >
            {m.modelos_refeicoes_itens?.length > 0 ? (
              <ul className="space-y-1">
                {m.modelos_refeicoes_itens.map((item) => (
                  <li key={item.id} className="text-xs text-gray-700 dark:text-slate-300">
                    {item.nome_customizado || item.tabela_alimentos?.nome || 'Alimento removido'}
                    <span className="text-gray-400 dark:text-slate-500"> — {labelQuantidade(item)}</span>
                    {item.opcao_numero > 1 && (
                      <span className="text-primary-500 dark:text-primary-400"> (Opção {item.opcao_numero})</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500">Sem itens.</p>
            )}
          </LinhaModelo>
        ))}
      </Secao>

      <Secao
        titulo="Plano Alimentar"
        icone={ClipboardList}
        cor="text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400"
        itens={modelosPlanos}
        carregando={loading}
        vazio='Nenhum modelo de plano ainda. Salve um em "Salvar como modelo", dentro de um Plano Alimentar de paciente.'
      >
        {modelosPlanos.map((m) => {
          const refeicoes = [...(m.modelos_planos_refeicoes || [])].sort((a, b) => a.ordem - b.ordem)
          return (
            <LinhaModelo
              key={m.id}
              modelo={m}
              aberto={abertos.has(`plano-${m.id}`)}
              onToggle={() => toggleAberto(`plano-${m.id}`)}
              onRenomear={(id, titulo) => renomear('modelos_planos', id, titulo, setModelosPlanos)}
              onExcluir={(id) => excluir('modelos_planos', id, setModelosPlanos)}
              resumo={`${refeicoes.length} refeição(ões)${m.vet_target ? ` · ${m.vet_target} kcal` : ''}`}
            >
              {refeicoes.length > 0 ? (
                <div className="space-y-3">
                  {refeicoes.map((r) => (
                    <div key={r.id}>
                      <p className="text-xs font-black text-gray-700 dark:text-slate-300">
                        {r.horario ? `${r.horario.slice(0, 5)} — ` : ''}{r.nome_refeicao}
                      </p>
                      <ul className="ml-3 space-y-0.5 mt-0.5">
                        {(r.modelos_planos_itens || []).map((item) => (
                          <li key={item.id} className="text-xs text-gray-600 dark:text-slate-400">
                            {item.nome_customizado || item.tabela_alimentos?.nome || 'Alimento removido'}
                            <span className="text-gray-400 dark:text-slate-500"> — {labelQuantidade(item)}</span>
                            {item.opcao_numero > 1 && (
                              <span className="text-primary-500 dark:text-primary-400"> (Opção {item.opcao_numero})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-slate-500">Sem refeições.</p>
              )}
            </LinhaModelo>
          )
        })}
      </Secao>

      <Secao
        titulo="Orientações Nutricionais"
        icone={FileText}
        cor="text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400"
        itens={modelosOrientacoes}
        carregando={loading}
        vazio='Nenhum modelo de orientação ainda. Salve um marcando "Salvar também como modelo", dentro de Orientações Nutricionais de um paciente.'
      >
        {modelosOrientacoes.map((m) => (
          <LinhaModelo
            key={m.id}
            modelo={m}
            aberto={abertos.has(`orientacao-${m.id}`)}
            onToggle={() => toggleAberto(`orientacao-${m.id}`)}
            onRenomear={(id, titulo) => renomear('modelos_orientacoes', id, titulo, setModelosOrientacoes)}
            onExcluir={(id) => excluir('modelos_orientacoes', id, setModelosOrientacoes)}
          >
            {m.conteudo ? (
              <div className="rte-html text-xs text-gray-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: m.conteudo }} />
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500">-</p>
            )}
          </LinhaModelo>
        ))}
      </Secao>

      <Secao
        titulo="Anamnese"
        icone={Stethoscope}
        cor="text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400"
        itens={modelosAnamneses}
        carregando={loading}
        vazio='Nenhum modelo de anamnese ainda. Salve um marcando "Salvar também como modelo", dentro da Anamnese de um paciente.'
      >
        {modelosAnamneses.map((m) => (
          <LinhaModelo
            key={m.id}
            modelo={m}
            aberto={abertos.has(`anamnese-${m.id}`)}
            onToggle={() => toggleAberto(`anamnese-${m.id}`)}
            onRenomear={(id, titulo) => renomear('modelos_anamneses', id, titulo, setModelosAnamneses)}
            onExcluir={(id) => excluir('modelos_anamneses', id, setModelosAnamneses)}
          >
            {m.conteudo ? (
              <div className="rte-html text-xs text-gray-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: m.conteudo }} />
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500">-</p>
            )}
          </LinhaModelo>
        ))}
      </Secao>
    </div>
  )
}
