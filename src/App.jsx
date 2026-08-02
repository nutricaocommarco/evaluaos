import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'

// Importando suas telas 
import Login from './pages/Login'
import Pacientes from './pages/Pacientes'
import EscolhaPercGordura from './pages/EscolhaPercGordura'
import AvaliacaoForm from './pages/AvaliacaoForm'
import ResultadoAvaliacao from './pages/ResultadoAvaliacao'
import Avaliador from './pages/Avaliador'
import EvolucaoPaciente from './pages/EvolucaoPaciente' 
import Configuracoes from './pages/Configuracoes'
import MeuPlano from './pages/MeuPlano'
import Aprendizado from './pages/Aprendizado'
import ArtigoDetalhe from './pages/ArtigoDetalhe' // 🌟 Novo componente para os artigos explicativos

function MainApp() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const menuItems = [
    { 
      name: 'Pacientes', path: '/pacientes',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> 
    },
    { 
      name: 'Nova Avaliação', path: '/nova-avaliacao',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg> 
    },
    { 
      name: 'Equações', path: '/equacoes-de-regressao',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3"></path><path d="M9 11.2h5.7"></path></svg> 
    },
    { 
      name: 'Laudo', path: '/laudo-antropometrico',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> 
    },
    { 
      name: 'Evolução', path: '/evolucao',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> 
    },
    { 
      name: 'Avaliador', path: '/avaliador',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg> 
    },
    { 
      name: 'Meu Plano', path: '/meu-plano',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
    },
    { 
      name: 'Aprendizado', path: '/aprendizado',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> 
    },
    { 
      name: 'Configurações', path: '/configuracoes',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> 
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-emerald-600 font-bold animate-pulse text-xl">Carregando EvaluaOS...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* ROTA PÚBLICA: Liberada para o paciente acessar sem senha */}
        <Route path="/laudo/:tokenUrl" element={<ResultadoAvaliacao />} />
        <Route path="/evolucao/:tokenUrl" element={<EvolucaoPaciente />} />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed md:relative z-50 h-full bg-white shadow-xl border-r border-gray-100 flex flex-col transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'}
        `}
      >
        <div className="h-[72px] flex items-center justify-center border-b border-gray-100">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors focus:outline-none"
            title="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.name}
              title={!isSidebarOpen ? item.name : ''}
              onClick={() => {
                navigate(item.path)
                if (window.innerWidth < 768) setIsSidebarOpen(false) 
              }}
              className={`
                flex items-center p-3 rounded-xl transition-all duration-200 overflow-hidden group
                ${currentPath.startsWith(item.path) 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-emerald-700'
                }
              `}
            >
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8">
                {item.icon}
              </div>
              <span className={`ml-3 whitespace-nowrap font-medium text-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        <header className="bg-white shadow-sm border-b border-gray-100 px-4 h-[72px] flex justify-between items-center shrink-0">
          
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 text-gray-500 hover:text-emerald-600 focus:outline-none"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => navigate('/pacientes')}
            >
              <img src="/Imagens/Logo_png.png" alt="EvaluaOS" className="h-[70px] w-auto object-contain" />
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-black text-gray-800 tracking-tight">EvaluaOS</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Antropometria</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs sm:text-sm font-medium text-gray-600 truncate max-w-[150px] sm:max-w-none">
              {session.user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/pacientes" replace />} />
            <Route path="/login" element={<Navigate to="/pacientes" replace />} />
            
            <Route path="/pacientes" element={<Pacientes userId={session.user.id} />} />
            <Route path="/nova-avaliacao" element={<AvaliacaoForm />} />
            <Route path="/equacoes-de-regressao" element={<EscolhaPercGordura />} />
            <Route path="/laudo-antropometrico" element={<ResultadoAvaliacao />} />
            <Route path="/evolucao" element={<EvolucaoPaciente />} />
            <Route path="/avaliador" element={<Avaliador userId={session.user.id} />} />
            <Route path="/meu-plano" element={<MeuPlano />} />
            <Route path="/laudo/:tokenUrl" element={<ResultadoAvaliacao />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/evolucao/:tokenUrl" element={<EvolucaoPaciente />} />
            
            {/* 🎯 Central de Aprendizado e Rota do Artigo Detalhado */}
            <Route path="/aprendizado" element={<Aprendizado />} />
            <Route path="/aprendizado/:artigoId" element={<ArtigoDetalhe />} />

            <Route path="*" element={
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <h2 className="text-2xl font-black text-gray-800 mb-2">Página em Construção</h2>
                <p className="text-gray-500 max-w-md">
                  A seção selecionada está sendo desenvolvida. Em breve você poderá acessá-la por aqui!
                </p>
              </div>
            } />
          </Routes>
        </main>
      </div>

    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  )
}
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const menuItems = [
    { 
      name: 'Pacientes', path: '/pacientes',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> 
    },
    { 
      name: 'Nova Avaliação', path: '/nova-avaliacao',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg> 
    },
    { 
      name: 'Equações', path: '/equacoes-de-regressao',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3"></path><path d="M9 11.2h5.7"></path></svg> 
    },
    { 
      name: 'Laudo', path: '/laudo-antropometrico',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> 
    },
    { 
      name: 'Evolução', path: '/evolucao',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> 
    },
    { 
      name: 'Avaliador', path: '/avaliador',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg> 
    },
    { 
      // 🌟 ITEM NOVO: MEU PLANO & ASSINATURA
      name: 'Meu Plano', path: '/meu-plano',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
    },
    { 
      name: 'Aprendizado', path: '/aprendizado',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> 
    },
    { 
      name: 'Configurações', path: '/configuracoes',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> 
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-emerald-600 font-bold animate-pulse text-xl">Carregando EvaluaOS...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* ROTA PÚBLICA: Liberada para o paciente acessar sem senha */}
        <Route path="/laudo/:tokenUrl" element={<ResultadoAvaliacao />} />
        <Route path="/evolucao/:tokenUrl" element={<EvolucaoPaciente />} />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed md:relative z-50 h-full bg-white shadow-xl border-r border-gray-100 flex flex-col transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'}
        `}
      >
        <div className="h-[72px] flex items-center justify-center border-b border-gray-100">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors focus:outline-none"
            title="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.name}
              title={!isSidebarOpen ? item.name : ''}
              onClick={() => {
                navigate(item.path)
                if (window.innerWidth < 768) setIsSidebarOpen(false) 
              }}
              className={`
                flex items-center p-3 rounded-xl transition-all duration-200 overflow-hidden group
                ${currentPath.startsWith(item.path) 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-emerald-700'
                }
              `}
            >
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8">
                {item.icon}
              </div>
              <span className={`ml-3 whitespace-nowrap font-medium text-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        <header className="bg-white shadow-sm border-b border-gray-100 px-4 h-[72px] flex justify-between items-center shrink-0">
          
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 text-gray-500 hover:text-emerald-600 focus:outline-none"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <img src="/Imagens/Logo_png.png" alt="EvaluaOS" className="h-[70px] w-auto object-contain" />
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-black text-gray-800 tracking-tight">EvaluaOS</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Antropometria</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs sm:text-sm font-medium text-gray-600 truncate max-w-[150px] sm:max-w-none">
              {session.user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/pacientes" replace />} />
            <Route path="/login" element={<Navigate to="/pacientes" replace />} />
            
            <Route path="/pacientes" element={<Pacientes userId={session.user.id} />} />
            <Route path="/nova-avaliacao" element={<AvaliacaoForm />} />
            <Route path="/equacoes-de-regressao" element={<EscolhaPercGordura />} />
            <Route path="/laudo-antropometrico" element={<ResultadoAvaliacao />} />
            <Route path="/evolucao" element={<EvolucaoPaciente />} />
            <Route path="/avaliador" element={<Avaliador userId={session.user.id} />} />
            <Route path="/meu-plano" element={<MeuPlano />} />
            <Route path="/laudo/:tokenUrl" element={<ResultadoAvaliacao />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/evolucao/:tokenUrl" element={<EvolucaoPaciente />} />
            <Route path="/Aprendizado" element={<Aprendizado />} />

            <Route path="*" element={
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <h2 className="text-2xl font-black text-gray-800 mb-2">Página em Construção</h2>
                <p className="text-gray-500 max-w-md">
                  A seção selecionada está sendo desenvolvida. Em breve você poderá acessá-la por aqui!
                </p>
              </div>
            } />
          </Routes>
        </main>
      </div>

    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  )
}
