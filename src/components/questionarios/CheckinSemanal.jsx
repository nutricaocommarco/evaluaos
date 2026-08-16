import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../../supabaseClient'
import { useTheme } from '../../contexts/ThemeContext'
import { MessageCircle, TrendingUp, X, Plus, ChevronDown, ChevronRight } from 'lucide-react'

const CORES_LINHA = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed']
const TIPOS_NO_RELATORIO = ['numero', 'escala_linear']

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// Um card por check-in ativo — cada um com seu próprio lembrete, gráfico
// pro paciente (liga/desliga independente) e relatório. Só perguntas de
// Número ou Escala Linear entram no relatório automático; outros tipos
// continuam sendo coletados normalmente, só não aparecem no gráfico.
function CardCheckin({ checkin, paciente, userId, aoRemovido }) {
  const { darkMode } = useTheme()
  const [envioPendente, setEnvioPendente] = useState(null)
  const [dadosRelatorio, setDadosRelatorio] = useState([])
  const [seriesNumericas, setSeriesNumericas] = useState([])
  const [gerandoLembrete, setGerandoLembrete] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mostrarGrafico, setMostrarGrafico] = useState(!!checkin.mostrar_grafico_paciente)
  const [aberto, setAberto] = useState(false)

  const carregarRelatorio = async () => {
    const { data: envios } = await supabase
      .from('questionario_envios')
      .select('id, status, respondido_em, questionario_respostas(resposta, questionario_perguntas(texto, tipo))')
      .eq('id_paciente', paciente.id)
      .eq('id_questionario', checkin.id_questionario)
      .order('created_at', { ascending: true })

    const pendente = (envios || []).filter((e) => e.status === 'aguardando').slice(-1)[0] || null
    setEnvioPendente(pendente)

    const respondidos = (envios || []).filter((e) => e.status !== 'aguardando' && e.respondido_em)
    const nomesSeries = new Set()
    const linhas = respondidos.map((envio) => {
      const linha = { data: formatarData(envio.respondido_em) }
      for (const resp of envio.questionario_respostas || []) {
        if (TIPOS_NO_RELATORIO.includes(resp.questionario_perguntas?.tipo) && resp.resposta) {
          const nome = resp.questionario_perguntas.texto || 'Valor'
          linha[nome] = Number(resp.resposta)
          nomesSeries.add(nome)
        }
      }
      return linha
    })
    setDadosRelatorio(linhas)
    setSeriesNumericas([...nomesSeries])
  }

  useEffect(() => {
    carregarRelatorio()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkin.id_questionario])

  const handleToggleGrafico = async () => {
    const novoValor = !mostrarGrafico
    setSalvando(true)
    const { error } = await supabase
      .from('checkins_semanais_pacientes')
      .update({ mostrar_grafico_paciente: novoValor })
      .eq('id', checkin.id)
    setSalvando(false)
    if (error) { alert('Erro ao atualizar: ' + error.message); return }
    setMostrarGrafico(novoValor)
  }

  const handleRemover = async () => {
    if (!window.confirm(`Desligar "${checkin.questionarios.titulo}" pra ${paciente.nome_completo}? Os envios e respostas já feitos continuam guardados.`)) return
    setSalvando(true)
    const { error } = await supabase.from('checkins_semanais_pacientes').delete().eq('id', checkin.id)
    setSalvando(false)
    if (error) { alert('Erro ao remover: ' + error.message); return }
    aoRemovido(checkin.id)
  }

  const handleEnviarLembrete = async () => {
    setGerandoLembrete(true)
    let envio = envioPendente
    if (!envio) {
      const { data, error } = await supabase
        .from('questionario_envios')
        .insert({ id_questionario: checkin.id_questionario, id_avaliador: userId, id_paciente: paciente.id })
        .select()
        .single()
      if (error) { setGerandoLembrete(false); alert('Erro ao gerar envio: ' + error.message); return }
      envio = data
      setEnvioPendente(data)
    }
    setGerandoLembrete(false)

    const link = `${window.location.origin}/questionario/${envio.token_publico}`
    const telefoneLimpo = paciente.telefone?.replace(/\D/g, '')
    if (!telefoneLimpo) { alert('Este paciente não tem telefone cadastrado.'); return }
    const mensagem = `Olá *${paciente.nome_completo.split(' ')[0]}*, tudo bem?\n\nHora do seu check-in: "${checkin.questionarios.titulo}". É rapidinho:\n\n${link}\n\nQualquer dúvida, me chama!`
    const numero = telefoneLimpo.startsWith('55') ? telefoneLimpo : '55' + telefoneLimpo
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, '_blank')
  }

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="flex-1 flex items-center gap-1.5 text-left min-w-0"
        >
          {aberto ? (
            <ChevronDown size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
          ) : (
            <ChevronRight size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
          )}
          <p className="text-sm font-black text-gray-800 dark:text-slate-100 truncate">{checkin.questionarios.titulo}</p>
        </button>
        <button
          type="button"
          onClick={handleRemover}
          disabled={salvando}
          title="Desligar esse check-in pra esse paciente"
          className="text-gray-400 hover:text-red-500 disabled:opacity-50 shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {aberto && (
      <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleEnviarLembrete}
          disabled={gerandoLembrete}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg shadow disabled:opacity-50"
        >
          <MessageCircle size={14} /> {gerandoLembrete ? 'Preparando...' : envioPendente ? 'Enviar Lembrete (já tem um pendente)' : 'Enviar Lembrete'}
        </button>

        <button
          type="button"
          onClick={handleToggleGrafico}
          disabled={salvando}
          title="Controla se o PACIENTE consegue ver o próprio gráfico desse check-in no Portal dele"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
            mostrarGrafico
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-transparent'
          }`}
        >
          <span className={`relative w-7 h-3.5 rounded-full transition-colors ${mostrarGrafico ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-slate-600'}`}>
            <span className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white rounded-full shadow transition-transform ${mostrarGrafico ? 'translate-x-3.5' : 'translate-x-0'}`} />
          </span>
          📈 Paciente vê o gráfico: {mostrarGrafico ? 'SIM' : 'NÃO'}
        </button>
      </div>

      {dadosRelatorio.length > 0 && seriesNumericas.length > 0 && (
        <div className="pt-2 space-y-3">
          <p className="text-xs font-bold text-gray-600 dark:text-slate-400 flex items-center gap-1.5">
            <TrendingUp size={13} /> Relatório — respostas ao longo do tempo
          </p>
          {/* Um mini-gráfico por pergunta em vez de um gráfico só com todas
              as séries — com perguntas de texto longo (comum em escala
              linear), uma legenda combinada tomava o espaço todo e o
              gráfico em si nem aparecia. */}
          {seriesNumericas.map((nome, idx) => (
            <div key={nome} className="space-y-1">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 line-clamp-2" title={nome}>
                {nome}
              </p>
              <div className="w-full h-[110px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosRelatorio} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="data" tick={{ fontSize: 9, fill: darkMode ? '#94a3b8' : '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: darkMode ? '#94a3b8' : '#64748b' }} tickLine={false} axisLine={false} width={24} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Line type="monotone" dataKey={nome} stroke={CORES_LINHA[idx % CORES_LINHA.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  )
}

export default function CheckinSemanal({ paciente, userId }) {
  const [loading, setLoading] = useState(true)
  const [checkinsAtivos, setCheckinsAtivos] = useState([])
  const [questionariosRecorrentes, setQuestionariosRecorrentes] = useState([])
  const [questionarioParaAdicionar, setQuestionarioParaAdicionar] = useState('')
  const [adicionando, setAdicionando] = useState(false)

  const carregar = async () => {
    setLoading(true)
    const [checkinsRes, questionariosRes] = await Promise.all([
      supabase
        .from('checkins_semanais_pacientes')
        .select('id, id_questionario, mostrar_grafico_paciente, questionarios(titulo)')
        .eq('id_paciente', paciente.id)
        .order('created_at'),
      supabase
        .from('questionarios')
        .select('id, titulo')
        .eq('id_avaliador', userId)
        .eq('recorrente_semanal', true)
        .order('titulo'),
    ])
    setCheckinsAtivos(checkinsRes.data || [])
    setQuestionariosRecorrentes(questionariosRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paciente.id])

  const idsAtivos = new Set(checkinsAtivos.map((c) => c.id_questionario))
  const disponiveis = questionariosRecorrentes.filter((q) => !idsAtivos.has(q.id))

  const handleAdicionar = async () => {
    const idQuestionario = questionarioParaAdicionar || disponiveis[0]?.id
    if (!idQuestionario) return
    setAdicionando(true)
    const { data, error } = await supabase
      .from('checkins_semanais_pacientes')
      .insert({ id_paciente: paciente.id, id_questionario: idQuestionario, id_avaliador: userId })
      .select('id, id_questionario, mostrar_grafico_paciente, questionarios(titulo)')
      .single()
    setAdicionando(false)
    if (error) { alert('Erro ao ativar check-in: ' + error.message); return }
    setCheckinsAtivos((prev) => [...prev, data])
    setQuestionarioParaAdicionar('')
  }

  const handleRemovido = (checkinId) => {
    setCheckinsAtivos((prev) => prev.filter((c) => c.id !== checkinId))
  }

  if (loading) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
      <div>
        <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
          🔁 Check-ins Semanais
        </h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          Cria automaticamente um novo envio toda semana. Pode ter mais de um ativo ao mesmo tempo.
        </p>
      </div>

      {checkinsAtivos.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-slate-500">Nenhum check-in ativo pra esse paciente ainda.</p>
      ) : (
        <div className="space-y-3">
          {checkinsAtivos.map((checkin) => (
            <CardCheckin key={checkin.id} checkin={checkin} paciente={paciente} userId={userId} aoRemovido={handleRemovido} />
          ))}
        </div>
      )}

      {disponiveis.length === 0 ? (
        questionariosRecorrentes.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            Nenhum questionário marcado como recorrente ainda. Abra um questionário em <strong>Questionários</strong> e ligue a "Recorrência Semanal" nele — só perguntas de Número ou Escala Linear entram no relatório automático.
          </p>
        )
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
          <select
            value={questionarioParaAdicionar}
            onChange={(e) => setQuestionarioParaAdicionar(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500"
          >
            {disponiveis.map((q) => (
              <option key={q.id} value={q.id}>{q.titulo}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdicionar}
            disabled={adicionando}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
          >
            <Plus size={14} /> {adicionando ? 'Ativando...' : 'Ativar Check-in'}
          </button>
        </div>
      )}
    </div>
  )
}
