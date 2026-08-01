import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [crnNumep, setCrnNumep] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setInfoMsg('')

    try {
      if (isSignUp) {
        // 1. Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (authError) throw authError

        // 2. Criar a linha do avaliador já vinculando o auth_id e definindo o plano_status inicial
        if (authData?.user) {
          const { error: dbError } = await supabase.from('avaliadores').insert([
            {
              auth_id: authData.user.id, // 👈 VÍNCULO FUNDAMENTAL
              email: email,
              nome_completo: nome,
              crn_numep: crnNumep,
              plano_status: 'gratis',   // 👈 STATUS INICIAL DEFINIDO
            },
          ])

          if (dbError) {
            console.error('Erro ao registrar detalhes do avaliador:', dbError.message)
          }
        }

        setInfoMsg('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar ou faça login.')
      } else {
        // MODO LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        if (data?.user) {
          // 🛡️ FALLBACK DE SEGURANÇA: Garante que a linha na tabela 'avaliadores' existe
          const { data: avalExistente } = await supabase
            .from('avaliadores')
            .select('id')
            .eq('auth_id', data.user.id)
            .maybeSingle()

          if (!avalExistente) {
            // Se o usuário existia no Auth mas ainda não tinha linha em 'avaliadores'
            await supabase.from('avaliadores').insert([
              {
                auth_id: data.user.id,
                email: data.user.email,
                plano_status: 'gratis',
              },
            ])
          }

          if (onLoginSuccess) onLoginSuccess(data.user)
        }
      }
    } catch (error) {
      setErrorMsg(error.message || 'Ocorreu um erro ao processar a solicitação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col items-center">
          <img src="/Imagens/Logo_png.png" alt="EvaluaOS Logo" className="h-[250px] w-auto object-contain" />
          <p className="mt-4 text-center text-sm text-gray-600">
            {isSignUp ? 'Crie sua conta de Avaliador' : 'Acesse sua conta profissional'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded text-sm text-green-700">
            {infoMsg}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleAuth}>
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    CRN / CREF / NUMEP / Estudante
                  </label>
                  <button
                    type="button"
                    onClick={() => setCrnNumep('Estudante')}
                    className="text-xs text-emerald-600 hover:underline font-medium"
                  >
                    Sou Estudante
                  </button>
                </div>
                <input
                  type="text"
                  value={crnNumep}
                  onChange={(e) => setCrnNumep(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  placeholder="Ex: CRN-12345 ou Estudante"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              placeholder="seuemail@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Carregando...' : isSignUp ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setErrorMsg('')
              setInfoMsg('')
            }}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
          >
            {isSignUp
              ? 'Já tem uma conta? Faça login'
              : 'Não tem uma conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  )
}