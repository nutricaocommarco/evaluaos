import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { ThemeProvider } from './contexts/ThemeContext'
import { PlanoProvider, usePlano } from './contexts/PlanoContext'
import { Users, Apple, UserCheck, Star, BookOpen, Settings } from 'lucide-react'

// Importando suas telas 
import HomePublica from './pages/HomePublica'
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
import ArtigoDetalhe from './pages/ArtigoDetalhe'
import Precos from './pages/Precos'
import Contato from './pages/Contato'
import CalculadoraGastoCalorico from './pages/CalculadoraGastoCalorico';
import ProntuarioPaciente from './pages/ProntuarioPaciente';
import TabelaAlimentos from './pages/TabelaAlimentos';
import PlanoAlimentar from './pages/PlanoAlimentar';
import Anamnese from './pages/Anamnese';
import OrientacoesNutricionais from './pages/OrientacoesNutricionais';
import LinhaDoTempo from './pages/LinhaDoTempo';
import ListasRecomendacoes from './pages/ListasRecomendacoes';
import EmConstrucao from './components/EmConstrucao';
import LayoutComPaciente from './components/LayoutComPaciente';

function MainApp() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isBeta } = usePlano()

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

  // Antropometria (Nova Avaliação/Equações/Laudo/Gasto Calórico/Evolução)
  // saiu daqui — agora mora dentro do menu do paciente (SidebarPaciente.jsx),
  // já que é sempre uma ação sobre UM paciente específico. O menu global
  // fica só com o que não é por-paciente.
  const menuItems = [
    { name: 'Pacientes', path: '/pacientes', icon: <Users size={20} /> },
    ...(isBeta ? [{ name: 'Alimentos', path: '/alimentos', icon: <Apple size={20} /> }] : []),
    { name: 'Avaliador', path: '/avaliador', icon: <UserCheck size={20} /> },
    { name: 'Meu Plano', path: '/meu-plano', icon: <Star size={20} /> },
    { name: 'Aprendizado', path: '/aprendizado', icon: <BookOpen size={20} /> },
    { name: 'Configurações', path: '/configuracoes', icon: <Settings size={20} /> },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="text-primary-600 font-bold animate-pulse text-xl">Carregando EvaluaOS...</p>
      </div>
    )
  }

  // 🔴 USUÁRIO NÃO LOGADO: Acessa a Landing Page, Login, Preços, Contato e Aprendizado
  if (!session) {
    return (
      <Routes>
        <Route path="/" element={<HomePublica />} />
        <Route path="/login" element={<Login />} />
        
        {/* ROTAS PÚBLICAS DO PACIENTE (Acesso via Token) */}
        <Route path="/laudo/:tokenUrl" element={<ResultadoAvaliacao />} />
        <Route path="/evolucao/:tokenUrl" element={<EvolucaoPaciente />} />

        {/* INSTITUCIONAL & SEO */}
        <Route path="/aprendizado" element={<Aprendizado />} />
        <Route path="/aprendizado/:artigoId" element={<ArtigoDetalhe />} />
        <Route path="/precos" element={<Precos />} />
        <Route path="/contato" element={<Contato />} />
        
        {/* Redireciona qualquer rota desconhecida de visitante para a Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  // 🟢 USUÁRIO LOGADO: Painel Interno Completo
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden">
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed md:relative z-50 h-full bg-white dark:bg-slate-900 shadow-xl border-r border-gray-100 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'}
        `}
      >
        <div className="h-[72px] flex items-center justify-center border-b border-gray-100 dark:border-slate-800">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 dark:bg-primary-900/20 rounded-lg transition-colors focus:outline-none"
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
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 dark:hover:bg-slate-800 hover:text-primary-700 dark:hover:text-primary-400'
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
        
        <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-100 dark:border-slate-800 px-4 h-[72px] flex justify-between items-center shrink-0">

          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 -ml-2 text-gray-500 dark:text-slate-400 hover:text-primary-600 focus:outline-none"
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
                <span className="text-sm font-black text-gray-800 dark:text-slate-100 tracking-tight">EvaluaOS</span>
                <span className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider">Antropometria</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400 truncate max-w-[150px] sm:max-w-none">
              {session.user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/40 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-950/70 dark:bg-red-900/20 rounded-lg transition-colors"
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
            <Route path="/pacientes/:id/prontuario" element={<ProntuarioPaciente userId={session.user.id} />} />
            <Route path="/pacientes/:id/plano-alimentar" element={<PlanoAlimentar userId={session.user.id} />} />
            <Route path="/pacientes/:id/anamnese" element={<Anamnese userId={session.user.id} />} />
            <Route path="/pacientes/:id/orientacoes-nutricionais" element={<OrientacoesNutricionais userId={session.user.id} />} />
            <Route path="/pacientes/:id/linha-do-tempo" element={<LinhaDoTempo />} />
            <Route path="/pacientes/:id/listas-recomendacoes" element={<ListasRecomendacoes userId={session.user.id} />} />
            <Route path="/alimentos" element={<TabelaAlimentos userId={session.user.id} />} />
            <Route path="/nova-avaliacao" element={<LayoutComPaciente itemAtivo="nova_avaliacao"><AvaliacaoForm /></LayoutComPaciente>} />
            <Route path="/equacoes-de-regressao" element={<LayoutComPaciente itemAtivo="equacoes"><EscolhaPercGordura /></LayoutComPaciente>} />
            <Route path="/laudo-antropometrico" element={<LayoutComPaciente itemAtivo="laudo"><ResultadoAvaliacao /></LayoutComPaciente>} />
            <Route path="/evolucao" element={<LayoutComPaciente itemAtivo="evolucao"><EvolucaoPaciente /></LayoutComPaciente>} />
            <Route path="/avaliador" element={<Avaliador userId={session.user.id} />} />
            <Route path="/meu-plano" element={<MeuPlano />} />
            {/* Mesma url de /laudo/:tokenUrl e /evolucao/:tokenUrl que o paciente usa
                sem login — mas isso aqui só existe dentro do bloco autenticado
                (session existe), então o menu do paciente só aparece pra quem
                está logado. A versão registrada lá embaixo, no bloco `!session`
                (visitante sem login), é a mesma página SEM este wrapper. */}
            <Route path="/laudo/:tokenUrl" element={<LayoutComPaciente itemAtivo="laudo" tokenViaAvaliacao><ResultadoAvaliacao /></LayoutComPaciente>} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/evolucao/:tokenUrl" element={<LayoutComPaciente itemAtivo="evolucao"><EvolucaoPaciente /></LayoutComPaciente>} />
            <Route path="/planejamento-calorico" element={<LayoutComPaciente itemAtivo="gasto_energetico"><CalculadoraGastoCalorico /></LayoutComPaciente>} />
            
            {/* Central de Aprendizado acessível internamente */}
            <Route path="/aprendizado" element={<Aprendizado />} />
            <Route path="/aprendizado/:artigoId" element={<ArtigoDetalhe />} />

            <Route path="*" element={<EmConstrucao />} />
          </Routes>
        </main>
      </div>

    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <PlanoProvider>
          <MainApp />
        </PlanoProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}