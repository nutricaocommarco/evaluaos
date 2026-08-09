import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const PlanoContext = createContext(null)

export function usePlano() {
  return useContext(PlanoContext)
}

// Mesmo padrão de query já usado em Pacientes.jsx/Avaliador.jsx/MeuPlano.jsx
// (plano_status por auth_id, lowercase, default 'gratis') — centralizado
// aqui pra não duplicar a busca em cada página, e pra dar pro
// SidebarPaciente.jsx (que só recebe a prop `paciente`, sem sessão) ler o
// plano sem precisar de prop-drilling pelas páginas que o renderizam.
export function PlanoProvider({ children }) {
  const [planoStatus, setPlanoStatus] = useState('gratis')

  useEffect(() => {
    async function carregarPlano(userId) {
      const { data } = await supabase
        .from('avaliadores')
        .select('plano_status')
        .eq('auth_id', userId)
        .maybeSingle()

      setPlanoStatus(data?.plano_status ? data.plano_status.toLowerCase() : 'gratis')
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) carregarPlano(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.id) {
        carregarPlano(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setPlanoStatus('gratis')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const isPro = planoStatus === 'pro' || planoStatus === 'ativo'
  const isBeta = planoStatus === 'beta'

  const value = { planoStatus, isPro, isBeta }

  return (
    <PlanoContext.Provider value={value}>
      {children}
    </PlanoContext.Provider>
  )
}
