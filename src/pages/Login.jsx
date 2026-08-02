import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { CONTEUDOS_APRENDIZADO } from '../data/conteudosAprendizado'

export default function Login({ onLoginSuccess }) {
  // Lógica de Autenticação Supabase
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [crnNumep, setCrnNumep] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')

  const navigate = useNavigate()

  // Função para rolagem suave na página
  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

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

        // 2. Criar a linha do avaliador vinculando o auth_id
        if (authData?.user) {
          const { error: dbError } = await supabase.from('avaliadores').insert([
            {
              auth_id: authData.user.id,
              email: email,
              nome_completo: nome,
              crn_numep: crnNumep,
              plano_status: 'gratis',
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
          const { data: avalExistente } = await supabase
            .from('avaliadores')
            .select('id')
            .eq('auth_id', data.user.id)
            .maybeSingle()

          if (!avalExistente) {
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
    <div className="min-h-screen bg-white text-gray-800 font-sans selection:bg-emerald-500 selection:text-white">
      {/* 🟢 1. NAVBAR FIXA */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img src="/Imagens/Logo_png.png" alt="EvaluaOS Logo" className="h-10 w-auto object-contain" />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-gray-600">
            <button onClick={() => scrollToSection('aprendizado')} className="hover:text-emerald-600 transition-colors">Aprendizado</button>
            <button onClick={() => scrollToSection('precos')} className="hover:text-emerald-600 transition-colors">Preços</button>
            <button onClick={() => scrollToSection('contato')} className="hover:text-emerald-600 transition-colors">Contato</button>
          </nav>

          <button
            onClick={() => { setIsSignUp(false); scrollToSection('login-form') }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            Acessar Conta ➔
          </button>
        </div>
      </header>

      {/* 🚀 2. HERO SECTION */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 uppercase tracking-widest">
          Ciência Aplicada à Antropometria
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 max-w-3xl mx-auto leading-tight">
          Laudos Antropométricos Precisos com Rigor ISAK
        </h1>
        <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Automatize o cálculo do Erro Técnico de Medição (ETM), Somatório de Dobras em mm e comparações normativas sem complicações.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => { setIsSignUp(true); scrollToSection('login-form') }}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
          >
            Criar Conta Grátis
          </button>
          <button
            onClick={() => scrollToSection('aprendizado')}
            className="w-full sm:w-auto px-8 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
          >
            Conhecer a Base Científica
          </button>
        </div>
      </section>

      {/* 📚 3. SEÇÃO APRENDIZADO (SEO & AUTORIDADE) */}
      <section id="aprendizado" className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Base de Conhecimento Aberta</span>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">Central de Aprendizado</h2>
            <p className="text-xs text-gray-500 max-w-xl mx-auto">
              Artigos científicos comentados, guias práticos e metodologias de avaliação física abertas para toda a comunidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CONTEUDOS_APRENDIZADO.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/aprendizado/${item.id}`)}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="h-40 w-full bg-gray-100 overflow-hidden relative">
                    <img src={item.capa} alt={item.titulo} className="w-full h-full object-cover" />
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-lg uppercase">
                      {item.categoria}
                    </span>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{item.titulo}</h3>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{item.resumoCard || item.descricao}</p>
                  </div>
                </div>
                <div className="p-5 pt-0 text-xs text-emerald-600 font-bold border-t border-gray-50 pt-3 flex justify-between">
                  <span>{item.tempoLeitura}</span>
                  <span>Ler Artigo ➔</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => navigate('/aprendizado')}
              className="px-6 py-2.5 bg-white border border-gray-200 hover:border-emerald-500 text-gray-700 hover:text-emerald-600 text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              Ver Todos os Artigos e Tutoriais ➔
            </button>
          </div>
        </div>
      </section>

      {/* 💰 4. SEÇÃO PREÇOS */}
      <section id="precos" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Transparência</span>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">Planos e Valores</h2>
          <p className="text-xs text-gray-500">Escolha o plano ideal para a sua rotina de atendimentos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plano Gratuito */}
          <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded-lg">Gratuito</span>
              <h3 className="text-xl font-black text-gray-900">Plano Gratuito</h3>
              <div className="text-3xl font-black text-gray-900">R$ 0 <span className="text-xs text-gray-400 font-normal">/ para sempre</span></div>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-center gap-2">✓ Acesso 100% livre à Central de Aprendizado</li>
                <li className="flex items-center gap-2">✓ Cadastro de pacientes teste</li>
                <li className="flex items-center gap-2">✓ Modelos de avaliação básica</li>
              </ul>
            </div>
            <button
              onClick={() => { setIsSignUp(true); scrollToSection('login-form') }}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all"
            >
              Criar Conta Grátis
            </button>
          </div>

          {/* Plano Pro */}
          <div className="bg-emerald-900 text-white p-8 rounded-3xl shadow-xl space-y-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-full">Recomendado</div>
            <div className="space-y-4">
              <span className="px-3 py-1 bg-emerald-800 text-emerald-300 text-[10px] font-bold uppercase rounded-lg">Profissional</span>
              <h3 className="text-xl font-black">EvaluaOS Pro</h3>
              <div className="text-3xl font-black text-white">R$ 49,90 <span className="text-xs text-emerald-300 font-normal">/ mês</span></div>
              <ul className="space-y-2 text-xs text-emerald-100">
                <li className="flex items-center gap-2">✓ Avaliações e laudos ilimitados</li>
                <li className="flex items-center gap-2">✓ Cálculo automático de ETM (Erro Técnico)</li>
                <li className="flex items-center gap-2">✓ Baremos ARGOREF e Fracionamento 5 Massas</li>
                <li className="flex items-center gap-2">✓ Comparativos de evolução em PDF estilizados</li>
              </ul>
            </div>
            <button
              onClick={() => { setIsSignUp(true); scrollToSection('login-form') }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              Assinar Plano Pro
            </button>
          </div>
        </div>
      </section>

      {/* 🔐 5. FORMULÁRIO DE LOGIN / CADASTRO */}
      <section id="login-form" className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-md mx-auto px-4 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMsg(''); setInfoMsg('') }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isSignUp ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMsg(''); setInfoMsg('') }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isSignUp ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Criar Conta
              </button>
            </div>

            <div className="flex flex-col items-center">
              <img src="/Imagens/Logo_png.png" alt="EvaluaOS Logo" className="h-24 w-auto object-contain mb-2" />
              <p className="text-xs text-gray-500 text-center">
                {isSignUp ? 'Crie sua conta de Avaliador' : 'Acesse sua conta profissional'}
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            {infoMsg && (
              <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded text-xs text-green-700">
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
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Nome completo"
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
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
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
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
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
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                {loading ? 'Carregando...' : isSignUp ? 'Cadastrar Avaliador' : 'Entrar no Sistema'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 📞 6. CONTATO E RODAPÉ */}
      <footer id="contato" className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="font-bold text-white text-sm">EvaluaOS</span>
            <p>Desenvolvido com rigor científico para nutricionistas e antropometristas.</p>
          </div>

          <div className="flex items-center gap-6 text-gray-300 font-semibold">
            <a href="mailto:contato@evaluaos.com.br" className="hover:text-emerald-400 transition-colors">Suporte por E-mail</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
