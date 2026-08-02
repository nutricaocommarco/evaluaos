import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Contato() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [assunto, setAssunto] = useState('duvida')
  const [mensagem, setMensagem] = useState('')
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Lógica de envio da mensagem (ex: API de e-mail / Supabase)
    setEnviado(true)
  }

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
            <Link to="/precos" className="hover:text-emerald-600 transition-colors">💰 Preços</Link>
            <Link to="/contato" className="text-emerald-600 font-extrabold">📞 Contato</Link>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all ml-1"
            >
              🔐 Entrar
            </button>
          </nav>
        </div>
      </header>

      {/* 🚀 2. HERO DA TELA DE CONTATO */}
      <section className="pt-12 pb-12 md:pt-16 md:pb-16 bg-gradient-to-b from-emerald-50/60 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold rounded-full uppercase tracking-wider">
            💬 Atendimento Humano & Especializado
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Como podemos <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">ajudar você?</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Dúvidas sobre o sistema, sugestões de novos protocolos ou parcerias acadêmicas? Nossa equipe está pronta para te responder.
          </p>
        </div>
      </section>

      {/* 📞 3. GRID PRINCIPAL: CANAIS RÁPIDOS + FORMULÁRIO */}
      <section className="pb-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LADO ESQUERDO: Cards de Contato Direto (5 colunas) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Card WhatsApp (Principal Conversão) */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
              <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-extrabold uppercase rounded-full tracking-wider">
                Resposta Mais Rápida
              </span>
              <h3 className="text-xl font-black">Suporte via WhatsApp</h3>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Fale diretamente com nossa equipe técnica de atendimento para tirar dúvidas em tempo real durante seus atendimentos.
              </p>
              <a
                href="https://wa.me/5521997704300?text=Ol%C3%A1!%20Gostaria%20de%20tirar%20uma%20d%C3%BAvida%20sobre%20o%20EvaluaOS."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all hover:scale-[1.02]"
              >
                <span>💬 Abrir Conversa no WhatsApp</span>
              </a>
            </div>

            {/* Card E-mail Institucional */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-lg font-bold">
                ✉️
              </div>
              <h4 className="font-bold text-slate-900 text-sm">E-mail Direto</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Para assuntos administrativos, faturamento e solicitações formais.
              </p>
              <a 
                href="mailto:contato@nutricaocommarco.com.br" 
                className="text-xs font-bold text-emerald-600 hover:underline block pt-1"
              >
                contato@nutricaocommarco.com.br
              </a>
            </div>

            {/* Card Parcerias e Ligas Acadêmicas */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 bg-slate-800 text-amber-400 rounded-xl flex items-center justify-center text-lg font-bold">
                🎓
              </div>
              <h4 className="font-bold text-white text-sm">Universidades e Ligas Acadêmicas</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                É professor, coordenador de laboratório ou membro de liga acadêmica? Oferecemos condições especiais para pesquisas e aulas de antropometria.
              </p>
            </div>

          </div>

          {/* LADO DIREITO: Formulário de Contato (7 colunas) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 p-6 sm:p-10 rounded-3xl shadow-xl space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-900">Envie uma Mensagem</h3>
              <p className="text-xs text-slate-500 mt-1">Preencha os campos abaixo e responderemos em até 24 horas úteis.</p>
            </div>

            {enviado ? (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-3">
                <span className="text-3xl">🚀</span>
                <h4 className="font-bold text-emerald-900 text-sm">Mensagem Enviada com Sucesso!</h4>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  Obrigado pelo contato. Nossa equipe entrará em contato pelo e-mail informado o mais breve possível.
                </p>
                <button
                  onClick={() => { setEnviado(false); setMensagem(''); }}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-all pt-2"
                >
                  Enviar Outra Mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Seu Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Dra. Mariana Silva"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail para Resposta</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assunto Principal</label>
                  <select
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-medium text-slate-700"
                  >
                    <option value="duvida">Dúvidas sobre os Planos ou Sistema</option>
                    <option value="suporte">Suporte Técnico / Dúvida em Laudo</option>
                    <option value="parceria">Parcerias Acadêmicas / Ligas / Cursos</option>
                    <option value="sugestao">Sugestão de Novo Protocolo ou Funcionalidade</option>
                    <option value="outro">Outro Assunto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sua Mensagem</label>
                  <textarea
                    required
                    rows="5"
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Descreva sua dúvida ou solicitação com detalhes..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01]"
                >
                  Enviar Mensagem ➔
                </button>
              </form>
            )}

          </div>

        </div>
      </section>

      {/* 📞 4. RODAPÉ INSTITUCIONAL */}
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