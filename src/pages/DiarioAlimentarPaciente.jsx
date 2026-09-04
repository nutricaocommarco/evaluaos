import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useTheme } from '../contexts/ThemeContext'
import CabecalhoPortalPaciente from '../components/CabecalhoPortalPaciente'
import NavegacaoPortalPaciente from '../components/NavegacaoPortalPaciente'
import { ChevronLeft, ChevronRight, Plus, Trash2, Repeat2, CalendarDays, X } from 'lucide-react'
import { aplicarBuscaPorPalavras, ordenarPorRelevancia } from '../utils/buscaAlimentos'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_SEMANA_ABREV = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

// Conversões só pra facilitar o registro (aproximações genéricas, não usam
// a medida caseira própria do alimento como em PlanoAlimentar.jsx — aqui o
// paciente só precisa registrar o que comeu, não precisa de precisão
// clínica). "Unidade" pede o peso em gramas direto porque varia demais de
// alimento pra alimento (banana, ovo, fatia de pão não têm nada em comum).
const UNIDADES = [
  { valor: 'g', label: 'Gramas (g)', fatorG: 1 },
  { valor: 'colher_sopa', label: 'Colher de sopa (~15g)', fatorG: 15 },
  { valor: 'colher_cha', label: 'Colher de chá (~5g)', fatorG: 5 },
  { valor: 'copo_americano', label: 'Copo americano (~200ml)', fatorG: 200 },
  { valor: 'xicara_cha', label: 'Xícara de chá (~240ml)', fatorG: 240 },
  { valor: 'concha', label: 'Concha média (~80g)', fatorG: 80 },
  { valor: 'unidade', label: 'Unidade(s)', fatorG: null },
]

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

function somarDias(dataStr, delta) {
  const d = new Date(dataStr + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function formatarDataExibicao(dataStr) {
  return new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

function diaSemanaAbrev(dataStr) {
  return new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
}

function diasNoMes(ano, mes) {
  return new Date(ano, mes + 1, 0).getDate()
}

function formatarDataISO(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function labelUnidadeCurta(valor) {
  return UNIDADES.find((u) => u.valor === valor)?.label.replace(/\s*\(~.*\)/, '').toLowerCase() || valor
}

// Busca + adiciona um alimento registrado numa refeição/dia. Cada seção de
// refeição tem a sua própria instância (estado de busca independente). É o
// caminho "de trás" — pra quando o paciente comeu algo fora do prescrito e
// fora das substituições já cadastradas (ver quickAdd em SecaoRefeicao).
function AdicionarItem({ onAdicionar }) {
  const dropdownRef = useRef(null)
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [alimentoSelecionado, setAlimentoSelecionado] = useState(null)
  const [unidade, setUnidade] = useState('g')
  const [quantidade, setQuantidade] = useState('')
  const [pesoUnidade, setPesoUnidade] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (busca.trim().length < 2) {
      setResultados([])
      return
    }
    let cancelado = false
    const buscar = async () => {
      const { data } = await aplicarBuscaPorPalavras(
        supabase.from('tabela_alimentos').select('id, nome, medida_caseira_desc, medida_caseira_g, medida_caseira_unidade'),
        'nome',
        busca
      ).order('nome').limit(50)
      if (!cancelado) setResultados(ordenarPorRelevancia(data || [], busca).slice(0, 8))
    }
    const t = setTimeout(buscar, 250)
    return () => { cancelado = true; clearTimeout(t) }
  }, [busca])

  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setMostrarDropdown(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  // A medida caseira cadastrada no próprio alimento (TACO/IBGE ou cadastro
  // do nutricionista) vale especificamente pra UMA unidade — só substitui o
  // fator genérico da lista quando bate com a unidade escolhida (ex: "Pão
  // Francês" tem medida_caseira_unidade='unidade' e medida_caseira_g=50
  // cadastrados). Mesma lógica de fatorParaUnidade em PlanoAlimentar.jsx.
  const fatorParaUnidade = (valorUnidade) => {
    if (alimentoSelecionado?.medida_caseira_unidade === valorUnidade && alimentoSelecionado?.medida_caseira_g) {
      return alimentoSelecionado.medida_caseira_g
    }
    return UNIDADES.find((u) => u.valor === valorUnidade)?.fatorG || null
  }
  const fatorAtual = fatorParaUnidade(unidade)
  const usandoMedidaCadastrada = alimentoSelecionado?.medida_caseira_unidade === unidade && !!alimentoSelecionado?.medida_caseira_g

  const handleAdicionar = async () => {
    if (!alimentoSelecionado) return alert('Busque e selecione um alimento.')
    const qtdNum = Number(quantidade)
    if (!qtdNum || qtdNum <= 0) return alert('Digite uma quantidade válida.')
    let quantidade_g
    if (fatorAtual) {
      quantidade_g = qtdNum * fatorAtual
    } else {
      quantidade_g = Number(pesoUnidade)
      if (!quantidade_g || quantidade_g <= 0) return alert('Digite o peso aproximado em gramas.')
    }

    setSalvando(true)
    await onAdicionar({
      id_alimento: alimentoSelecionado.id,
      quantidade_g,
      unidade_medida: unidade,
      quantidade_medida: qtdNum,
    })
    setSalvando(false)
    setAlimentoSelecionado(null)
    setBusca('')
    setQuantidade('')
    setPesoUnidade('')
    setUnidade('g')
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1 min-w-0" ref={dropdownRef}>
          {alimentoSelecionado ? (
            <div className="flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-sm">
              <span className="font-semibold text-gray-800 dark:text-slate-100 truncate">{alimentoSelecionado.nome}</span>
              <button onClick={() => setAlimentoSelecionado(null)} className="text-xs text-primary-600 hover:underline font-semibold shrink-0">Trocar</button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setMostrarDropdown(true) }}
                onFocus={() => setMostrarDropdown(true)}
                placeholder="Comeu outra coisa? Busque aqui"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              />
              {mostrarDropdown && resultados.length > 0 && (
                <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {resultados.map((a) => (
                    <li
                      key={a.id}
                      onClick={() => {
                        setAlimentoSelecionado(a)
                        setMostrarDropdown(false)
                        // Se o alimento já tem medida caseira cadastrada (ex: "Pão
                        // Francês" ≈ 50g/unidade), pré-seleciona essa unidade em vez
                        // de deixar em "Gramas" — evita o paciente ter que trocar o
                        // seletor manualmente pra ver o peso já calculado sozinho.
                        if (a.medida_caseira_g && UNIDADES.some((u) => u.valor === a.medida_caseira_unidade)) {
                          setUnidade(a.medida_caseira_unidade)
                        }
                      }}
                      className="px-3 py-2 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm font-medium border-b border-gray-100 dark:border-slate-800 last:border-0"
                    >
                      {a.nome}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            min="0"
            step="0.1"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="Qtd"
            className="w-16 px-2 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <select
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            className="min-w-0 flex-1 sm:flex-initial px-2 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
          >
            {UNIDADES.map((u) => <option key={u.valor} value={u.valor}>{u.label}</option>)}
          </select>
          {!fatorAtual && (
            <input
              type="number"
              min="0"
              value={pesoUnidade}
              onChange={(e) => setPesoUnidade(e.target.value)}
              placeholder="Peso (g)"
              className="w-24 px-2 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          )}
          <button
            onClick={handleAdicionar}
            disabled={salvando}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <Plus size={15} /> Adicionar
          </button>
        </div>
      </div>
      {usandoMedidaCadastrada && (
        <p className="text-[11px] text-primary-600 dark:text-primary-400">
          ✓ Usando o peso cadastrado desse alimento: {alimentoSelecionado.medida_caseira_desc ? `${alimentoSelecionado.medida_caseira_desc} ≈ ` : ''}{alimentoSelecionado.medida_caseira_g}g.
        </p>
      )}
    </div>
  )
}

// Um item prescrito na refeição, com atalho "✓ Comi isso" (mesma
// quantidade prescrita, um toque só) e "Troquei" (mostra as substituições
// já aprovadas pelo nutricionista pra esse item, se houver — mesma tabela
// substitutos_item usada em Montar Plano Alimentar).
// "Comi isso" não registra a quantidade prescrita direto — abre uma
// confirmação rápida (pré-preenchida com o prescrito, mas com o mesmo
// seletor de unidades da busca livre — gramas, colheres, unidade etc.)
// porque o paciente pode ter comido o alimento certo em quantidade
// diferente da receitada, numa medida diferente da que está no plano.
function ConfirmarQuantidade({ dados, alimento, onConfirmar, onCancelar }) {
  const unidadeInicial = UNIDADES.some((u) => u.valor === dados.unidade_medida) ? dados.unidade_medida : 'g'
  const [unidade, setUnidade] = useState(unidadeInicial)
  const [valor, setValor] = useState(String(dados.quantidade_medida))

  // "1 unidade" só tem peso conhecido se: (a) o próprio alimento tem
  // medida caseira cadastrada pra essa unidade, ou (b) o generico da lista
  // (colher, xícara etc.) tem um fatorG fixo. Nenhum dos dois existindo,
  // caímos num fallback baseado no que foi prescrito:
  // - se o prescrito já era em "unidade" (ex: "2 Unidade(s) ≈ 260g" de
  //   maçã), o peso de 1 unidade é o próprio prescrito dividido pela
  //   contagem (260/2 = 130g cada).
  // - se o prescrito era em outra unidade (ex: "100g" de Pão com ovo, sem
  //   conversão por unidade nenhuma), "1 unidade" vira sinônimo de "1
  //   porção inteira igual à prescrita" — não dá pra saber o peso de uma
  //   fração/múltiplo sem um valor de referência, então usamos a receita
  //   inteira como essa referência.
  // De um jeito ou de outro, o paciente nunca precisa adivinhar peso na
  // mão, só dizer quantas vezes comeu.
  const fatorParaUnidade = (valorUnidade) => {
    if (alimento?.medida_caseira_unidade === valorUnidade && alimento?.medida_caseira_g) {
      return alimento.medida_caseira_g
    }
    const generico = UNIDADES.find((u) => u.valor === valorUnidade)?.fatorG
    if (generico) return generico
    if (valorUnidade === 'unidade') {
      if (dados.unidade_medida === 'unidade' && dados.quantidade_medida > 0) {
        return dados.quantidade_g / dados.quantidade_medida
      }
      return dados.quantidade_g
    }
    return null
  }
  const fatorAtual = fatorParaUnidade(unidade)
  const usandoMedidaCadastrada = alimento?.medida_caseira_unidade === unidade && !!alimento?.medida_caseira_g
  const usandoPorcaoPrescrita = !usandoMedidaCadastrada && unidade === 'unidade' && fatorAtual > 0
  const porcaoPrescritaEhPorUnidade = usandoPorcaoPrescrita && dados.unidade_medida === 'unidade'

  const confirmar = () => {
    const valorNum = parseFloat(String(valor).replace(',', '.'))
    if (!valorNum || valorNum <= 0) return
    if (!fatorAtual) return
    onConfirmar({
      id_alimento: dados.id_alimento,
      quantidade_g: Math.round(valorNum * fatorAtual * 100) / 100,
      unidade_medida: unidade,
      quantidade_medida: valorNum,
    })
  }

  return (
    <div className="space-y-1.5 bg-white dark:bg-slate-800 border border-primary-300 dark:border-primary-700 rounded-lg p-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <input
          type="number"
          step="any"
          autoFocus
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && confirmar()}
          className="w-16 px-2 py-1 border border-gray-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={unidade}
          onChange={(e) => setUnidade(e.target.value)}
          className="px-2 py-1 border border-gray-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500"
        >
          {UNIDADES.map((u) => <option key={u.valor} value={u.valor}>{u.label}</option>)}
        </select>
        <button onClick={confirmar} className="px-2 py-1 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 whitespace-nowrap">
          Confirmar
        </button>
        <button onClick={onCancelar} className="p-1 text-gray-400 hover:text-gray-600">
          <X size={14} />
        </button>
      </div>
      {usandoMedidaCadastrada && (
        <p className="text-[11px] text-primary-600 dark:text-primary-400">
          ✓ {alimento.medida_caseira_desc ? `${alimento.medida_caseira_desc} ≈ ` : ''}{alimento.medida_caseira_g}g.
        </p>
      )}
      {usandoPorcaoPrescrita && (
        <p className="text-[11px] text-primary-600 dark:text-primary-400">
          ✓ {porcaoPrescritaEhPorUnidade ? `1 unidade ≈ ${Math.round(fatorAtual)}g.` : `1 unidade = a porção prescrita inteira ≈ ${Math.round(fatorAtual)}g.`}
        </p>
      )}
    </div>
  )
}

function ItemPrescrito({ item, onRegistrarRapido }) {
  const [trocaAberta, setTrocaAberta] = useState(false)
  const [confirmando, setConfirmando] = useState(null)
  const nome = item.nome_customizado || item.tabela_alimentos?.nome
  const substitutos = item.substitutos_item || []

  return (
    <div className="bg-primary-50/60 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-lg p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{nome}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">{item.quantidade_g ? `${item.quantidade_g}g` : 'à vontade'}</p>
        </div>
        {!confirmando && (
          <div className="flex items-center gap-1.5 shrink-0">
            {item.quantidade_g && item.id_alimento && (
              <button
                onClick={() => setConfirmando({
                  dados: {
                    id_alimento: item.id_alimento,
                    quantidade_g: item.quantidade_g,
                    unidade_medida: item.unidade_medida || 'g',
                    quantidade_medida: item.quantidade_medida || item.quantidade_g,
                  },
                  alimento: item.tabela_alimentos,
                })}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-400 text-xs font-bold rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors whitespace-nowrap"
              >
                ✓ Comi isso
              </button>
            )}
            {substitutos.length > 0 && (
              <button
                onClick={() => setTrocaAberta((v) => !v)}
                title="Troquei por outra opção"
                className={`p-1.5 rounded-lg transition-colors ${trocaAberta ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30'}`}
              >
                <Repeat2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      {confirmando && (
        <ConfirmarQuantidade
          dados={confirmando.dados}
          alimento={confirmando.alimento}
          onCancelar={() => setConfirmando(null)}
          onConfirmar={(dadosFinais) => { onRegistrarRapido(dadosFinais); setConfirmando(null) }}
        />
      )}

      {trocaAberta && substitutos.length > 0 && (
        <div className="space-y-1 pl-1 border-l-2 border-primary-200 dark:border-primary-800">
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider pl-2">Substituí por:</p>
          {substitutos.map((sub) => (
            <div key={sub.id} className="pl-2 py-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-600 dark:text-slate-300 truncate">
                  {sub.tabela_alimentos?.nome} {sub.quantidade_g ? `— ${sub.quantidade_g}g` : ''}
                </span>
                {sub.quantidade_g && sub.id_alimento && (
                  <button
                    onClick={() => setConfirmando({
                      dados: {
                        id_alimento: sub.id_alimento,
                        quantidade_g: sub.quantidade_g,
                        unidade_medida: sub.unidade_medida || 'g',
                        quantidade_medida: sub.quantidade_medida || sub.quantidade_g,
                      },
                      alimento: sub.tabela_alimentos,
                    })}
                    className="px-2 py-1 bg-white dark:bg-slate-800 border border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-400 text-[11px] font-bold rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 shrink-0"
                  >
                    ✓ Comi
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Uma seção = uma refeição (do plano ou extra, criada pelo próprio
// paciente) com: itens prescritos (atalho de 1 toque), o que já foi
// registrado nessa refeição/dia, e a busca livre pra qualquer outra coisa.
// Refeições extras (editavel=true) têm o nome num campo editável — mesmo
// padrão (input transparente que vira caixa de texto no hover/foco) que
// Montar Plano Alimentar já usa pro nutricionista renomear as próprias.
function SecaoRefeicao({ nome, horario, itensPrescritos, itensRegistrados, carregando, onRegistrarRapido, onAdicionarBusca, onRemover, editavel, onRenomear, observacao, onSalvarObservacao }) {
  const [nomeEdicao, setNomeEdicao] = useState(nome)
  const [obsEdicao, setObsEdicao] = useState(observacao || '')

  useEffect(() => {
    setNomeEdicao(nome)
  }, [nome])

  useEffect(() => {
    setObsEdicao(observacao || '')
  }, [observacao, nome])

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        {editavel ? (
          <input
            type="text"
            value={nomeEdicao}
            onChange={(e) => setNomeEdicao(e.target.value)}
            onBlur={() => {
              const valor = nomeEdicao.trim()
              if (valor && valor !== nome) onRenomear(valor)
              else setNomeEdicao(nome)
            }}
            className="flex-1 min-w-0 -ml-1.5 px-1.5 py-0.5 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 rounded text-sm font-bold bg-transparent focus:border-primary-500 outline-none text-gray-800 dark:text-slate-100"
          />
        ) : (
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100">{nome}</h3>
        )}
        {horario && <span className="text-xs text-gray-400 dark:text-slate-500">{horario.slice(0, 5)}</span>}
      </div>

      {itensPrescritos.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Prescrito pelo seu nutricionista</p>
          {itensPrescritos.map((item) => (
            <ItemPrescrito key={item.id} item={item} onRegistrarRapido={onRegistrarRapido} />
          ))}
        </div>
      )}

      {carregando ? (
        <p className="text-xs text-gray-400 dark:text-slate-500">Carregando...</p>
      ) : itensRegistrados.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Você registrou</p>
          {itensRegistrados.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
              <span className="text-sm text-gray-700 dark:text-slate-300 truncate">
                {item.tabela_alimentos?.nome} — {item.quantidade_medida} {labelUnidadeCurta(item.unidade_medida)}
              </span>
              <button onClick={() => onRemover(item.id)} className="text-gray-400 hover:text-red-600 shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : itensPrescritos.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-slate-500">Nada registrado ainda nessa refeição.</p>
      ) : null}

      <div className="pt-1 border-t border-gray-100 dark:border-slate-800">
        <AdicionarItem onAdicionar={onAdicionarBusca} />
      </div>

      <div>
        <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          Observação (opcional)
        </label>
        <textarea
          value={obsEdicao}
          onChange={(e) => setObsEdicao(e.target.value)}
          onBlur={() => {
            const valor = obsEdicao.trim()
            if (valor !== (observacao || '')) onSalvarObservacao(valor)
          }}
          placeholder="Comeu fora de hora? Trocou sem querer? Conta aqui pro seu nutricionista..."
          rows={2}
          className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-gray-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none resize-none text-gray-700 dark:text-slate-300 placeholder:text-gray-400 dark:placeholder:text-slate-500"
        />
      </div>
    </div>
  )
}

// Calendário de mês pra pular pra qualquer dia — os dias com registro vêm
// com um contorno verde (mesma ideia de "dias preenchidos" de apps como o
// Growth), sem abrir o app inteiro só pra achar um dia específico.
function ModalCalendario({ dataSelecionada, diasComRegistro, onSelecionar, onFechar }) {
  const inicial = new Date(dataSelecionada + 'T12:00:00')
  const [ano, setAno] = useState(inicial.getFullYear())
  const [mes, setMes] = useState(inicial.getMonth())

  const totalDias = diasNoMes(ano, mes)
  const offset = new Date(ano, mes, 1).getDay()
  const celulas = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ]
  while (celulas.length % 7 !== 0) celulas.push(null)

  const mudarMes = (delta) => {
    let novoMes = mes + delta
    let novoAno = ano
    if (novoMes < 0) { novoMes = 11; novoAno -= 1 }
    if (novoMes > 11) { novoMes = 0; novoAno += 1 }
    setMes(novoMes)
    setAno(novoAno)
  }

  const hojeISO = hoje()

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onFechar}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => mudarMes(-1)} className="p-1.5 text-gray-400 hover:text-primary-600">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-gray-800 dark:text-slate-100">{MESES[mes]} {ano}</span>
          <button onClick={() => mudarMes(1)} className="p-1.5 text-gray-400 hover:text-primary-600">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DIAS_SEMANA_ABREV.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {celulas.map((dia, i) => {
            if (dia === null) return <div key={`v-${i}`} />
            const iso = formatarDataISO(ano, mes, dia)
            const futuro = iso > hojeISO
            const selecionado = iso === dataSelecionada
            const temRegistro = diasComRegistro.has(iso)
            return (
              <button
                key={dia}
                disabled={futuro}
                onClick={() => onSelecionar(iso)}
                className={`aspect-square rounded-full text-sm font-bold flex items-center justify-center border-2 transition-colors ${
                  selecionado
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : temRegistro
                    ? 'border-emerald-400 text-gray-700 dark:text-slate-200 hover:border-emerald-500'
                    : 'border-transparent text-gray-700 dark:text-slate-200 hover:border-gray-200 dark:hover:border-slate-700'
                } ${futuro ? 'opacity-30' : ''}`}
              >
                {dia}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function DiarioAlimentarPaciente() {
  const { tokenUrl } = useParams()
  const navigate = useNavigate()
  const { setDarkMode, setCorPrimaria } = useTheme()

  const [loading, setLoading] = useState(true)
  const [paciente, setPaciente] = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [nomeAvaliador, setNomeAvaliador] = useState('')
  const [logomarcaUrl, setLogomarcaUrl] = useState('')
  const [sessaoAtiva, setSessaoAtiva] = useState(false)
  const [refeicoes, setRefeicoes] = useState([]) // do plano ativo, com itens prescritos
  const [dataSelecionada, setDataSelecionada] = useState(hoje())
  const [registros, setRegistros] = useState([])
  const [carregandoRegistros, setCarregandoRegistros] = useState(true)
  const [observacoes, setObservacoes] = useState({})
  const [refeicoesExtrasPendentes, setRefeicoesExtrasPendentes] = useState([])
  const [diasComRegistro, setDiasComRegistro] = useState(new Set())
  const [mostrarCalendario, setMostrarCalendario] = useState(false)
  const stripRef = useRef(null)

  useEffect(() => {
    const el = stripRef.current?.querySelector(`[data-dia="${dataSelecionada}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [dataSelecionada])

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)

      const { data: authData } = await supabase.auth.getUser()
      setSessaoAtiva(!!authData?.user)

      const { data: pacData } = await supabase
        .from('pacientes')
        .select('*')
        .eq('token_publico', tokenUrl)
        .maybeSingle()

      if (!pacData) { setLoading(false); return }
      setPaciente(pacData)

      if (pacData.id_avaliador) {
        const { data: avalData } = await supabase
          .from('avaliadores')
          .select('auth_id, empresa, nome_completo, logomarca_url')
          .eq('auth_id', pacData.id_avaliador)
          .maybeSingle()

        if (avalData) {
          setNomeEmpresa(avalData.empresa || '')
          setNomeAvaliador(avalData.nome_completo || '')
          setLogomarcaUrl(avalData.logomarca_url || '')

          const { data: configData } = await supabase
            .from('configuracoes_avaliador')
            .select('dark_mode, cor_primaria')
            .eq('auth_id', avalData.auth_id)
            .maybeSingle()

          if (configData) {
            setDarkMode(pacData.tema_dark_mode != null ? pacData.tema_dark_mode : !!configData.dark_mode)
            if (configData.cor_primaria) setCorPrimaria(configData.cor_primaria)
          }
        }
      }

      // Mesmo select aninhado de PlanoAlimentarPaciente.jsx — já traz os
      // itens prescritos e as substituições aprovadas de cada um, pra
      // montar os atalhos "Comi isso" / "Troquei" sem consulta extra.
      const { data: planoData } = await supabase
        .from('planos_alimentares')
        .select('id, refeicoes_prescritas(id, nome_refeicao, horario, ordem, itens_refeicao(*, tabela_alimentos(*), substitutos_item(*, tabela_alimentos(*))))')
        .eq('id_paciente', pacData.id)
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const listaRefeicoes = (planoData?.refeicoes_prescritas || []).slice().sort((a, b) => {
        if (a.horario && b.horario) return a.horario.localeCompare(b.horario)
        if (a.horario) return -1
        if (b.horario) return 1
        return (a.ordem || 0) - (b.ordem || 0)
      })
      setRefeicoes(listaRefeicoes)
      setLoading(false)
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenUrl])

  const carregarRegistros = async () => {
    if (!paciente) return
    setCarregandoRegistros(true)
    const { data } = await supabase
      .from('diario_alimentar_itens')
      .select('id, nome_refeicao, quantidade_medida, unidade_medida, tabela_alimentos(nome)')
      .eq('id_paciente', paciente.id)
      .eq('data', dataSelecionada)
      .order('created_at')
    setRegistros(data || [])
    setCarregandoRegistros(false)
  }

  const carregarObservacoes = async () => {
    if (!paciente) return
    const { data } = await supabase
      .from('diario_alimentar_observacoes')
      .select('nome_refeicao, observacao')
      .eq('id_paciente', paciente.id)
      .eq('data', dataSelecionada)
    const mapa = {}
    for (const o of data || []) mapa[o.nome_refeicao] = o.observacao
    setObservacoes(mapa)
  }

  const handleSalvarObservacao = async (nomeRefeicao, texto) => {
    const { error } = await supabase
      .from('diario_alimentar_observacoes')
      .upsert(
        { id_paciente: paciente.id, id_avaliador: paciente.id_avaliador, data: dataSelecionada, nome_refeicao: nomeRefeicao, observacao: texto, updated_at: new Date().toISOString() },
        { onConflict: 'id_paciente,data,nome_refeicao' }
      )
    if (error) return alert('Erro ao salvar observação: ' + error.message)
    setObservacoes((prev) => ({ ...prev, [nomeRefeicao]: texto }))
  }

  // Datas com pelo menos 1 registro — pra marcar a faixa de dias e o
  // calendário (dias "preenchidos"). Sem filtro de intervalo: o volume por
  // paciente é pequeno o bastante pra trazer tudo de uma vez.
  const carregarDiasComRegistro = async () => {
    if (!paciente) return
    const { data } = await supabase
      .from('diario_alimentar_itens')
      .select('data')
      .eq('id_paciente', paciente.id)
    setDiasComRegistro(new Set((data || []).map((r) => r.data)))
  }

  useEffect(() => {
    carregarRegistros()
    carregarDiasComRegistro()
    carregarObservacoes()
    setRefeicoesExtrasPendentes([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paciente, dataSelecionada])

  const handleAdicionar = async (nomeRefeicao, item) => {
    const { error } = await supabase.from('diario_alimentar_itens').insert({
      id_paciente: paciente.id,
      id_avaliador: paciente.id_avaliador,
      data: dataSelecionada,
      nome_refeicao: nomeRefeicao,
      id_alimento: item.id_alimento,
      quantidade_g: item.quantidade_g,
      unidade_medida: item.unidade_medida,
      quantidade_medida: item.quantidade_medida,
    })
    if (error) return alert('Erro ao registrar: ' + error.message)
    carregarRegistros()
    carregarDiasComRegistro()
  }

  const handleRemover = async (id) => {
    const { error } = await supabase.from('diario_alimentar_itens').delete().eq('id', id)
    if (error) return alert('Erro ao remover: ' + error.message)
    setRegistros((prev) => prev.filter((r) => r.id !== id))
    carregarDiasComRegistro()
  }

  // Igual ao "+ Nova Refeição" de Montar Plano Alimentar: cria na hora com
  // um nome genérico numerado, sem pedir nada antes — o paciente renomeia
  // depois clicando no próprio título (mesmo padrão de input inline).
  const handleNovaRefeicaoExtra = () => {
    const numero = refeicoesExtrasPendentes.length + nomesExtrasComRegistro.length + 1
    setRefeicoesExtrasPendentes((prev) => [...prev, `Refeição ${numero}`])
  }

  const handleRenomearRefeicaoExtra = async (nomeAntigo, nomeNovo) => {
    if (refeicoes.some((r) => r.nome_refeicao === nomeNovo) || nomesExtras.includes(nomeNovo)) {
      return alert('Já existe uma refeição com esse nome.')
    }
    setRefeicoesExtrasPendentes((prev) => prev.map((n) => (n === nomeAntigo ? nomeNovo : n)))
    setObservacoes((prev) => {
      if (!(nomeAntigo in prev)) return prev
      const { [nomeAntigo]: valor, ...resto } = prev
      return { ...resto, [nomeNovo]: valor }
    })
    const temRegistro = registros.some((r) => r.nome_refeicao === nomeAntigo)
    if (temRegistro) {
      const { error } = await supabase
        .from('diario_alimentar_itens')
        .update({ nome_refeicao: nomeNovo })
        .eq('id_paciente', paciente.id)
        .eq('data', dataSelecionada)
        .eq('nome_refeicao', nomeAntigo)
      if (error) return alert('Erro ao renomear: ' + error.message)
      carregarRegistros()
    }
    if (observacoes[nomeAntigo]) {
      const { error: erroObs } = await supabase
        .from('diario_alimentar_observacoes')
        .update({ nome_refeicao: nomeNovo })
        .eq('id_paciente', paciente.id)
        .eq('data', dataSelecionada)
        .eq('nome_refeicao', nomeAntigo)
      if (erroObs) alert('Erro ao mover observação pro novo nome: ' + erroObs.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="text-primary-600 font-bold animate-pulse">Carregando diário alimentar...</p>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-gray-700 dark:text-slate-300 font-semibold">Link inválido.</p>
        </div>
      </div>
    )
  }

  if (paciente.diario_alimentar_ativo === false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <CabecalhoPortalPaciente
            logomarcaUrl={logomarcaUrl}
            nomeEmpresa={nomeEmpresa}
            nomeAvaliador={nomeAvaliador}
            aoVoltar={() => navigate(`/area/${tokenUrl}`)}
          />
          {!sessaoAtiva && <NavegacaoPortalPaciente tokenPaciente={tokenUrl} ativo="diario" />}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-gray-500 dark:text-slate-400 text-sm">O diário alimentar não está disponível no momento — fale com seu nutricionista se precisar dele.</p>
          </div>
        </div>
      </div>
    )
  }

  // Refeições extras = nomes que já têm registro nesse dia mas não estão
  // no plano (ex: um lanche fora do prescrito) + as recém-criadas nessa
  // sessão que ainda não têm nenhum item (só pra abrir a seção vazia).
  const nomesPlano = refeicoes.map((r) => r.nome_refeicao)
  const nomesExtrasComRegistro = [...new Set(registros.map((r) => r.nome_refeicao).filter((n) => !nomesPlano.includes(n)))]
  const nomesExtras = [...new Set([...nomesExtrasComRegistro, ...refeicoesExtrasPendentes])]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <CabecalhoPortalPaciente
          logomarcaUrl={logomarcaUrl}
          nomeEmpresa={nomeEmpresa}
          nomeAvaliador={nomeAvaliador}
          aoVoltar={() => navigate(`/area/${tokenUrl}`)}
        />

        {!sessaoAtiva && (
          <NavegacaoPortalPaciente tokenPaciente={tokenUrl} ativo="diario" />
        )}

        <div>
          <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">Diário Alimentar</h2>
          <p className="text-base text-gray-500 dark:text-slate-400 mt-0.5">{paciente.nome_completo}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-sm font-bold text-gray-800 dark:text-slate-100 capitalize">{formatarDataExibicao(dataSelecionada)}</span>
            <button
              onClick={() => setMostrarCalendario(true)}
              className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
              title="Abrir calendário"
            >
              <CalendarDays size={18} />
            </button>
          </div>
          <div ref={stripRef} className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {Array.from({ length: 15 }, (_, i) => somarDias(dataSelecionada, i - 7)).map((dia) => {
              const selecionado = dia === dataSelecionada
              const futuro = dia > hoje()
              const temRegistro = diasComRegistro.has(dia)
              return (
                <button
                  key={dia}
                  data-dia={dia}
                  onClick={() => !futuro && setDataSelecionada(dia)}
                  disabled={futuro}
                  className={`flex flex-col items-center gap-1 shrink-0 w-11 py-1.5 rounded-xl transition-colors ${
                    selecionado
                      ? 'bg-primary-600 text-white'
                      : futuro
                      ? 'opacity-30 text-gray-400 cursor-default'
                      : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase">{diaSemanaAbrev(dia)}</span>
                  <span className="text-sm font-black">{Number(dia.slice(8, 10))}</span>
                  <span className={`w-1 h-1 rounded-full ${temRegistro ? (selecionado ? 'bg-white' : 'bg-primary-500') : 'bg-transparent'}`} />
                </button>
              )
            })}
          </div>
        </div>

        {mostrarCalendario && (
          <ModalCalendario
            dataSelecionada={dataSelecionada}
            diasComRegistro={diasComRegistro}
            onSelecionar={(iso) => { setDataSelecionada(iso); setMostrarCalendario(false) }}
            onFechar={() => setMostrarCalendario(false)}
          />
        )}

        {refeicoes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhum plano alimentar ativo no momento — o diário fica disponível assim que seu nutricionista montar um plano.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {refeicoes.map((refeicao) => (
              <SecaoRefeicao
                key={refeicao.id}
                nome={refeicao.nome_refeicao}
                horario={refeicao.horario}
                itensPrescritos={refeicao.itens_refeicao || []}
                itensRegistrados={registros.filter((r) => r.nome_refeicao === refeicao.nome_refeicao)}
                carregando={carregandoRegistros}
                onRegistrarRapido={(item) => handleAdicionar(refeicao.nome_refeicao, item)}
                onAdicionarBusca={(item) => handleAdicionar(refeicao.nome_refeicao, item)}
                onRemover={handleRemover}
                observacao={observacoes[refeicao.nome_refeicao]}
                onSalvarObservacao={(texto) => handleSalvarObservacao(refeicao.nome_refeicao, texto)}
              />
            ))}

            {nomesExtras.map((nome) => (
              <SecaoRefeicao
                key={nome}
                nome={nome}
                horario={null}
                itensPrescritos={[]}
                itensRegistrados={registros.filter((r) => r.nome_refeicao === nome)}
                carregando={carregandoRegistros}
                onRegistrarRapido={(item) => handleAdicionar(nome, item)}
                onAdicionarBusca={(item) => handleAdicionar(nome, item)}
                onRemover={handleRemover}
                editavel
                onRenomear={(nomeNovo) => handleRenomearRefeicaoExtra(nome, nomeNovo)}
                observacao={observacoes[nome]}
                onSalvarObservacao={(texto) => handleSalvarObservacao(nome, texto)}
              />
            ))}

            <button
              onClick={handleNovaRefeicaoExtra}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border border-dashed border-gray-300 dark:border-slate-700 text-gray-500 dark:text-slate-400 text-sm font-semibold rounded-xl hover:border-primary-400 hover:text-primary-600 transition-colors"
            >
              <Plus size={15} /> Nova Refeição
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
