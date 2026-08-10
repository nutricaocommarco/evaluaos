import React, { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from './SidebarPaciente'

// Envolve as telas de Avaliação Antropométrica (Nova Avaliação/Equações/
// Laudo/Gasto Calórico/Evolução) com o menu do paciente fixo (coluna no PC,
// barra em cima no cel — mesmo componente/comportamento das outras telas
// do paciente).
//
// Laudo e Evolução são um caso especial: a MESMA url com :tokenUrl serve
// tanto o nutricionista logado (dentro do app, com o menu de sempre ao
// redor) quanto o paciente sem login nenhum (link público). A App.jsx
// registra essa rota duas vezes — uma dentro do bloco autenticado (session
// existe) e outra no bloco público (session não existe) — então só
// envolvendo a entrada de dentro do bloco autenticado com este componente
// já garante "aparece logado, nunca aparece deslogado": quando não há
// sessão, aquele outro <Routes> nem chega a montar esse componente.
//
// Com token mas sem paciente no state (é exatamente o caso de abrir um
// link /laudo/:tokenUrl ou /evolucao/:tokenUrl estando logado — não veio
// de um clique no menu do paciente, então não tem state), busca o
// paciente pelo token pra poder montar o menu mesmo assim. O token de
// Evolução mora em pacientes.token_publico (um por paciente); o de Laudo
// mora em avaliacoes.token_publico (um por avaliação específica) — por
// isso `tokenViaAvaliacao` escolhe qual tabela consultar.
export default function LayoutComPaciente({ children, itemAtivo, tokenViaAvaliacao }) {
  const location = useLocation()
  const { tokenUrl } = useParams()
  const [pacienteToken, setPacienteToken] = useState(null)

  const pacienteState = location.state?.paciente || null

  useEffect(() => {
    if (pacienteState || !tokenUrl) { setPacienteToken(null); return }
    let ativo = true

    const busca = tokenViaAvaliacao
      ? supabase.from('avaliacoes').select('pacientes(*)').eq('token_publico', tokenUrl).maybeSingle()
      : supabase.from('pacientes').select('*').eq('token_publico', tokenUrl).maybeSingle()

    busca.then(({ data }) => {
      if (!ativo) return
      setPacienteToken(tokenViaAvaliacao ? (data?.pacientes || null) : (data || null))
    })

    return () => { ativo = false }
  }, [tokenUrl, pacienteState, tokenViaAvaliacao])

  const paciente = pacienteState || pacienteToken
  if (!paciente) return children

  return (
    <div className="w-full flex flex-col md:flex-row gap-6">
      <SidebarPaciente paciente={paciente} itemAtivo={itemAtivo} onSelecionarItem={() => {}} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
