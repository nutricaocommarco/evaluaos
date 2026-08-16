import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../../supabaseClient'
import { useTheme } from '../../contexts/ThemeContext'
import { MessageCircle, TrendingUp } from 'lucide-react'

const CORES_LINHA = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed']

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// Liga/Desliga do Check-in Semanal por paciente (padrão desligado). Quando
// ativo, o cron das segundas cria um novo envio automaticamente toda
// semana (ver api/cron/lembretes-agendamento.js) — aqui só mostramos o
// status, o botão de lembrete manual (mesmo link wa.me de sempre, sem
// nenhum envio automático de WhatsApp) e o relatório com as respostas
// numéricas (peso, refeições livres etc.) ao longo do tempo.
export default function CheckinSemanal({ paciente, userId }) {
  const { darkMode } = useTheme()
  const [loading, setLoading] = useState(true)
  const [questionariosRecorrentes, setQuestionariosRecorrentes] = useState([])
  const [questionarioAtivoId, setQuestionarioAtivoId] = useState(paciente.id_questionario_semanal || '')
  const [ativo, setAtivo] = useState(!!paciente.id_questionario_semanal)
  const [salvando, setSalvando] = useState(false)
  const [envioPendente, setEnvioPendente] = useState(null)
  const [dadosRelatorio, setDadosRelatorio] = useState([])
  const [seriesNumericas, setSeriesNumericas] = useState([])
  const [gerandoLembrete, setGerandoLembrete] = useState(false)
  const [mostrarGraficoPaciente, setMostrarGraficoPaciente] = useState(!!paciente.mostrar_grafico_peso_paciente)

  const carregarRelatorio = async (questionarioId) => {
    const { data: envios } = await supabase
      .from('questionario_envios')
      .select('id, status, respondido_em, questionario_respostas(resposta, questionario_perguntas(texto, tipo))')
      .eq('id_paciente', paciente.id)
      .eq('id_questionario', questionarioId)
      .order('created_at', { ascending: true })

    const pendente = (envios || []).filter((e) => e.status === 'aguardando').slice(-1)[0] || null
    setEnvioPendente(pendente)

    const respondidos = (envios || []).filter((e) => e.status !== 'aguardando' && e.respondido_em)
    const nomesSeries = new Set()
    const linhas = respondidos.map((envio) => {
      const linha = { data: formatarData(envio.respondido_em) }
      for (const resp of envio.questionario_respostas || []) {
        if (resp.questionario_perguntas?.tipo === 'numero' && resp.resposta) {
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

  const carregar = async () => {
    setLoading(true)
    const { data: qs } = await supabase
      .from('questionarios')
      .select('id, titulo')
      .eq('id_avaliador', userId)
      .eq('recorrente_semanal', true)
      .order('titulo')
    setQuestionariosRecorrentes(qs || [])

    if (paciente.id_questionario_semanal) {
      await carregarRelatorio(paciente.id_questionario_semanal)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paciente.id])

  const handleToggle = async () => {
    if (ativo) {
      setSalvando(true)
      const { error } = await supabase.from('pacientes').update({ id_questionario_semanal: null }).eq('id', paciente.id)
      setSalvando(false)
      if (error) { alert('Erro ao desligar: ' + error.message); return }
      setAtivo(false)
      setEnvioPendente(null)
      setDadosRelatorio([])
      return
    }

    const idParaAtivar = questionarioAtivoId || questionariosRecorrentes[0]?.id
    if (!idParaAtivar) return
    setSalvando(true)
    const { error } = await supabase.from('pacientes').update({ id_questionario_semanal: idParaAtivar }).eq('id', paciente.id)
    setSalvando(false)
    if (error) { alert('Erro ao ligar: ' + error.message); return }
    setQuestionarioAtivoId(idParaAtivar)
    setAtivo(true)
    await carregarRelatorio(idParaAtivar)
  }

  const handleToggleGraficoPaciente = async () => {
    const novoValor = !mostrarGraficoPaciente
    setSalvando(true)
    const { error } = await supabase.from('pacientes').update({ mostrar_grafico_peso_paciente: novoValor }).eq('id', paciente.id)
    setSalvando(false)
    if (error) { alert('Erro ao atualizar: ' + error.message); return }
    setMostrarGraficoPaciente(novoValor)
  }

  const handleTrocarQuestionario = async (novoId) => {
    setQuestionarioAtivoId(novoId)
    if (!ativo) return
    setSalvando(true)
    const { error } = await supabase.from('pacientes').update({ id_questionario_semanal: novoId }).eq('id', paciente.id)
    setSalvando(false)
    if (error) { alert('Erro ao trocar: ' + error.message); return }
    await carregarRelatorio(novoId)
  }

  const handleEnviarLembrete = async () => {
    setGerandoLembrete(true)
    let envio = envioPendente
    if (!envio) {
      const { data, error } = await supabase
        .from('questionario_envios')
        .insert({ id_questionario: questionarioAtivoId, id_avaliador: userId, id_paciente: paciente.id })
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
    const mensagem = `Olá *${paciente.nome_completo.split(' ')[0]}*, tudo bem?\n\nHora do seu check-in semanal! É rapidinho:\n\n${link}\n\nQualquer dúvida, me chama!`
    const numero = telefoneLimpo.startsWith('55') ? telefoneLimpo : '55' + telefoneLimpo
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, '_blank')
  }

  if (loading) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
            🔁 Check-in Semanal
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Cria automaticamente um novo questionário toda semana pro paciente responder — peso, refeições livres etc.
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={salvando || (!ativo && questionariosRecorrentes.length === 0)}
          title={questionariosRecorrentes.length === 0 ? 'Marque um questionário como "Recorrência Semanal" primeiro' : ''}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-colors disabled:opacity-50 ${
            ativo
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
          }`}
        >
          <span className={`relative w-8 h-4 rounded-full transition-colors ${ativo ? 'bg-white/30' : 'bg-gray-300 dark:bg-slate-600'}`}>
            <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${ativo ? 'translate-x-4' : 'translate-x-0'}`} />
          </span>
          {ativo ? 'LIGADO' : 'DESLIGADO'}
        </button>
      </div>

      {questionariosRecorrentes.length === 0 ? (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          Nenhum questionário marcado como recorrente ainda. Abra um questionário em <strong>Questionários</strong> e ligue a "Recorrência Semanal" nele.
        </p>
      ) : (
        <>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Questionário usado</label>
            <select
              value={questionarioAtivoId}
              onChange={(e) => handleTrocarQuestionario(e.target.value)}
              className="w-full sm:w-72 px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm outline-none bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500"
            >
              {questionariosRecorrentes.map((q) => (
                <option key={q.id} value={q.id}>{q.titulo}</option>
              ))}
            </select>
          </div>

          {ativo && (
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
                  onClick={handleToggleGraficoPaciente}
                  disabled={salvando}
                  title="Controla se o PACIENTE consegue ver o próprio gráfico de peso/IMC no Portal dele"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                    mostrarGraficoPaciente
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-transparent'
                  }`}
                >
                  <span className={`relative w-7 h-3.5 rounded-full transition-colors ${mostrarGraficoPaciente ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-slate-600'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white rounded-full shadow transition-transform ${mostrarGraficoPaciente ? 'translate-x-3.5' : 'translate-x-0'}`} />
                  </span>
                  📈 Paciente vê o gráfico de peso/IMC: {mostrarGraficoPaciente ? 'SIM' : 'NÃO'}
                </button>
              </div>

              {dadosRelatorio.length > 0 && (
                <div className="pt-2 space-y-2">
                  <p className="text-xs font-bold text-gray-600 dark:text-slate-400 flex items-center gap-1.5">
                    <TrendingUp size={13} /> Relatório — respostas ao longo do tempo
                  </p>
                  <div className="w-full h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dadosRelatorio} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="data" tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {seriesNumericas.map((nome, idx) => (
                          <Line key={nome} type="monotone" dataKey={nome} stroke={CORES_LINHA[idx % CORES_LINHA.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
