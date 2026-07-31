import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function ExportadorDadosCSV() {
  const [exportando, setExportando] = useState(false)

  const exportarPacientesCSV = async () => {
    setExportando(true)
    try {
      const { data: pacientes, error } = await supabase.from('pacientes').select('*')
      if (error) throw error

      if (!pacientes || pacientes.length === 0) {
        alert('Nenhum paciente encontrado para exportação.')
        setExportando(false)
        return
      }

      const cabecalhos = ['ID', 'Nome Completo', 'Data Nascimento', 'Sexo', 'Email', 'Telefone', 'Etnia', 'Ocupação', 'Esporte', 'Modalidade']
      const linhas = pacientes.map(p => [
        p.id,
        `"${p.nome_completo || ''}"`,
        p.data_nascimento || '',
        p.sexo || '',
        p.email || '',
        p.telefone || '',
        p.etnia || '',
        `"${p.ocupacao || ''}"`,
        p.pratica_esporte ? 'Sim' : 'Não',
        `"${p.modalidade_esportiva || ''}"`
      ])

      const conteudoCSV = '\uFEFF' + [cabecalhos.join(';'), ...linhas.map(e => e.join(';'))].join('\n')
      const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `evaluaos_pacientes_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      alert('Erro ao exportar dados: ' + err.message)
    }
    setExportando(false)
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Backup & Exportação de Dados</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Baixe uma planilha em formato CSV contendo a lista completa de alunos/pacientes para ter como cópia de segurança.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            📊
          </div>
          <div>
            <span className="text-xs font-bold text-gray-800 block">Exportar Cadastro de Pacientes</span>
            <span className="text-[11px] text-gray-400 block">Arquivo compatível com Microsoft Excel, Google Planilhas e Numbers</span>
          </div>
        </div>

        <button
          onClick={exportarPacientesCSV}
          disabled={exportando}
          className="px-4 py-2.5 bg-gray-800 text-white rounded-lg text-xs font-semibold hover:bg-gray-900 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
        >
          {exportando ? 'Gerando CSV...' : 'Baixar Planilha (CSV)'}
        </button>
      </div>
    </div>
  )
}