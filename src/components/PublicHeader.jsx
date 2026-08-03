import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function PublicHeader() {
  const [session, setSession] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Verifica se existe usuário logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 🔴 SE O USUÁRIO ESTIVER LOGADO, NÃO EXIBE O MENU PÚBLICO
  if (session) {
    return null
  }

  const isActive = (path) => location.pathname === path
  const closeMenu = () => setIsMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        
{/* LOGO EVALUAOS */}
<Link to="/" onClick={closeMenu} className="flex items-center gap-2 group">
  <img 
    src="/Imagens/Logo_png.png" 
    alt="EvaluaOS Logo" 
    className="h-[70px] w-auto object-contain group-hover:scale-105 transition-transform" 
  />
  <div className="flex flex-col">
    <span className="text-base font-black text-slate-900 tracking-tight leading-none">
      Evalua<span className="text-emerald-600">OS</span>
    </span>
    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
      Antropometria de Precisão
    </span>
  </div>
</Link>

        {/* 💻 MENU DESKTOP */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
          <Link 
            to="/" 
            className={`transition-colors ${isActive('/') ? 'text-emerald-600 font-extrabold' : 'hover:text-emerald-600'}`}
          >
            🏠 Início
          </Link>
          
          <Link 
            to="/aprendizado" 
            className={`transition-colors ${isActive('/aprendizado') || location.pathname.startsWith('/aprendizado') ? 'text-emerald-600 font-extrabold' : 'hover:text-emerald-600'}`}
          >
            📚 Aprendizado
          </Link>
          
          <Link 
            to="/precos" 
            className={`transition-colors ${isActive('/precos') ? 'text-emerald-600 font-extrabold' : 'hover:text-emerald-600'}`}
          >
            💰 Preços
          </Link>
          
          <Link 
            to="/contato" 
            className={`transition-colors ${isActive('/contato') ? 'text-emerald-600 font-extrabold' : 'hover:text-emerald-600'}`}
          >
            📞 Contato
          </Link>

          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all ml-1"
          >
            🔐 Entrar
          </button>
        </nav>

        {/* 📱 BOTÃO HAMBÚRGUER (MOBILE) */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2.5 rounded-xl text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all focus:outline-none"
          aria-label="Menu de Navegação"
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* 📱 MENU DROPDOWN MOBILE */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-2 shadow-xl animate-fadeIn">
          <Link
            to="/"
            onClick={closeMenu}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              isActive('/') 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-base">🏠</span> Início
          </Link>

          <Link
            to="/aprendizado"
            onClick={closeMenu}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              isActive('/aprendizado') || location.pathname.startsWith('/aprendizado')
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-base">📚</span> Central de Aprendizado
          </Link>

          <Link
            to="/precos"
            onClick={closeMenu}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              isActive('/precos') 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-base">💰</span> Planos e Preços
          </Link>

          <Link
            to="/contato"
            onClick={closeMenu}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              isActive('/contato') 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-base">📞</span> Fale Conosco / Suporte
          </Link>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                closeMenu()
                navigate('/login')
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-2xl shadow-md shadow-emerald-600/20 transition-all"
            >
              🔐 Acessar Minha Conta
            </button>
          </div>
        </div>
      )}
    </header>
  )
}