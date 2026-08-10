import React from 'react'
import { Utensils, Sparkles, Layers } from 'lucide-react'

const SECOES = [
  {
    titulo: 'Prescrição & Nutrição',
    icone: Utensils,
    cor: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400',
    itens: [
      {
        titulo: 'Grupos de Alimentos',
        texto: 'Listas reutilizáveis (como "Carboidratos", "Proteínas", "Frutas") pra montar planos mais rápido, deixando o paciente escolher entre as opções do grupo.',
      },
      {
        titulo: 'Comparação com micronutrientes',
        texto: 'Compare o plano também com referências de vitaminas e minerais, além dos macronutrientes.',
      },
      {
        titulo: 'Plano tipo "Qualitativo"',
        texto: 'Um modo alternativo de prescrição em texto livre, pra quando você não precisa calcular macros.',
      },
      {
        titulo: 'Mais detalhamento nutricional',
        texto: 'Informações mais completas de açúcares, amido e fibra nos alimentos cadastrados.',
      },
      {
        titulo: 'Mais marcas de suplementos',
        texto: 'Ampliação da base de suplementos cadastrados, cobrindo mais marcas do mercado.',
      },
    ],
  },
  {
    titulo: 'Próximos Recursos',
    icone: Sparkles,
    cor: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
    itens: [
      { titulo: 'Exames Laboratoriais', texto: 'Registre e acompanhe os exames laboratoriais do paciente direto no prontuário.' },
      { titulo: 'Exames de Bioimpedância', texto: 'Importe e compare resultados de bioimpedância ao longo do tempo.' },
      { titulo: 'Acompanhamento Gestacional', texto: 'Telas e cálculos pensados especificamente pra avaliação de gestantes.' },
      { titulo: 'Acompanhamento Infantil', texto: 'Curvas de crescimento e avaliação específica pra crianças.' },
      { titulo: 'Fotos Comparativas', texto: 'Compare fotos do paciente ao longo do tempo, lado a lado.' },
      { titulo: 'Receitas', texto: 'Cadastre e vincule receitas culinárias aos planos alimentares.' },
      { titulo: 'Materiais de Apoio', texto: 'Compartilhe PDFs, vídeos e outros materiais direto com seus pacientes.' },
      { titulo: 'Fórmulas Manipuladas', texto: 'Prescreva fórmulas manipuladas dentro do plano do paciente.' },
      { titulo: 'Diário Alimentício', texto: 'O paciente registra o que realmente comeu, pra comparar com o que foi prescrito.' },
      { titulo: 'Pasta do Paciente', texto: 'Um espaço só pra guardar documentos e arquivos de cada paciente.' },
      { titulo: 'Configurações do Paciente', texto: 'Mais controle sobre preferências e notificações por paciente.' },
    ],
  },
  {
    titulo: 'Plano Beta',
    icone: Layers,
    cor: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400',
    itens: [
      {
        titulo: 'Assinatura do Beta pelo app',
        texto: 'Em breve você vai poder assinar o plano Beta direto por aqui, sem precisar falar com a gente.',
      },
    ],
  },
]

export default function Roadmap() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <span>Roadmap</span>
          <span className="text-xl">🗺️</span>
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Estas são as próximas novidades que estamos preparando pra você. A ordem de exibição não indica prioridade nem data de lançamento.
        </p>
      </div>

      {SECOES.map((secao) => {
        const Icone = secao.icone
        return (
          <div key={secao.titulo} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-slate-800">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${secao.cor}`}>
                <Icone size={18} />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-slate-100">{secao.titulo}</h3>
            </div>

            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
              {secao.itens.map((item) => (
                <li key={item.titulo} className="p-4">
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{item.titulo}</p>
                  {item.texto && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{item.texto}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      })}

      <p className="text-[11px] text-gray-400 dark:text-slate-500 text-center pt-2">
        Tem uma sugestão ou uma funcionalidade que faria diferença no seu dia a dia? Fale com a gente.
      </p>
    </div>
  )
}
