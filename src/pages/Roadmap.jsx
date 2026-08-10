import React from 'react'
import { Utensils, Construction, Layers } from 'lucide-react'

const SECOES = [
  {
    titulo: 'Prescrição & Nutrição',
    icone: Utensils,
    cor: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400',
    itens: [
      {
        titulo: 'Exportação em PDF do Plano Alimentar',
        texto: 'O builder já está pronto — falta gerar o PDF pro paciente, no mesmo padrão do Laudo/Evolução.',
      },
      {
        titulo: 'Grupos de Alimentos',
        texto: 'Listas reutilizáveis ("Carboidratos", "Proteínas", "Frutas"...) que o paciente escolhe dentro da opção, em vez de um alimento fixo.',
      },
      {
        titulo: 'Comparação com DRI / micronutrientes',
        texto: 'Comparar o plano contra referências de vitaminas e minerais, não só macro.',
      },
      {
        titulo: 'Plano tipo "Qualitativo"',
        texto: 'Modo alternativo de prescrição em texto livre, sem cálculo de macros.',
      },
      {
        titulo: 'Enriquecimento com dados da TBCA',
        texto: 'Açúcares/amido/fibra detalhados — depende de licenciamento comercial com a USP/FoRC ou de uma chave de correspondência confiável com a TACO.',
      },
      {
        titulo: 'Mais suplementos',
        texto: 'Hoje só 17 itens cadastrados (Growth, Integralmédica, Dr Peanut, YoPRO, genéricos) — cobertura pode crescer bastante.',
      },
    ],
  },
  {
    titulo: 'Em Construção',
    icone: Construction,
    cor: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
    itens: [
      { titulo: 'Exames Laboratoriais' },
      { titulo: 'Exames de Bioimpedância' },
      { titulo: 'Acompanhamento Gestacional' },
      { titulo: 'Acompanhamento Infantil' },
      { titulo: 'Fotos Comparativas' },
      { titulo: 'Receitas' },
      { titulo: 'Materiais de Apoio' },
      { titulo: 'Fórmulas Manipuladas' },
      { titulo: 'Diário Alimentício', texto: 'Paciente registra o que comeu de fato, pra comparar com o Plano Alimentar prescrito.' },
      { titulo: 'Pasta do Paciente' },
      { titulo: 'Configurações do Paciente' },
    ],
  },
  {
    titulo: 'Menus & Plano Beta',
    icone: Layers,
    cor: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400',
    itens: [
      {
        titulo: 'Fluxo de upgrade/compra pro plano Beta',
        texto: 'Hoje é liberado manualmente via SQL — ainda não existe um checkout nem um botão "vire Beta" dentro do app.',
      },
      {
        titulo: 'Guarda de rota pra páginas Beta',
        texto: 'Esconder do menu não impede acesso direto por URL. Não é risco de segurança (RLS isola por avaliador), só uma tela que "não deveria" aparecer pra quem não é Beta.',
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
          Catálogo do que já discutimos e ainda não construímos — não é uma lista priorizada, é só pra não perder o fio.
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
        Isso aqui é só um catálogo — prioridade continua sendo conversa, não algo decidido sozinho.
      </p>
    </div>
  )
}
