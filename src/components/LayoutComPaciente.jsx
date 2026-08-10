import React, { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from './SidebarPaciente'

// Envolve as telas de Avaliação Antropométrica (Nova Avaliação/Equações/
// Laudo/Gasto Calórico/Evolução) com o menu do paciente fixo (coluna no PC,
// barra em cima no cel).
//
// O paciente "ativo" pode chegar de formas bem diferentes dependendo de
// onde a navegação começou — não é uniforme entre as páginas:
//   - location.state.paciente          (SidebarPaciente, Pacientes.jsx, LinhaDoTempo.jsx)
//   - location.state.pacienteInicial   (AvaliacaoForm.jsx -> Equações)
//   - location.state.avaliacaoId       (Equações -> Laudo, Gasto Calórico -> Laudo,
//                                        Histórico -> Laudo — nenhum desses passa o
//                                        paciente, só o id da avaliação; busca o
//                                        paciente vinculado a essa avaliação)
//   - :tokenUrl da URL                 (link de /laudo/:tokenUrl ou /evolucao/:tokenUrl
//                                        aberto direto, sem state nenhum — Evolução usa
//                                        pacientes.token_publico, Laudo usa
//                                        avaliacoes.token_publico)
// Tentado nessa ordem; sem nenhum desses, mostra a tela como sempre foi,
// sem menu (não força um menu vazio).
//
// NUNCA usar isso nas rotas públicas (/laudo/:tokenUrl, /evolucao/:tokenUrl)
// — Laudo e Evolução também são a página que o PACIENTE vê sem estar
// logado. Só a entrada de dentro do bloco autenticado em App.jsx usa este
// wrapper; a pública fica intocada.
export default function LayoutComPaciente({ children, itemAtivo }) {
  const location = useLocation()
  const { tokenUrl } = useParams()
  const [pacienteBuscado, setPacienteBuscado] = useState(null)

  const pacienteDireto = location.state?.paciente || location.state?.pacienteInicial || null
  const avaliacaoId = location.state?.avaliacaoId || null

  useEffect(() => {
    if (pacienteDireto) { setPacienteBuscado(null); return }

    let ativo = true

    const resolver = async () => {
      if (avaliacaoId) {
        const { data } = await supabase
          .from('avaliacoes')
          .select('pacientes(*)')
          .eq('id', avaliacaoId)
          .maybeSingle()
        if (ativo) setPacienteBuscado(data?.pacientes || null)
        return
      }

      if (tokenUrl) {
        const busca = itemAtivo === 'laudo'
          ? supabase.from('avaliacoes').select('pacientes(*)').eq('token_publico', tokenUrl).maybeSingle()
          : supabase.from('pacientes').select('*').eq('token_publico', tokenUrl).maybeSingle()
        const { data } = await busca
        if (ativo) setPacienteBuscado(itemAtivo === 'laudo' ? (data?.pacientes || null) : (data || null))
        return
      }

      setPacienteBuscado(null)
    }

    resolver()
    return () => { ativo = false }
  }, [pacienteDireto, avaliacaoId, tokenUrl, itemAtivo])

  const paciente = pacienteDireto || pacienteBuscado
  if (!paciente) return children

  return (
    <div className="w-full flex flex-col md:flex-row gap-6">
      <SidebarPaciente paciente={paciente} itemAtivo={itemAtivo} onSelecionarItem={() => {}} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
