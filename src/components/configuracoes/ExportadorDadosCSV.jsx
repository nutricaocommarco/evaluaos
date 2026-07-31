import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function ExportadorDadosCSV() {
  const [exportando, setExportando] = useState(false)

  const exportarBackupCompletoCSV = async () => {
    setExportando(true)
    try {
      // Consulta unificada trazendo Avaliações, Pacientes e Dados Calculados
      const { data, error } = await supabase
        .from('avaliacoes')
        .select(`
          *,
          pacientes (*),
          dados_calculados (*)
        `)
        .order('data_avaliacao', { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        alert('Nenhum dado encontrado para exportação.')
        setExportando(false)
        return
      }

      const cabecalhos = [
        'ID Avaliação', 'Data Avaliação', 'Hora Avaliação', 'Protocolo / Equação', '% Gordura',
        'ID Paciente', 'Nome Paciente', 'Data Nascimento', 'Sexo', 'Etnia', 'Telefone', 'Email',
        'Peso (kg)', 'Estatura (cm)', 'IMC', 'Massa Gorda (kg)', 'Massa Magra (kg)', 'Massa Muscular (kg)',
        'Σ 6 Dobras', 'Σ 8 Dobras', 'RCQ', 'RCE', 'Endomorfia', 'Mesomorfia', 'Ectomorfia', 'IMO', 'IAM'
      ]

      const linhas = data.map(item => {
        const p = item.pacientes || {}
        const calc = Array.isArray(item.dados_calculados) ? (item.dados_calculados[0] || {}) : (item.dados_calculados || {})

        return [
          item.id,
          item.data_avaliacao || '',
          item.hora_avaliacao || '',
          `"${item.equacao_de_regressao_escolhida || ''}"`,
          item.percentual_de_gordura ?? '',
          p.id || '',
          `"${p.nome_completo || ''}"`,
          p.data_nascimento || '',
          p.sexo || '',
          `"${p.etnia || ''}"`,
          p.telefone || '',
          p.email || '',
          item.peso_paciente ?? '',
          item.altura_paciente ?? '',
          calc.imc ?? '',
          calc.massa_gorda ?? '',
          calc.massa_magra ?? '',
          calc.massa_muscular ?? '',
          calc.somatorio_6_dobras ?? '',
          calc.somatorio_8_dobras ?? '',
          calc.relacao_cintura_quadril ?? '',
          calc.relacao_cintura_estatura ?? '',
          calc.somatotipo_endomorfia ?? '',
          calc.somatotipo_mesomorfia ?? '',
          calc.somatotipo_ectomorfia ?? '',
          calc.indice_massa_ossea_imo ?? '',
          calc.indice_adiposo_muscular ?? ''
        ]
      })

      const conteudoCSV = '\uFEFF' + [cabecalhos.join(';'), ...linhas.map(e => e.join(';'))].join('\n')
      const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `evaluaos_backup_completo_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      alert('Erro ao exportar backup: ' + err.message)
    }
    setExportando(false)
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Backup & Exportação de Dados</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Baixe uma planilha contendo o cruzamento completo de pacientes, avaliações brutas e todos os dados calculados.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            💾
          </div>
          <div>
            <span className="text-xs font-bold text-gray-800 block">Exportar Backup Completo (Pacientes + Avaliações + Cálculos)</span>
            <span className="text-[11px] text-gray-400 block">Arquivo CSV estruturado para Excel, Google Planilhas e análise estatística</span>
          </div>
        </div>

        <button
          onClick={exportarBackupCompletoCSV}
          disabled={exportando}
          className="px-4 py-2.5 bg-gray-800 text-white rounded-lg text-xs font-semibold hover:bg-gray-900 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
        >
          {exportando ? 'Gerando Backup...' : 'Baixar Backup Completo (CSV)'}
        </button>
      </div>
    </div>
  )
}