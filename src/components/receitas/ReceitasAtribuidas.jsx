import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Plus, X, ChefHat } from 'lucide-react'

// Escolhe do catálogo (Biblioteca > Receitas — próprias + padrão) quais
// receitas ficam visíveis pra ESSE paciente no Portal dele. Existência da
// linha em receitas_pacientes já é o "visível" — mesmo padrão de
// CheckinSemanal.jsx (ativar/remover de uma tabela de junção).
export default function ReceitasAtribuidas({ paciente, userId }) {
  const [loading, setLoading] = useState(true)
  const [atribuidas, setAtribuidas] = useState([])
  const [catalogo, setCatalogo] = useState([])
  const [receitaParaAdicionar, setReceitaParaAdicionar] = useState('')
  const [adicionando, setAdicionando] = useState(false)

  const carregar = async () => {
    setLoading(true)
    const [atribRes, catRes] = await Promise.all([
      supabase
        .from('receitas_pacientes')
        .select('id, id_receita, receitas(id, nome, imagem_url)')
        .eq('id_paciente', paciente.id)
        .order('created_at'),
      supabase
        .from('receitas')
        .select('id, nome')
        .or(`id_avaliador.eq.${userId},id_avaliador.is.null`)
        .order('nome'),
    ])
    setAtribuidas(atribRes.data || [])
    setCatalogo(catRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paciente.id])

  const idsAtribuidos = new Set(atribuidas.map((a) => a.id_receita))
  const disponiveis = catalogo.filter((r) => !idsAtribuidos.has(r.id))

  const handleAdicionar = async () => {
    const idReceita = receitaParaAdicionar || disponiveis[0]?.id
    if (!idReceita) return
    setAdicionando(true)
    const { data, error } = await supabase
      .from('receitas_pacientes')
      .insert({ id_paciente: paciente.id, id_receita: idReceita, id_avaliador: userId })
      .select('id, id_receita, receitas(id, nome, imagem_url)')
      .single()
    setAdicionando(false)
    if (error) { alert('Erro ao atribuir receita: ' + error.message); return }
    setAtribuidas((prev) => [...prev, data])
    setReceitaParaAdicionar('')
  }

  const handleRemover = async (id, nome) => {
    if (!window.confirm(`Remover "${nome}" das receitas visíveis pra ${paciente.nome_completo}?`)) return
    const { error } = await supabase.from('receitas_pacientes').delete().eq('id', id)
    if (error) { alert('Erro ao remover: ' + error.message); return }
    setAtribuidas((prev) => prev.filter((a) => a.id !== id))
  }

  if (loading) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
      <div>
        <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
          🍳 Receitas visíveis pro paciente
        </h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          Escolha do seu catálogo (Biblioteca &gt; Receitas) quais aparecem no Portal deste paciente.
        </p>
      </div>

      {atribuidas.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-slate-500">Nenhuma receita atribuída ainda.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {atribuidas.map((a) => (
            <div key={a.id} className="relative rounded-lg border border-gray-100 dark:border-slate-800 overflow-hidden group">
              <div className="w-full h-20 bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                {a.receitas?.imagem_url ? (
                  <img src={a.receitas.imagem_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ChefHat size={20} className="text-gray-300 dark:text-slate-600" />
                )}
              </div>
              <p className="px-2 py-1.5 text-[11px] font-semibold text-gray-700 dark:text-slate-300 truncate">
                {a.receitas?.nome || 'Receita removida'}
              </p>
              <button
                type="button"
                onClick={() => handleRemover(a.id, a.receitas?.nome || 'esta receita')}
                title="Remover"
                className="absolute top-1 right-1 p-1 bg-white/90 dark:bg-slate-900/90 rounded-full text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {disponiveis.length === 0 ? (
        catalogo.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            Nenhuma receita no seu catálogo ainda. Cadastre em Biblioteca &gt; Receitas primeiro.
          </p>
        )
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
          <select
            value={receitaParaAdicionar}
            onChange={(e) => setReceitaParaAdicionar(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500"
          >
            {disponiveis.map((r) => (
              <option key={r.id} value={r.id}>{r.nome}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdicionar}
            disabled={adicionando}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
          >
            <Plus size={14} /> {adicionando ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      )}
    </div>
  )
}
