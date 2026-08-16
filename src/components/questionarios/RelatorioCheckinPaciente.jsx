import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
// (Legend só é usado no mini-gráfico combinado de Peso+IMC — os demais,
// um por pergunta, não precisam de legenda.)
import { supabase } from '../../supabaseClient'
import { useTheme } from '../../contexts/ThemeContext'
import { TrendingUp } from 'lucide-react'

const CORES_LINHA = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed']
const TIPOS_NO_RELATORIO = ['numero', 'escala_linear']

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// Gráfico genérico pro paciente, um por check-in com mostrar_grafico_
// paciente=true — plota toda pergunta de Número/Escala Linear ao longo do
// tempo. Quando o check-in tem uma pergunta campo_especial='peso', calcula
// e soma IMC também (altura da avaliação mais recente, ou da resposta de
// campo_especial='altura' quando não há avaliação ainda). Valores não
// oficiais: não substitui a avaliação com o nutricionista.
export default function RelatorioCheckinPaciente({ pacienteId, idQuestionario, titulo }) {
  const { darkMode } = useTheme()
  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState([])
  const [series, setSeries] = useState([])

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)

      const [avalRes, enviosRes] = await Promise.all([
        supabase
          .from('avaliacoes')
          .select('altura_paciente')
          .eq('id_paciente', pacienteId)
          .order('data_avaliacao', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('questionario_envios')
          .select('respondido_em, questionario_respostas(resposta, questionario_perguntas(texto, tipo, campo_especial))')
          .eq('id_paciente', pacienteId)
          .eq('id_questionario', idQuestionario)
          .in('status', ['respondido', 'revisado'])
          .order('respondido_em', { ascending: true }),
      ])

      let alturaCm = avalRes.data?.altura_paciente || null
      let temPeso = false
      const nomesSeries = new Set()

      const pontos = (enviosRes.data || []).map((envio) => {
        const linha = { data: formatarData(envio.respondido_em) }
        let alturaManual = null
        for (const resp of envio.questionario_respostas || []) {
          const pergunta = resp.questionario_perguntas
          if (!pergunta || !resp.resposta) continue
          if (pergunta.campo_especial === 'altura') { alturaManual = Number(resp.resposta); continue }
          if (TIPOS_NO_RELATORIO.includes(pergunta.tipo)) {
            const nome = pergunta.campo_especial === 'peso' ? 'Peso (kg)' : (pergunta.texto || 'Valor')
            linha[nome] = Number(resp.resposta)
            nomesSeries.add(nome)
            if (pergunta.campo_especial === 'peso') temPeso = true
          }
        }
        if (alturaManual && !alturaCm) alturaCm = alturaManual
        return linha
      })

      if (temPeso && alturaCm) {
        const alturaM = alturaCm / 100
        for (const p of pontos) {
          if (p['Peso (kg)']) p['IMC'] = Number((p['Peso (kg)'] / (alturaM * alturaM)).toFixed(1))
        }
        nomesSeries.add('IMC')
      }

      setDados(pontos)
      setSeries([...nomesSeries])
      setLoading(false)
    }
    carregar()
  }, [pacienteId, idQuestionario])

  if (loading || dados.length === 0 || series.length === 0) return null

  // Peso e IMC ficam juntos num gráfico só (dupla escala) — é uma dupla
  // que faz sentido comparar lado a lado. Cada outra pergunta (texto pode
  // ser uma frase inteira, comum em escala linear) vira seu próprio
  // mini-gráfico, sem legenda combinada — com muitas perguntas, uma
  // legenda única tomava o espaço todo e o gráfico nem aparecia.
  const temPesoOuImc = series.includes('Peso (kg)') || series.includes('IMC')
  const outrasSeries = series.filter((s) => s !== 'Peso (kg)' && s !== 'IMC')

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
      <div>
        <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp size={15} /> {titulo}
        </h3>
        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
          Baseado nas suas respostas — não substitui a avaliação com seu nutricionista.
        </p>
      </div>

      {temPesoOuImc && (
        <div className="w-full h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="data" tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} tickLine={false} axisLine={false} width={35} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {series.includes('Peso (kg)') && <Line type="monotone" dataKey="Peso (kg)" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} connectNulls />}
              {series.includes('IMC') && <Line type="monotone" dataKey="IMC" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} connectNulls />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {outrasSeries.map((nome, idx) => (
        <div key={nome} className="space-y-1">
          <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 line-clamp-2" title={nome}>
            {nome}
          </p>
          <div className="w-full h-[110px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dados} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
  )
}
