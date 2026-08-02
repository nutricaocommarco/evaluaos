import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function PublicHeader() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        
        {/* LOGO EVALUAOS */}
        <Link to="/" className="flex items-center gap-2 group">
          <img 
            src="/Imagens/Logo_png.png" 
            alt="EvaluaOS Logo" 
            className="h-10 w-auto object-contain group-hover:scale-105 transition-transform" 
          />
          <div className="hidden sm:flex flex-col">
            <span className="text-base font-black text-slate-900 tracking-tight leading-none">
              Evalua<span className="text-emerald-600">OS</span>
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Antropometria de Precisão
            </span>
          </div>
        </Link>

        {/* MENU DE NAVEGAÇÃO PÚBLICO */}
        <nav className="flex items-center gap-3 sm:gap-6 text-xs font-bold text-slate-600">
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
      </div>
    </header>
  )
}