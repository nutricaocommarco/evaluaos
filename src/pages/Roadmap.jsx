import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Utensils, Sparkles, Layers, Boxes, ThumbsUp, ThumbsDown } from 'lucide-react'
import { supabase } from '../supabaseClient'

const SECOES = [
  {
    titulo: 'Prescrição & Nutrição',
    icone: Utensils,
    cor: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400',
    itens: [
      {
        chave: 'grupos-de-alimentos',
        titulo: 'Grupos de Alimentos',
        texto: 'Listas reutilizáveis (como "Carboidratos", "Proteínas", "Frutas") pra montar planos mais rápido, deixando o paciente escolher entre as opções do grupo.',
      },
      {
        chave: 'comparacao-micronutrientes',
        titulo: 'Comparação com micronutrientes',
        texto: 'Compare o plano também com referências de vitaminas e minerais, além dos macronutrientes.',
      },
      {
        chave: 'plano-qualitativo',
        titulo: 'Plano tipo "Qualitativo"',
        texto: 'Um modo alternativo de prescrição em texto livre, pra quando você não precisa calcular macros.',
      },
      {
        chave: 'mais-produtos-alimentos',
        titulo: 'Mais produtos na lista de Alimentos',
        texto: 'Ampliação contínua da base de alimentos cadastrados, cobrindo mais produtos e marcas do mercado.',
      },
    ],
  },
  {
    titulo: 'Novos Módulos',
    icone: Boxes,
    cor: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400',
    itens: [
      {
        chave: 'modulo-financeiro',
        titulo: 'Financeiro',
        texto: 'Controle financeiro do seu consultório: receitas, despesas e histórico de pagamentos dos pacientes.',
      },
      {
        chave: 'modulo-antropometria-crianca',
        titulo: 'Antropometria para Criança',
        texto: 'Avaliação antropométrica com curvas e referências específicas pro público infantil.',
      },
      {
        chave: 'modulo-acompanhamento-crianca',
        titulo: 'Acompanhamento Nutricional para Criança',
        texto: 'Acompanhamento nutricional contínuo pensado pro público infantil.',
      },
      {
        chave: 'modulo-acompanhamento-gestante',
        titulo: 'Acompanhamento Nutricional para Gestantes',
        texto: 'Acompanhamento nutricional contínuo pensado pra gestantes.',
      },
      {
        chave: 'modulo-questionario',
        titulo: 'Questionário',
        texto: 'Monte questionários personalizados e envie direto pro paciente responder.',
      },
      {
        chave: 'modulo-crm',
        titulo: 'CRM para Nutricionistas',
        texto: 'Um funil visual de atendimento pra organizar cada etapa da jornada do paciente no seu consultório.',
      },
    ],
  },
  {
    titulo: 'Próximos Recursos',
    icone: Sparkles,
    cor: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
    itens: [
      { chave: 'exames-laboratoriais', titulo: 'Exames Laboratoriais', texto: 'Registre e acompanhe os exames laboratoriais do paciente direto no prontuário.' },
      { chave: 'exames-bioimpedancia', titulo: 'Exames de Bioimpedância', texto: 'Importe e compare resultados de bioimpedância ao longo do tempo.' },
      { chave: 'fotos-comparativas', titulo: 'Fotos Comparativas', texto: 'Compare fotos do paciente ao longo do tempo, lado a lado.' },
      { chave: 'receitas', titulo: 'Receitas', texto: 'Cadastre e vincule receitas culinárias aos planos alimentares.' },
      { chave: 'materiais-de-apoio', titulo: 'Materiais de Apoio', texto: 'Compartilhe PDFs, vídeos e outros materiais direto com seus pacientes.' },
      { chave: 'formulas-manipuladas', titulo: 'Fórmulas Manipuladas', texto: 'Prescreva fórmulas manipuladas dentro do plano do paciente.' },
      { chave: 'diario-alimenticio', titulo: 'Diário Alimentício', texto: 'O paciente registra o que realmente comeu, pra comparar com o que foi prescrito.' },
      { chave: 'pasta-do-paciente', titulo: 'Pasta do Paciente', texto: 'Um espaço só pra guardar documentos e arquivos de cada paciente.' },
      { chave: 'config-do-paciente', titulo: 'Configurações do Paciente', texto: 'Mais controle sobre preferências e notificações por paciente.' },
    ],
  },
  {
    titulo: 'Plano Beta',
    icone: Layers,
    cor: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400',
    itens: [
      {
        chave: 'assinatura-beta-app',
        titulo: 'Assinatura do Beta pelo app',
        texto: 'Em breve você vai poder assinar o plano Beta direto por aqui, sem precisar falar com a gente.',
      },
    ],
  },
]

function BotaoVoto({ ativo, onClick, tipo }) {
  const Icone = tipo === 'like' ? ThumbsUp : ThumbsDown
  const corAtivo = tipo === 'like' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'
  return (
    <button
      type="button"
      onClick={onClick}
      title={tipo === 'like' ? 'Prioridade pra mim' : 'Não é prioridade pra mim'}
      className={`p-1.5 rounded-lg transition-colors ${ativo ? corAtivo : 'text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
    >
      <Icone size={15} fill={ativo ? 'currentColor' : 'none'} />
    </button>
  )
}

export default function Roadmap({ userId }) {
  const [votos, setVotos] = useState({}) // { [chave]: { score, meuVoto } }
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    const carregar = async () => {
      const { data } = await supabase.from('roadmap_votos').select('item_chave, id_avaliador, voto')
      const agregados = {}
      ;(data || []).forEach((v) => {
        if (!agregados[v.item_chave]) agregados[v.item_chave] = { score: 0, meuVoto: 0 }
        agregados[v.item_chave].score += v.voto
        if (v.id_avaliador === userId) agregados[v.item_chave].meuVoto = v.voto
      })
      setVotos(agregados)
      setCarregado(true)
    }
    carregar()
  }, [userId])

  const votar = async (chave, voto) => {
    const atual = votos[chave]?.meuVoto || 0
    const novoVoto = atual === voto ? 0 : voto

    // Otimista: atualiza a tela antes da resposta do servidor.
    setVotos((prev) => {
      const anterior = prev[chave] || { score: 0, meuVoto: 0 }
      return { ...prev, [chave]: { score: anterior.score - anterior.meuVoto + novoVoto, meuVoto: novoVoto } }
    })

    if (novoVoto === 0) {
      await supabase.from('roadmap_votos').delete().eq('item_chave', chave).eq('id_avaliador', userId)
    } else {
      await supabase
        .from('roadmap_votos')
        .upsert({ item_chave: chave, id_avaliador: userId, voto: novoVoto, updated_at: new Date().toISOString() }, { onConflict: 'item_chave,id_avaliador' })
    }
  }

  const scoreDe = (chave) => votos[chave]?.score || 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <span>Roadmap</span>
          <span className="text-xl">🗺️</span>
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Estas são as próximas novidades que estamos preparando pra você. Vote com 👍/👎 no que é prioridade — os itens mais votados sobem na lista.
        </p>
      </div>

      {SECOES.map((secao) => {
        const Icone = secao.icone
        const itensOrdenados = carregado
          ? [...secao.itens].sort((a, b) => scoreDe(b.chave) - scoreDe(a.chave))
          : secao.itens

        return (
          <div key={secao.titulo} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-slate-800">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${secao.cor}`}>
                <Icone size={18} />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-slate-100">{secao.titulo}</h3>
            </div>

            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
              {itensOrdenados.map((item) => (
                <li key={item.chave} className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{item.titulo}</p>
                    {item.texto && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{item.texto}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <BotaoVoto tipo="like" ativo={votos[item.chave]?.meuVoto === 1} onClick={() => votar(item.chave, 1)} />
                    <BotaoVoto tipo="dislike" ativo={votos[item.chave]?.meuVoto === -1} onClick={() => votar(item.chave, -1)} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      })}

      <p className="text-[11px] text-gray-400 dark:text-slate-500 text-center pt-2">
        Tem uma sugestão ou uma funcionalidade que faria diferença no seu dia a dia?{' '}
        <Link to="/contato" className="text-primary-600 hover:underline font-semibold">Fale com a gente</Link>.
      </p>
    </div>
  )
}
