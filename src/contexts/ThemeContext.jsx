import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { DEFAULT_PRIMARY_HEX, applyPrimaryColorScale } from '../utils/colorTheme'

const ThemeContext = createContext(null)

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false)
  const [corPrimaria, setCorPrimaria] = useState(DEFAULT_PRIMARY_HEX)

  // Aplica no DOM sempre que mudar (preview instantâneo, inclusive antes de salvar)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    applyPrimaryColorScale(corPrimaria)
  }, [corPrimaria])

  // Carrega a preferência do avaliador logado (área autenticada do sistema)
  useEffect(() => {
    async function carregarTemaDaSessao(userId) {
      const { data } = await supabase
        .from('configuracoes_avaliador')
        .select('dark_mode, cor_primaria')
        .eq('auth_id', userId)
        .maybeSingle()

      if (data) {
        setDarkMode(!!data.dark_mode)
        setCorPrimaria(data.cor_primaria || DEFAULT_PRIMARY_HEX)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) carregarTemaDaSessao(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.id) {
        carregarTemaDaSessao(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setDarkMode(false)
        setCorPrimaria(DEFAULT_PRIMARY_HEX)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = { darkMode, corPrimaria, setDarkMode, setCorPrimaria }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
