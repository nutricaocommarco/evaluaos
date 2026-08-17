import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Login({ onLoginSuccess }) {
  const [searchParams] = useSearchParams()
  const codigoIndicacaoRef = searchParams.get('ref') || null
  const [isSignUp, setIsSignUp] = useState(!!codigoIndicacaoRef)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [crnNumep, setCrnNumep] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')

  const navigate = useNavigate()

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setInfoMsg('')

    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: codigoIndicacaoRef ? { data: { codigo_indicacao_ref: codigoIndicacaoRef } } : undefined,
        })

        if (authError) throw authError

        if (authData?.user) {
          const { error: dbError } = await supabase.from('avaliadores').insert([
            {
              auth_id: authData.user.id,
              email: email,
              nome_completo: nome,
              crn_numep: crnNumep || null,
              plano_status: 'gratis',
            },
          ])

          if (dbError) {
            console.error('Erro ao registrar detalhes do avaliador:', dbError.message)
          }
        }

        setInfoMsg('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar ou faça login.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        if (data?.user) {
          await supabase.from('avaliadores').upsert(
            {
              auth_id: data.user.id,
              email: data.user.email,
              plano_status: 'gratis',
            },
            { onConflict: 'auth_id', ignoreDuplicates: true }
          )

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      {/* ⬅️ BOTÃO VOLTAR PARA A HOME */}
      <div className="max-w-md w-full mb-4 flex justify-start">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-sm"
        >
          ← Voltar ao Início
        </button>
      </div>

      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center">
          {/* LOGO RESTAURADA PARA O TAMANHO ORIGINAL H-[250PX] */}
          <img src="/Imagens/Logo_png.png" alt="EvaluaOS Logo" className="h-[250px] w-auto object-contain" />
          <h2 className="mt-4 text-center text-lg font-bold text-gray-900">
            {isSignUp ? 'Crie sua conta de Avaliador' : 'Acesse sua conta profissional'}
          </h2>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-xl text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3.5 rounded-r-xl text-xs text-emerald-700">
            {infoMsg}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleAuth}>
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    CRN / CREF / NUMEP / Estudante
                  </label>
                  <button
                    type="button"
                    onClick={() => setCrnNumep('Estudante')}
                    className="text-[11px] text-emerald-600 hover:underline font-bold"
                  >
                    Sou Estudante
                  </button>
                </div>
                <input
                  type="text"
                  value={crnNumep}
                  onChange={(e) => setCrnNumep(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  placeholder="Ex: CRN-12345 ou Estudante"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              placeholder="seuemail@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            {loading ? 'Carregando...' : isSignUp ? 'Cadastrar Avaliador' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-50">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setErrorMsg('')
              setInfoMsg('')
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {isSignUp
              ? 'Já tem uma conta? Faça login ➔'
              : 'Não tem uma conta? Cadastre-se grátis ➔'}
          </button>
        </div>
      </div>
    </div>
  )
}