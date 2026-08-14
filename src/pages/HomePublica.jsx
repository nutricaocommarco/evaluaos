import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import { CONTEUDOS_APRENDIZADO } from '../data/conteudosAprendizado'

const FEATURES = [
  {
    emoji: '🗂️',
    cor: 'bg-emerald-100 text-emerald-700',
    titulo: 'Prontuário Completo',
    texto: 'Anamnese, linha do tempo, exames laboratoriais e histórico do paciente sempre à mão — sem pasta física, sem Word solto.',
  },
  {
    emoji: '🍎',
    cor: 'bg-amber-100 text-amber-700',
    titulo: 'Planos Alimentares',
    texto: 'Monte planos personalizados, orientações nutricionais e listas de recomendações prontas para reaproveitar em outros pacientes.',
  },
  {
    emoji: '📅',
    cor: 'bg-blue-100 text-blue-700',
    titulo: 'Agenda + Google Calendar',
    texto: 'Marque consultas e, com um clique, sincronize com seu Google Calendar — o link do Google Meet é gerado sozinho.',
    pro: true,
  },
  {
    emoji: '💬',
    cor: 'bg-teal-100 text-teal-700',
    titulo: 'Lembretes por WhatsApp',
    texto: 'Confirmação e lembrete de consulta chegam automaticamente no WhatsApp do seu paciente, sem você digitar nada.',
    pro: true,
  },
  {
    emoji: '📱',
    cor: 'bg-violet-100 text-violet-700',
    titulo: 'Portal do Paciente',
    texto: 'Um espaço só dele, direto do celular, pra ver plano alimentar, orientações, exames e horários marcados.',
  },
  {
    emoji: '🧬',
    cor: 'bg-rose-100 text-rose-700',
    titulo: 'Avaliação Científica',
    texto: 'Engine de Recomendação com +60 equações, Fracionamento 4C e comparação automática com tabelas ISAK e ARGOREF.',
  },
]

const PASSOS = [
  {
    numero: '1',
    titulo: 'Crie sua conta grátis',
    texto: 'Cadastro em menos de 2 minutos, sem cartão de crédito e sem burocracia.',
  },
  {
    numero: '2',
    titulo: 'Monte o prontuário do paciente',
    texto: 'Anamnese, avaliação física, plano alimentar e exames — tudo organizado num só lugar.',
  },
  {
    numero: '3',
    titulo: 'Automatize o resto',
    texto: 'Ligue a Agenda ao Google Calendar e ao WhatsApp, e deixe os lembretes saírem sozinhos.',
  },
]

const FAQS = [
  {
    q: 'Preciso pagar algo para começar?',
    a: 'Não. O plano Gratuito já libera prontuário, planos alimentares, agenda e avaliação física completos, sem cartão de crédito. Você só assina o Pro quando quiser pacientes ilimitados, sua marca nos laudos e a integração com Google Calendar e WhatsApp.',
  },
  {
    q: 'Meu paciente precisa instalar algum aplicativo?',
    a: 'Não. O Portal do Paciente funciona direto no navegador do celular. Se ele quiser, pode adicionar à tela inicial como um atalho, sem passar por loja de aplicativos.',
  },
  {
    q: 'Como funciona a integração com Google Calendar e WhatsApp?',
    a: 'Cada nutricionista conecta a própria conta do Google e o próprio número de WhatsApp. Os agendamentos criados no EvaluaOS entram automaticamente na sua agenda pessoal (com link do Meet), e o paciente recebe a confirmação e o lembrete direto no WhatsApp dele.',
  },
  {
    q: 'Meus dados e os dos meus pacientes estão seguros?',
    a: 'Sim. O acesso é isolado por nutricionista — cada um só enxerga os próprios pacientes — e os dados ficam protegidos por login individual. Detalhes completos na nossa Política de Privacidade.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim, sem fidelidade nem multa. O cancelamento do plano Pro é feito diretamente pela Hotmart, e todo o seu histórico e dados dos pacientes continuam preservados mesmo se você voltar para o Gratuito.',
  },
]

function MockupApp() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-w-md mx-auto">
      <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 border-b border-slate-200">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
        <span className="ml-3 px-2.5 py-0.5 bg-white rounded-md text-[10px] text-slate-400 font-medium truncate">
          app.evaluaos.com.br/pacientes
        </span>
      </div>
      <div className="flex text-left">
        <div className="w-12 sm:w-14 bg-slate-50 border-r border-slate-100 py-4 flex flex-col items-center gap-4">
          <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">👥</span>
          <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center text-xs">🍎</span>
          <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center text-xs">📅</span>
          <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center text-xs">⚙️</span>
        </div>
        <div className="flex-1 p-4 space-y-2.5">
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <div>
              <p className="text-[11px] font-bold text-slate-800">Consulta às 14:30 hoje</p>
              <p className="text-[10px] text-slate-500">Google Meet gerado automaticamente</p>
            </div>
            <span className="text-emerald-600 text-sm">🎥</span>
          </div>
          <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
            <div>
              <p className="text-[11px] font-bold text-slate-800">Lembrete enviado por WhatsApp</p>
              <p className="text-[10px] text-slate-500">Paciente confirmou presença</p>
            </div>
            <span className="text-teal-600 text-sm">✓</span>
          </div>
          <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
            <div>
              <p className="text-[11px] font-bold text-slate-800">Plano alimentar atualizado</p>
              <p className="text-[10px] text-slate-500">Visível no Portal do Paciente</p>
            </div>
            <span className="text-amber-600 text-sm">🍎</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePublica() {
  const navigate = useNavigate()
  const [faqAberta, setFaqAberta] = useState(0)

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">

      {/* 🟢 1. HEADER / NAVBAR GLOBAL FIXA */}
      <PublicHeader />

      {/* 🚀 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-14 md:pb-24 bg-gradient-to-b from-emerald-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* 🌟 LOGO EM DESTAQUE NO TOPO DA HOME */}
          <div className="flex justify-center items-center pb-6 sm:pb-8">
            <img
              src="/Imagens/Logo_png.png"
              alt="EvaluaOS Logo"
              className="h-36 sm:h-44 md:h-52 w-auto object-contain drop-shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div className="text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-full tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Feito para o dia a dia do consultório
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
                O sistema que organiza toda a sua clínica de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">nutrição</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Prontuário, planos alimentares, agenda com Google Calendar e Meet, lembretes automáticos por WhatsApp e um portal só para o seu paciente — tudo em um só sistema, com a mesma engine científica que você já confia para as avaliações físicas.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-105 transition-all"
                >
                  Começar Grátis Agora 🚀
                </button>
                <a
                  href="#tour"
                  className="w-full sm:w-auto px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all text-center"
                >
                  Ver Como Funciona
                </a>
              </div>

              <p className="text-[11px] text-slate-400 font-semibold pt-1">
                ✅ Comece de graça &nbsp;•&nbsp; ✅ Sem cartão de crédito &nbsp;•&nbsp; ✅ Configure em minutos
              </p>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-tr from-emerald-200/40 to-teal-200/40 blur-3xl rounded-full -z-10"></div>
              <MockupApp />
            </div>

          </div>
        </div>
      </section>

      {/* 😩 2.2 PROBLEMA -> SOLUÇÃO */}
      <section className="py-14 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Prontuário no Word, agenda no papel, lembrete manual no WhatsApp?
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Cada paciente espalhado entre planilha de avaliação, agenda do celular, Word do plano alimentar e conversa perdida no WhatsApp custa tempo — e passa insegurança pro paciente. O EvaluaOS junta tudo isso em um só lugar, pra você focar na consulta, não na organização.
          </p>
        </div>
      </section>

      {/* 🧩 2.3 GRID DE FEATURES DO PRODUTO */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Tudo em um só sistema</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900">O que você ganha com o EvaluaOS</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.titulo} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all space-y-3 relative">
                {f.pro && (
                  <span className="absolute top-4 right-4 px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase rounded-md tracking-wider">
                    Pro
                  </span>
                )}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${f.cor}`}>
                  {f.emoji}
                </div>
                <h3 className="text-sm font-bold text-slate-900">{f.titulo}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🎬 3. SEÇÃO DE VÍDEO DE APRESENTAÇÃO */}
      <section id="tour" className="pb-16 pt-16 bg-white relative z-10 border-b border-slate-100 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
              ▶️ Conheça a plataforma por dentro
            </span>
          </div>

          <div className="p-2 sm:p-4 bg-slate-50 rounded-[2rem] shadow-2xl border border-slate-200">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 relative shadow-inner">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/s0VPmv7gkF0?si=Q4lH_24iGjPZ-99O"
                title="EvaluaOS Tour Completo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* 📱 4. DEMONSTRAÇÃO INTERATIVA DO LAUDO E EVOLUÇÃO EM TEMPO REAL */}
      <section className="py-16 bg-gradient-to-b from-white via-emerald-50/40 to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">

          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Experiência do Paciente
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
              Veja como seu paciente visualiza o Laudo e a Evolução
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Acesse os links reais de demonstração do sistema e confira a experiência interativa, limpa e profissional que seus pacientes receberão.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Card 1: Laudo Antropométrico */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-transform">
                  📄
                </div>
                <div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-lg border border-emerald-100">
                    Demonstração Viva
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">
                    Laudo Antropométrico Interativo
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Relatório completo com composição corporal 4C/2C, Somatotipo, indicadores de saúde, fracionamento tecidual e orientações do avaliador.
                </p>
              </div>

              <a
                href="https://evaluaos.nutricaocommarco.com.br/laudo/e67fbcda-cbef-416e-9d39-33b052bcff0d"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-2 shadow-md"
              >
                <span>Abrir Exemplo de Laudo</span>
                <span>➔</span>
              </a>
            </div>

            {/* Card 2: Evolução do Paciente */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-transform">
                  📈
                </div>
                <div>
                  <span className="px-3 py-1 bg-teal-50 text-teal-700 text-[10px] font-bold uppercase rounded-lg border border-teal-100">
                    Acompanhamento Temporal
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">
                    Painel de Evolução do Paciente
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Gráficos comparativos de dobras cutâneas (mm), perímetros, alteração de massa muscular/adiposa e histórico completo de reavaliações.
                </p>
              </div>

              <a
                href="https://evaluaos.nutricaocommarco.com.br/evolucao/cf5f2d22dd728039c1d8d4a0364e893d"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-2 shadow-md"
              >
                <span>Abrir Exemplo de Evolução</span>
                <span>➔</span>
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* 🪜 5. COMO FUNCIONA */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Sem complicação</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900">Como funciona na prática</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {PASSOS.map((p, idx) => (
              <div key={p.numero} className="relative text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  {p.numero}
                </div>
                <h3 className="text-sm font-bold text-slate-900">{p.titulo}</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-[220px] mx-auto">{p.texto}</p>
                {idx < PASSOS.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-[60%] w-full h-px bg-gradient-to-r from-emerald-200 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🧬 6. POR QUE O EVALUAOS É DIFERENTE? */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">

          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">A Mudança de Paradigma</span>
            <h2 className="text-2xl sm:text-4xl font-black">Por que parar de depender apenas de porcentagens de gordura?</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Distorções de hidratação alteram leituras do DXA e de equações isoladas. O EvaluaOS combina o Somatório em milímetros a travas anatômicas em quilogramas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold text-lg">
                🧠
              </div>
              <h3 className="text-base font-bold text-white">Engine de Recomendação Científica</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                O sistema testa as +60 equações em tempo real e entrega um ranking com as 3 fórmulas mais recomendadas e a justificativa clínica de cada uma.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold text-lg">
                🔒
              </div>
              <h3 className="text-base font-bold text-white">Fracionamento 4C & Trava de Kerr</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Calcula o tecido adiposo (Kerr), muscular (Lee), ósseo (Rocha) e residual (Würch). A massa adiposa em kg atua como teto biológico contra falsos diagnósticos.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold text-lg">
                📊
              </div>
              <h3 className="text-base font-bold text-white">Índices de Saúde & Tabelas Normativas</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Acompanhe o Índice Adiposo Muscular (IAM), Músculo Ósseo (IMO), Área Visceral (apVAT), Morrow (2003) e comparações automáticas com as tabelas ARGOREF e ISAK.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 📚 7. CENTRAL DE APRENDIZADO ABERTA */}
      <section id="aprendizado" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Base Científica Aberta</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Artigos e Fichamentos Comentados</h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
                Acesse resumos práticos com análises críticas de metodologia para embasar suas condutas clínicas.
              </p>
            </div>

            <button
              onClick={() => navigate('/aprendizado')}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-600 text-xs font-bold rounded-xl shadow-sm transition-all whitespace-nowrap self-start md:self-auto"
            >
              Explorar Todos os Artigos ➔
            </button>
          </div>

          {/* Cards dos Artigos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CONTEUDOS_APRENDIZADO.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/aprendizado/${item.id}`)}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                    <img src={item.capa} alt={item.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold rounded-lg uppercase">
                      {item.categoria}
                    </span>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
                      {item.titulo}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {item.resumoCard || item.descricao}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 text-[11px] text-emerald-600 font-bold border-t border-slate-50 pt-3 flex items-center justify-between">
                  <span>{item.tempoLeitura}</span>
                  <span className="group-hover:translate-x-1 transition-transform">Ler Análise ➔</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 💰 8. SEÇÃO DE PREÇOS NA HOME */}
      <section id="precos" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 space-y-12">

        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Acesso Transparente</span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">Escolha o seu Plano</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Comece grátis com prontuário, planos alimentares, agenda e avaliação física completos, ou assine o Pro para atendimento ilimitado, marca própria e integrações automáticas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

          {/* Plano Gratuito */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-lg">Para Começar</span>
              <h3 className="text-xl font-black text-slate-900">Plano Gratuito</h3>
              <div className="text-3xl font-black text-slate-900">R$ 0 <span className="text-xs text-slate-400 font-normal">/ plano gratuito</span></div>

              <ul className="space-y-2.5 text-xs text-slate-600 pt-2">
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> <strong>Até 7 Pacientes grátis</strong></li>
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Prontuário, Planos Alimentares e Anamneses</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Agenda de Consultas e Portal do Paciente</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Engine de Recomendação de Equações</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Fracionamento 4 Componentes (Kerr)</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Laboratório de Equações (+60 equações)</li>
              </ul>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all"
            >
              Criar Conta Grátis
            </button>
          </div>

          {/* Plano Pro */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white p-8 rounded-3xl shadow-2xl space-y-6 flex flex-col justify-between relative overflow-hidden border border-emerald-500/30">
            <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500 text-white text-[10px] font-extrabold uppercase rounded-full tracking-wider shadow-lg">
              Recomendado
            </div>

            <div className="space-y-4">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-lg border border-emerald-500/30">
                Profissional
              </span>
              <h3 className="text-xl font-black text-white">EvaluaOS Pro</h3>
              <div>
                <div className="text-3xl font-black text-white">R$ 29,90 <span className="text-xs text-slate-400 font-normal">/ mês</span></div>
                <span className="text-[11px] text-emerald-400 font-bold block mt-1">
                  Ou R$ 20,75/mês no plano Anual (30% OFF)
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> <strong>Tudo do Plano Gratuito +</strong></li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> <strong>Pacientes e Avaliações Ilimitadas</strong></li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> <strong>Google Calendar + Meet automático</strong></li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> <strong>Lembretes automáticos por WhatsApp</strong></li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Personalização com sua Logomarca Própria</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Backup de Dados Automático na Nuvem</li>
              </ul>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
              >
                Assinar Plano Pro 🚀
              </button>
              <button
                onClick={() => navigate('/precos')}
                className="w-full text-center text-[11px] text-slate-400 hover:text-emerald-400 transition-colors font-bold block"
              >
                Ver Tabela Comparativa Completa ➔
              </button>
            </div>
          </div>

        </div>

      </section>

      {/* ❓ 9. FAQ */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Dúvidas Frequentes</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Antes de começar</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setFaqAberta(faqAberta === idx ? null : idx)}
                  className="w-full text-left px-5 py-4 flex justify-between items-center gap-4 font-bold text-sm text-slate-800 hover:text-emerald-600 transition-colors"
                >
                  <span>{item.q}</span>
                  <span className="text-slate-400 font-black shrink-0">{faqAberta === idx ? '−' : '+'}</span>
                </button>
                {faqAberta === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🧲 10. BANNER FINAL DE CTA */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black">
            Pronto para organizar toda a sua prática nutricional?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Crie sua conta grátis agora e comece a usar prontuário, planos alimentares, agenda e avaliação física com precisão científica — sem cartão de crédito.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-white hover:bg-emerald-50 text-emerald-900 font-black text-xs uppercase tracking-wider rounded-2xl shadow-2xl transition-all hover:scale-105"
          >
            Cadastrar-se Gratuitamente ➔
          </button>
        </div>
      </section>

      {/* 📞 11. RODAPÉ INSTITUCIONAL */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">

          <div className="space-y-1 text-center md:text-left">
            <span className="font-bold text-white text-sm">EvaluaOS</span>
            <p className="text-slate-500">Desenvolvido com rigor científico pra nutricionistas cuidarem de toda a jornada do paciente.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-slate-300 font-semibold">
            <a href="mailto:contato@nutricaocommarco.com.br" className="hover:text-emerald-400 transition-colors">
              ✉️ contato@nutricaocommarco.com.br
            </a>
            <a href="https://www.instagram.com/nutricao_com_marco/" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">
              📸 Instagram
            </a>
            <Link to="/politica-de-privacidade" className="hover:text-emerald-400 transition-colors">
              Política de Privacidade
            </Link>
            <Link to="/termos-de-servico" className="hover:text-emerald-400 transition-colors">
              Termos de Serviço
            </Link>
          </div>

        </div>
      </footer>

    </div>
  )
}
