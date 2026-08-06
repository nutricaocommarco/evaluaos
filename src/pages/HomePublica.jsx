import React from 'react'
import { useNavigate } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import { CONTEUDOS_APRENDIZADO } from '../data/conteudosAprendizado'

export default function HomePublica() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* 🟢 1. HEADER / NAVBAR GLOBAL FIXA */}
      <PublicHeader />

      {/* 🚀 2. HERO SECTION (Com Logo Grande) */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 bg-gradient-to-b from-emerald-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-6">
          
          {/* 🌟 LOGO GRANDE EM DESTAQUE NA HOME */}
          <div className="flex justify-center items-center pt-2">
            <img 
              src="/Imagens/Logo_png.png" 
              alt="EvaluaOS Logo" 
              className="h-44 sm:h-56 md:h-64 w-auto object-contain hover:scale-105 transition-transform duration-300 drop-shadow-sm" 
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-full tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Padrão ISAK & Metrologia Científica
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 max-w-4xl mx-auto leading-[1.15] tracking-tight">
            Eleve seus Laudos Antropométricos ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Nível Científico</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Abandone escolhas cegas de equações. O EvaluaOS utiliza uma <strong>Engine de Recomendação Científica</strong> que cruza o Fracionamento de 4 Componentes (Kerr), o Somatotipo e Tabelas de Referência para recomendar a equação perfeita para o seu paciente.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-105 transition-all"
            >
              Experimentar Grátis Agora 🚀
            </button>
            <button
              onClick={() => navigate('/aprendizado')}
              className="w-full sm:w-auto px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all"
            >
              Conhecer a Base Acadêmica
            </button>
          </div>

          {/* Badges de Destaques */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-slate-100">
            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
              <span className="block text-lg font-black text-emerald-600">Engine Científica</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Recomendação Guiada</span>
            </div>
            
            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
              <span className="block text-lg font-black text-emerald-600">+60 Equações</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Homens & Mulheres</span>
            </div>

            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
              <span className="block text-lg font-black text-emerald-600">4 Componentes kg</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Kerr / Lee / Rocha</span>
            </div>

            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
              <span className="block text-lg font-black text-emerald-600">ARGOREF & ISAK</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Tabelas de Referência</span>
            </div>
          </div>

        </div>
      </section>

      {/* 🎬 2.5 NOVO: SEÇÃO DE VÍDEO DE APRESENTAÇÃO */}
      <section className="pb-16 bg-white relative z-10 border-b border-slate-100">
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

      {/* 📱 3. DEMONSTRAÇÃO INTERATIVA DO LAUDO E EVOLUÇÃO EM TEMPO REAL */}
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

      {/* 🧬 4. POR QUE O EVALUAOS É DIFERENTE? */}
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

      {/* 📚 5. CENTRAL DE APRENDIZADO ABERTA */}
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

      {/* 💰 6. SEÇÃO DE PREÇOS NA HOME */}
      <section id="precos" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Acesso Transparente</span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">Escolha o seu Plano</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Comece no plano gratuito para testar o sistema ou assine a versão Pro para atendimento ilimitado e marca própria.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Plano Gratuito */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-lg">Degustação</span>
              <h3 className="text-xl font-black text-slate-900">Plano Gratuito</h3>
              <div className="text-3xl font-black text-slate-900">R$ 0 <span className="text-xs text-slate-400 font-normal">/ para sempre</span></div>
              
              <ul className="space-y-2.5 text-xs text-slate-600 pt-2">
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> <strong>Até 7 Pacientes grátis</strong></li>
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> <strong>Até 3 Avaliações por paciente</strong></li>
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Engine de Recomendação de Equações</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Fracionamento 4 Componentes (Kerr)</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Índices IAM, IMO, apVAT e Morrow</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Tabelas de Referência ARGOREF & ISAK</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Vídeo de Orientações no Laudo</li>
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
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> <strong>Personalização com sua Logomarca Própria</strong></li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Configuração dos Cálculos visíveis no WhatsApp/Web</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Backup de Dados Automático na Nuvem</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Suporte Técnico Prioritário</li>
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

      {/* 🧲 7. BANNER FINAL DE CTA */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black">
            Pronto para transformar o nível das suas avaliações físicas?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Junte-se a nutricionistas e avaliadores que trabalham com precisão científica e valorizam a metrologia antropométrica.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-white hover:bg-emerald-50 text-emerald-900 font-black text-xs uppercase tracking-wider rounded-2xl shadow-2xl transition-all hover:scale-105"
          >
            Cadastrar-se Gratuitamente ➔
          </button>
        </div>
      </section>

      {/* 📞 8. RODAPÉ INSTITUCIONAL */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="space-y-1 text-center md:text-left">
            <span className="font-bold text-white text-sm">EvaluaOS</span>
            <p className="text-slate-500">Desenvolvido com rigor científico para nutricionistas e antropometristas.</p>
          </div>

          <div className="flex items-center gap-6 text-slate-300 font-semibold">
            <a href="mailto:contato@nutricaocommarco.com.br" className="hover:text-emerald-400 transition-colors">
              ✉️ contato@nutricaocommarco.com.br
            </a>
            <a href="https://www.instagram.com/nutricao_com_marco/" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">
              📸 Instagram
            </a>
          </div>

        </div>
      </footer>

    </div>
  )
}