import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from '../components/SidebarPaciente'
import ReceitasAtribuidas from '../components/receitas/ReceitasAtribuidas'

export default function PacienteReceitas({ userId }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [itemAtivo, setItemAtivo] = useState('receitas')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      const { data: pac } = await supabase.from('pacientes').select('*').eq('id', id).maybeSingle()
      setPaciente(pac || null)
      setLoading(false)
    }
    carregar()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-primary-600 font-bold animate-pulse">Carregando receitas...</p>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <p className="text-gray-600 dark:text-slate-300 font-semibold">Paciente não encontrado.</p>
        <button onClick={() => navigate('/pacientes')} className="text-primary-600 font-semibold text-sm hover:underline">
          ← Voltar para Pacientes
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
      <SidebarPaciente paciente={paciente} itemAtivo={itemAtivo} onSelecionarItem={setItemAtivo} />

      <div className="flex-1 min-w-0 space-y-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Receitas — {paciente.nome_completo}</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Escolha quais receitas do seu catálogo aparecem no Portal deste paciente</p>
        </div>

        <ReceitasAtribuidas paciente={paciente} userId={userId} />
      </div>
    </div>
  )
}
