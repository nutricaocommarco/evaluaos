import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../../supabaseClient'
import { useTheme } from '../../contexts/ThemeContext'
import { Scale } from 'lucide-react'

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// Gráfico de peso/IMC alimentado pelas respostas do Check-in Semanal
// (perguntas marcadas com campo_especial='peso'). A altura vem da
// avaliação antropométrica mais recente quando existe; sem nenhuma
// avaliação ainda, cai pro campo_especial='altura' informado pelo próprio
// paciente numa resposta (mesmo caminho seguro de sempre — sem nenhuma
// escrita pública nova). Valores não-oficiais, só o Portal do Paciente
// mostra isso (nunca entra no Laudo/Evolução oficiais).
export default function GraficoPesoImcPaciente({ pacienteId }) {
  const { darkMode } = useTheme()
  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState([])

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)

      const { data: pac } = await supabase
        .from('pacientes')
        .select('id_questionario_semanal, mostrar_grafico_peso_paciente')
        .eq('id', pacienteId)
        .maybeSingle()

      if (!pac?.mostrar_grafico_peso_paciente || !pac?.id_questionario_semanal) {
        setDados([])
        setLoading(false)
        return
      }

      const [avalRes, enviosRes] = await Promise.all([
        supabase
          .from('avaliacoes')
          .select('altura_paciente, data_avaliacao')
          .eq('id_paciente', pacienteId)
          .order('data_avaliacao', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('questionario_envios')
          .select('respondido_em, questionario_respostas(resposta, questionario_perguntas(campo_especial))')
          .eq('id_paciente', pacienteId)
          .eq('id_questionario', pac.id_questionario_semanal)
          .in('status', ['respondido', 'revisado'])
          .order('respondido_em', { ascending: true }),
      ])

      let alturaCm = avalRes.data?.altura_paciente || null

      const pontos = []
      for (const envio of enviosRes.data || []) {
        let peso = null
        let alturaManual = null
        for (const resp of envio.questionario_respostas || []) {
          if (resp.questionario_perguntas?.campo_especial === 'peso' && resp.resposta) peso = Number(resp.resposta)
          if (resp.questionario_perguntas?.campo_especial === 'altura' && resp.resposta) alturaManual = Number(resp.resposta)
        }
        if (alturaManual && !alturaCm) alturaCm = alturaManual
        if (peso) pontos.push({ data: formatarData(envio.respondido_em), peso })
      }

      if (alturaCm) {
        const alturaM = alturaCm / 100
        for (const p of pontos) p.imc = Number((p.peso / (alturaM * alturaM)).toFixed(1))
      }

      setDados(pontos)
      setLoading(false)
    }
    carregar()
  }, [pacienteId])

  if (loading || dados.length === 0) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 space-y-3">
      <div>
        <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <Scale size={15} /> Sua Evolução de Peso e IMC
        </h3>
        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
          Valores baseados nas suas respostas do check-in semanal — não substitui a avaliação com seu nutricionista.
        </p>
      </div>
      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="data" tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="peso" tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} tickLine={false} axisLine={false} width={35} />
            <YAxis yAxisId="imc" orientation="right" tick={{ fontSize: 10, fill: darkMode ? '#94a3b8' : '#64748b' }} tickLine={false} axisLine={false} width={35} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line yAxisId="peso" type="monotone" dataKey="peso" name="Peso (kg)" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line yAxisId="imc" type="monotone" dataKey="imc" name="IMC" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
