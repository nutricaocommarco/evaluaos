import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

// Tela de retorno do consentimento do Google (/oauth/google/callback).
// Só existe pra pegar code/state da URL e chamar api/google/callback.js
// — a troca de code por token nunca acontece no client, exige o Client
// Secret. Registrada nos dois blocos de rotas em App.jsx (igual as
// outras rotas de token/callback do app).
export default function GoogleOAuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('carregando') // 'carregando' | 'erro'
  const [mensagemErro, setMensagemErro] = useState('')

  useEffect(() => {
    async function processar() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      const erroGoogle = params.get('error')

      if (erroGoogle) {
        setStatus('erro')
        setMensagemErro('Você cancelou a conexão com o Google.')
        return
      }

      if (!code || !state) {
        setStatus('erro')
        setMensagemErro('Link de retorno do Google inválido.')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setStatus('erro')
        setMensagemErro('Sua sessão expirou — faça login novamente e tente conectar de novo.')
        return
      }

      try {
        const res = await fetch('/api/google/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Falha ao conectar com o Google')

        navigate('/avaliador', { replace: true })
      } catch (err) {
        setStatus('erro')
        setMensagemErro(err.message)
      }
    }

    processar()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-sm">
        {status === 'carregando' ? (
          <p className="text-primary-600 font-bold animate-pulse">Conectando ao Google...</p>
        ) : (
          <>
            <p className="text-red-600 font-bold mb-3">Não foi possível conectar</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{mensagemErro}</p>
            <button
              onClick={() => navigate('/avaliador', { replace: true })}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700"
            >
              Voltar ao Painel do Nutricionista
            </button>
          </>
        )}
      </div>
    </div>
  )
}
