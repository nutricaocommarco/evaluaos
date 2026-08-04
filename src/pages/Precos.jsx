import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'

export default function Precos() {
  const navigate = useNavigate()
  const [planoAnual, setPlanoAnual] = useState(true)

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* 🟢 1. HEADER / NAVBAR FIXA GLOBAL */}
      <PublicHeader />

      {/* 🚀 2. HERO DA TELA DE PREÇOS */}
      <section className="pt-12 pb-12 md:pt-16 md:pb-16 bg-gradient-to-b from-emerald-50/60 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold rounded-full uppercase tracking-wider">
            ⚡ Planos Flexíveis e Sem Pegadinhas
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Invista na sua rotina clínica com o <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">melhor custo-benefício</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Comece no plano gratuito com todas as ferramentas de avaliação liberais ou assine a versão Pro para pacientes ilimitados e laudos com a sua marca.
          </p>

          {/* TOGGLE MENSAL / ANUAL */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs font-bold ${!planoAnual ? 'text-slate-900' : 'text-slate-400'}`}>
              Cobrança Mensal
            </span>
            <button
              onClick={() => setPlanoAnual(!planoAnual)}
              className="w-14 h-8 bg-slate-900 rounded-full p-1 transition-colors relative focus:outline-none"
            >
              <div 
                className={`w-6 h-6 bg-emerald-500 rounded-full transition-transform ${planoAnual ? 'translate-x-6' : 'translate-x-0'}`} 
              />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1.5 ${planoAnual ? 'text-slate-900' : 'text-slate-400'}`}>
              Cobrança Anual
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                Economize 30%
              </span>
            </span>
          </div>

        </div>
      </section>

      {/* 💰 3. CARDS DE PLANOS */}
      <section className="pb-16 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Plano Gratuito */}
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-lg">
                Para Começar
              </span>
              <h2 className="text-2xl font-black text-slate-900">Plano Gratuito</h2>
              <p className="text-xs text-slate-500">Ferramentas completas de avaliação física sem pagar nada por isso.</p>
              
              <div className="pt-2">
                <div className="text-4xl font-black text-slate-900">R$ 0</div>
                <span className="text-xs text-slate-400 font-medium">Para sempre • Sem cartão de crédito</span>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
                <p className="font-bold text-slate-800">Recursos incluídos:</p>
                <p className="flex items-center gap-2"><span className="text-emerald-600 font-black">✓</span> <strong>Até 7 Pacientes cadastrados</strong></p>
                <p className="flex items-center gap-2"><span className="text-emerald-600 font-black">✓</span> <strong>Até 3 Avaliações por paciente</strong></p>
                <p className="flex items-center gap-2"><span className="text-emerald-600 font-black">✓</span> <strong>Engine de Recomendação Científica de Equações</strong></p>
                <p className="flex items-center gap-2"><span className="text-emerald-600 font-black">✓</span> Fracionamento Anatômico (4 Componentes: Kerr, Lee, Rocha, Würch)</p>
                <p className="flex items-center gap-2"><span className="text-emerald-600 font-black">✓</span> Fracionamento Molecular (2 Componentes)</p>
                <p className="flex items-center gap-2"><span className="text-emerald-600 font-black">✓</span> Índices de Saúde: IAM, IMO, apVAT e Morrow (2003)</p>
                <p className="flex items-center gap-2"><span className="text-emerald-600 font-black">✓</span> Tabelas de Referência ARGOREF & ISAK (Campa et al.)</p>
                <p className="flex items-center gap-2"><span className="text-emerald-600 font-black">✓</span> Habilitar ou Desabilitar Medidas nas avaliações</p>
                <p className="flex items-center gap-2"><span className="text-emerald-600 font-black">✓</span> Incorporação de Vídeo de Orientações no Laudo</p>
                <p className="flex items-center gap-2"><span className="text-emerald-600 font-black">✓</span> Laboratório de Equações (+60 equações)</p>
                <p className="flex items-center gap-2"><span className="text-emerald-600 font-black">✓</span> Geração de Laudos em PDF e Web</p>
                <p className="flex items-center gap-2"><span className="text-emerald-600 font-black">✓</span> Acesso livre à Central de Aprendizado</p>
                <p className="flex items-center gap-2 text-slate-400"><span className="text-slate-300 font-black">✕</span> Personalização do Laudo com sua Logomarca</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all"
            >
              Criar Conta Grátis
            </button>
          </div>

          {/* Plano Pro */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white p-8 rounded-3xl shadow-2xl space-y-6 flex flex-col justify-between relative border-2 border-emerald-500/50">
            <div className="absolute -top-3.5 right-6 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-black uppercase rounded-full tracking-wider shadow-lg">
              Recomendado
            </div>

            <div className="space-y-4">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-lg border border-emerald-500/30">
                Profissional Ilimitado
              </span>
              <h2 className="text-2xl font-black text-white">EvaluaOS Pro</h2>
              <p className="text-xs text-slate-300">Para profissionais que atendem em escala, necessitam de laudos com marca própria e backup automático.</p>
              
              <div className="pt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">
                    R$ {planoAnual ? '20,75' : '29,90'}
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">/ mês</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {planoAnual ? 'Cobrado anualmente (R$ 249,00/ano)' : 'Faturamento mensal recorrente'}
                </span>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-2.5 text-xs text-slate-200">
                <p className="font-bold text-emerald-400">Tudo do Plano Gratuito +</p>
                <p className="flex items-center gap-2"><span className="text-emerald-400 font-black">✓</span> <strong>Pacientes Ilimitados</strong></p>
                <p className="flex items-center gap-2"><span className="text-emerald-400 font-black">✓</span> <strong>Avaliações Ilimitadas por Paciente</strong></p>
                <p className="flex items-center gap-2"><span className="text-emerald-400 font-black">✓</span> <strong>Personalização do Laudo com a sua Logomarca</strong></p>
                <p className="flex items-center gap-2"><span className="text-emerald-400 font-black">✓</span> <strong>Escolha de cálculos visíveis no WhatsApp/Web</strong></p>
                <p className="flex items-center gap-2"><span className="text-emerald-400 font-black">✓</span> <strong>Backup de Dados Automático na Nuvem</strong></p>
                <p className="flex items-center gap-2"><span className="text-emerald-400 font-black">✓</span> <strong>Suporte Técnico Prioritário</strong></p>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              Assinar Plano Pro 🚀
            </button>
          </div>

        </div>
      </section>

      {/* 📊 4. TABELA MATRIZ COMPARATIVA DETALHADA */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Comparativo Detalhado</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Compare os Recursos Lado a Lado</h2>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                
                <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-4 px-6 w-1/2">Recursos & Metrologia</th>
                    <th className="py-4 px-4 text-center w-1/4 bg-slate-800">Plano Gratuito</th>
                    <th className="py-4 px-4 text-center w-1/4 bg-emerald-600 text-white">EvaluaOS Pro</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-700">
                  
                  {/* Bloco 1: Capacidade */}
                  <tr className="bg-slate-50 font-bold text-slate-900 text-[11px]">
                    <td colSpan="3" className="py-2.5 px-6 uppercase tracking-wider text-emerald-700">
                      📂 Gestão & Capacidade
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Limite de Pacientes Cadastrados</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">7 Pacientes</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">Ilimitado</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Avaliações por Paciente</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">Até 3 Avaliações</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">Ilimitado</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Backup de Dados Automático</td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-bold">✕</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Automático</td>
                  </tr>

                  {/* Bloco 2: Equações e Ferramentas Especialistas */}
                  <tr className="bg-slate-50 font-bold text-slate-900 text-[11px]">
                    <td colSpan="3" className="py-2.5 px-6 uppercase tracking-wider text-emerald-700">
                      🧬 Algoritmos & Avaliação Antropométrica
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Laboratório de Equações (+60 equações para Homens e Mulheres)</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ Completo</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Completo</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Engine de Recomendação Científica de Equações (Sistema Especialista)</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ Incluído</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Incluído</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Fracionamento Anatômico em 4 Componentes em kg (Kerr, Lee, Rocha, Würch)</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ Incluído</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Incluído</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Fracionamento Molecular em 2 Componentes (%GC e MLG)</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ Incluído</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Incluído</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Índice Adiposo Muscular (IAM) e Índice Músculo Ósseo (IMO)</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ Incluído</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Incluído</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Área de Gordura Visceral Estimada (apVAT) & Morrow (2003)</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ Incluído</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Incluído</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Identificação ARGOREF & Tabelas de Referência ISAK (Campa et al., 2025)</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ Incluído</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Incluído</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Somatório de Dobras Cutâneas (∑6D e ∑8D em mm)</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ Incluído</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Incluído</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Somatotipo Completo de Heath-Carter (Endo, Meso, Ecto)</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ Incluído</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Incluído</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Habilitar ou Desabilitar Medidas nas Avaliações</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ Habilitado</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Habilitado</td>
                  </tr>

                  {/* Bloco 3: Laudos e Mídia */}
                  <tr className="bg-slate-50 font-bold text-slate-900 text-[11px]">
                    <td colSpan="3" className="py-2.5 px-6 uppercase tracking-wider text-emerald-700">
                      📄 Laudos & Mídia
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Geração de Laudos em PDF e Link Interativo Web</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ Sim</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Sim</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Incorporação de Vídeo Individual do Paciente ou Consultório</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ Habilitado</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Habilitado</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">
                      Personalização do Laudo com Logomarca Própria
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-bold">✕</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Exclusivo Pro</td>
                  </tr>

                  {/* Bloco 4: Suporte */}
                  <tr className="bg-slate-50 font-bold text-slate-900 text-[11px]">
                    <td colSpan="3" className="py-2.5 px-6 uppercase tracking-wider text-emerald-700">
                      📞 Suporte & Conhecimento
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Central de Aprendizado e Artigos Científicos</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ Liberado</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Liberado</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold">Suporte Técnico</td>
                    <td className="py-3.5 px-4 text-center text-slate-500">Limitado</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">✓ Prioritário</td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* 📞 5. RODAPÉ INSTITUCIONAL */}
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
