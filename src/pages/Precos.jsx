import React from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Precos() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* 🟢 1. HEADER / NAVBAR FIXA */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/Imagens/Logo_png.png" alt="EvaluaOS Logo" className="h-10 w-auto object-contain" />
            <div className="hidden sm:flex flex-col">
              <span className="text-base font-black text-slate-900 tracking-tight leading-none">
                Evalua<span className="text-emerald-600">OS</span>
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Antropometria de Precisão
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-8 text-xs font-bold text-slate-600">
            <Link to="/" className="hover:text-emerald-600 transition-colors">🏠 Início</Link>
            <Link to="/aprendizado" className="hover:text-emerald-600 transition-colors">📚 Aprendizado</Link>
            <Link to="/precos" className="text-emerald-600 font-extrabold">💰 Preços</Link>
            <Link to="/contato" className="hover:text-emerald-600 transition-colors">📞 Contato</Link>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all ml-1"
            >
              🔐 Entrar
            </button>
          </nav>
        </div>
      </header>

      {/* 🚀 2. HERO DA TELA DE PREÇOS (Foco em Valor & Retorno) */}
      <section className="pt-12 pb-16 md:pt-16 md:pb-20 bg-gradient-to-b from-emerald-50/60 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold rounded-full uppercase tracking-wider">
            ⚡ Retorno no 1º Atendimento
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Um investimento que se paga com <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">uma única avaliação</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Quanto vale economizar tempo em cada laudo, passar 100% de segurança no diagnóstico e entregar um comparativo de evolução que fideliza seu paciente?
          </p>

        </div>
      </section>

      {/* 💰 3. CARDS DE PLANOS (Destaque Pro) */}
      <section className="pb-16 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Plano Gratuito / Degustação */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-lg">
                Para Testar ou Estudar
              </span>
              <h2 className="text-2xl font-black text-slate-900">Plano Gratuito</h2>
              <p className="text-xs text-slate-500">Perfeito para estudantes de graduação e para conhecer a plataforma sem compromisso.</p>
              
              <div className="pt-2">
                <div className="text-4xl font-black text-slate-900">R$ 0</div>
                <span className="text-xs text-slate-400 font-medium">Sem necessidade de cartão de crédito</span>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
                <p className="font-bold text-slate-800">O que você recebe:</p>
                <p className="flex items-center gap-2"><span className="text-emerald-600 font-black">✓</span> Acesso livre a toda a Central de Aprendizado</p>
                <p className="flex items-center gap-2"><span className="text-emerald-600 font-black">✓</span> Cadastro de até 3 pacientes teste</p>
                <p className="flex items-center gap-2"><span className="text-emerald-600 font-black">✓</span> Equações preditivas básicas de % de gordura</p>
                <p className="flex items-center gap-2 text-slate-400"><span className="text-slate-300 font-black">✕</span> Sem laudos personalizados em PDF</p>
                <p className="flex items-center gap-2 text-slate-400"><span className="text-slate-300 font-black">✕</span> Sem Baremos ARGOREF e Fracionamento 5 Massas</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all"
            >
              Começar Teste Grátis
            </button>
          </div>

          {/* Plano Pro */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white p-8 rounded-3xl shadow-2xl space-y-6 flex flex-col justify-between relative border-2 border-emerald-500/50">
            <div className="absolute -top-3.5 right-6 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-black uppercase rounded-full tracking-wider shadow-lg">
              Melhor Custo-Benefício
            </div>

            <div className="space-y-4">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-lg border border-emerald-500/30">
                Uso Profissional Ilimitado
              </span>
              <h2 className="text-2xl font-black text-white">EvaluaOS Pro</h2>
              <p className="text-xs text-slate-300">Para nutricionistas e antropometristas que exigem rigor metrológico e agilidade.</p>
              
              <div className="pt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">R$ 49,90</span>
                  <span className="text-xs text-emerald-400 font-bold">/ mês</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  💡 Menos de R$ 1,70 por dia. Menos do que um cafézinho!
                </span>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-2.5 text-xs text-slate-200">
                <p className="font-bold text-emerald-400">Tudo do Plano Gratuito +</p>
                <p className="flex items-center gap-2"><span className="text-emerald-400 font-black">✓</span> <strong>Pacientes e Avaliações Ilimitadas</strong></p>
                <p className="flex items-center gap-2"><span className="text-emerald-400 font-black">✓</span> Cálculo Automático do Erro Técnico (ETM)</p>
                <p className="flex items-center gap-2"><span className="text-emerald-400 font-black">✓</span> Fracionamento Anatomicamente Validado (5 Massas Kerr)</p>
                <p className="flex items-center gap-2"><span className="text-emerald-400 font-black">✓</span> Comparação Normativa com Tabelas ARGOREF</p>
                <p className="flex items-center gap-2"><span className="text-emerald-400 font-black">✓</span> Laudos Estilizados em PDF com sua Logomarca</p>
                <p className="flex items-center gap-2"><span className="text-emerald-400 font-black">✓</span> Link Direto de Evolução Interativa para o Paciente</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              Assinar Plano Pro e Elevar Meus Laudos 🚀
            </button>
          </div>

        </div>
      </section>

      {/* 📊 4. TABELA MATRIZ COMPARATIVA DETALHADA (Gratuito vs Pro) */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Comparativo Detalhado</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Compare os Recursos Lado a Lado</h2>
            <p className="text-xs text-slate-500">Veja exatamente o que cada plano oferece para o seu dia a dia clínico.</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                
                {/* Cabecalho da Tabela */}
                <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-4 px-6 w-1/2">Recursos & Metrologia</th>
                    <th className="py-4 px-4 text-center w-1/4 bg-slate-800">Plano Gratuito</th>
                    <th className="py-4 px-4 text-center w-1/4 bg-emerald-600 text-white">EvaluaOS Pro</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-700">
                  
                  {/* Bloco 1: Gestão de Atendimentos */}
                  <tr className="bg-slate-50 font-bold text-slate-900 text-[11px]">
                    <td colSpan="3" className="py-2.5 px-6 uppercase tracking-wider text-emerald-700">
                      📂 Gestão & Capacidade
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Limite de Pacientes Cadastrados</td>
                    <td className="py-3.5 px-4 text-center text-slate-500">Até 7 Pacientes</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">Ilimitado</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Histórico de Reavaliações por Paciente</td>
                    <td className="py-3.5 px-4 text-center text-slate-500">Até 3 Avaliações</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">Ilimitado</td>
                  </tr>

                  {/* Bloco 2: Algoritmos e Ciência */}
                  <tr className="bg-slate-50 font-bold text-slate-900 text-[11px]">
                    <td colSpan="3" className="py-2.5 px-6 uppercase tracking-wider text-emerald-700">
                      🧬 Algoritmos & Metrologia Antropométrica
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Cálculo de Somatório de Dobras Cutâneas (∑SF em mm)</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Equações Bicompartimentais Básicas (Siri, Brožek, Durnin)</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">
                      <strong>Erro Técnico de Medição (ETM) Intra-avaliador</strong>
                      <span className="block text-[10px] text-slate-400 font-normal">Controle metrológico de precisão de pinçamento (Perini, 2005)</span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-bold">✕</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Automático</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">
                      <strong>Fracionamento em 5 Massas em kg (Kerr, 1988)</strong>
                      <span className="block text-[10px] text-slate-400 font-normal">Adiposa, Muscular, Residual, Óssea e Piel</span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-bold">✕</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Completo</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">
                      <strong>Classificação em Baremos Normativos ARGOREF</strong>
                      <span className="block text-[10px] text-slate-400 font-normal">Comparativo por Percentis da população latino-americana (Holway, 2005)</span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-bold">✕</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Completo</td>
                  </tr>

                  {/* Bloco 3: Laudos e Entrega ao Paciente */}
                  <tr className="bg-slate-50 font-bold text-slate-900 text-[11px]">
                    <td colSpan="3" className="py-2.5 px-6 uppercase tracking-wider text-emerald-700">
                      📄 Laudos & Experiência do Paciente
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Geração de Laudos Estilizados em PDF</td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-bold">✕</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Ilimitado</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Personalização do PDF com sua Logomarca Profissional</td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-bold">✕</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Incluído</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Link Direto de Evolução Online para Enviar no WhatsApp do Paciente</td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-bold">✓ Incluído</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Incluído</td>
                  </tr>

                  {/* Bloco 4: Conhecimento e Suporte */}
                  <tr className="bg-slate-50 font-bold text-slate-900 text-[11px]">
                    <td colSpan="3" className="py-2.5 px-6 uppercase tracking-wider text-emerald-700">
                      🎓 Conhecimento & Suporte
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Acesso Aberto à Central de Aprendizado e Artigos Científicos</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ 100% Liberado</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ 100% Liberado</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Suporte Técnico Prioritário</td>
                    <td className="py-3.5 px-4 text-center text-slate-400">Comunidade</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Whatsapp / E-mail</td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* 🧠 5. CÁLCULO DE VALOR PERCEBIDO (Por que vale a pena?) */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-8 sm:p-12 shadow-2xl space-y-8">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">A Conta de Padaria</span>
            <h2 className="text-2xl sm:text-3xl font-black">Faça os cálculos do seu consultório:</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700">
              <span className="block text-2xl font-black text-amber-400 mb-1">20 Minutos</span>
              <p className="text-xs text-slate-300">Economizados na montagem de cada laudo e cálculo manual.</p>
            </div>

            <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700">
              <span className="block text-2xl font-black text-emerald-400 mb-1">R$ 150 a R$ 350</span>
              <p className="text-xs text-slate-300">É o valor médio cobrado por uma consulta nutricional com avaliação.</p>
            </div>

            <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700">
              <span className="block text-2xl font-black text-teal-400 mb-1">1º Paciente</span>
              <p className="text-xs text-slate-300">Já cobre com sobra a mensalidade inteira do EvaluaOS Pro do mês!</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-center text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Se o EvaluaOS te ajudar a fechar <strong>1 reavaliação a mais por mês</strong> pelo nível de profissionalismo do laudo enviado ao WhatsApp do seu paciente, o sistema já se pagou 3 vezes.
          </p>

          <div className="text-center pt-2">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all hover:scale-105"
            >
              Quero Testar o EvaluaOS Pro Agora 🚀
            </button>
          </div>

        </div>
      </section>

      {/* ❓ 6. PERGUNTAS FREQUENTES (FAQ) */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Tire suas Dúvidas</span>
            <h2 className="text-2xl font-black text-slate-900">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-4 text-xs">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">Preciso cadastrar meu cartão para testar o Plano Gratuito?</h3>
              <p className="text-slate-600 leading-relaxed">
                Não! O cadastro no plano gratuito é 100% livre de cartão de crédito. Você cria sua conta em 30 segundos e já pode navegar pelo sistema.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">Existe fidelidade ou taxa de cancelamento no Plano Pro?</h3>
              <p className="text-slate-600 leading-relaxed">
                Nenhuma fidelidade. Você pode assinar o mês que precisar e cancelar a qualquer momento direto pelas configurações da sua conta, sem burocracia ou multas.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">O sistema funciona em celular ou tablet durante o atendimento?</h3>
              <p className="text-slate-600 leading-relaxed">
                Sim! O EvaluaOS foi projetado para ser 100% responsivo. Você pode digitar os dados diretamente do seu tablet ou smartphone enquanto faz a medição das dobras do paciente na sala.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 📞 7. RODAPÉ INSTITUCIONAL */}
      <footer id="contato" className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
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