import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function ExportadorDadosCSV() {
  const [exportando, setExportando] = useState(false)

  const exportarBackupCompletoCSV = async () => {
    setExportando(true)
    try {
      // 1. Pega o usuário logado atual
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData?.user) {
        throw new Error('Usuário não autenticado.')
      }
      const userId = authData.user.id

      // 2. Consulta unificada trazendo todas as colunas das 3 tabelas
      const { data, error } = await supabase
        .from('avaliacoes')
        .select(`
          *,
          pacientes!inner (*),
          dados_calculados (*)
        `)
        .eq('pacientes.id_avaliador', userId)
        .order('data_avaliacao', { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        alert('Nenhum dado encontrado para exportação.')
        setExportando(false)
        return
      }

      // 3. Cabeçalhos abrangendo Paciente, Avaliação e Dados Calculados
      const cabecalhos = [
        // Paciente
        'ID Paciente', 'Nome Completo', 'Data Nascimento', 'Sexo', 'Email', 'Telefone', 'Etnia', 'Nacionalidade', 'Pratica Esporte', 'Modalidade Esportiva', 'Nível Prática', 'Ocupação', 'Observações Paciente',
        // Avaliação (Brutos / Gerais)
        'ID Avaliação', 'Data Avaliação', 'Hora Avaliação', 'Equação Regressao Escolhida', 'Fator Atividade Física', 'Peso (kg)', 'Altura (cm)', 'Altura Sentado (cm)', 'Envergadura (cm)', '% Gordura',
        // Dobras Cutâneas
        'Dobra Tríceps', 'Dobra Subescapular', 'Dobra Bíceps', 'Dobra Crista Ilíaca', 'Dobra Supraespinhal', 'Dobra Abdominal', 'Dobra Coxa Média', 'Dobra Panturrilha',
        // Perímetros / Circunferências
        'Perímetro Braço Relaxado', 'Perímetro Braço Contraído', 'Perímetro Antebraço', 'Perímetro Cintura', 'Perímetro Abdominal', 'Perímetro Quadril', 'Perímetro Coxa Máxima', 'Perímetro Coxa Média', 'Perímetro Panturrilha',
        // Diâmetros Ósseos
        'Diâmetro Úmero', 'Diâmetro Fêmur', 'Diâmetro Punho', 'Diâmetro Maleolar',
        // Dados Calculados
        'IMC', 'Massa Gorda (kg)', 'Massa Magra (kg)', 'Massa Muscular (kg)', 'RCQ', 'RCE', 'IMO (%)', 'APVAT', 'IAM',
        'Somatório 6 Dobras', 'Somatório 8 Dobras', 'Perímetro Corrigido Braço', 'Perímetro Corrigido Coxa', 'Perímetro Corrigido Panturrilha',
        'Endomorfia', 'Mesomorfia', 'Ectomorfia', 'Somatocarta Eixo X', 'Somatocarta Eixo Y',
        'Status Cintura', 'Classificação Gordura Morrow', 'Classificação Escala Argoref'
      ]

      const linhas = data.map(item => {
        const p = item.pacientes || {}
        const calc = Array.isArray(item.dados_calculados) ? (item.dados_calculados[0] || {}) : (item.dados_calculados || {})

        return [
          // Paciente
          p.id || '',
          `"${p.nome_completo || ''}"`,
          p.data_nascimento || '',
          p.sexo || '',
          p.email || '',
          p.telefone || '',
          `"${p.etnia || ''}"`,
          `"${p.nacionalidade || ''}"`,
          `"${p.pratica_esporte || ''}"`,
          `"${p.modalidade_esportiva || ''}"`,
          `"${p.nivel_pratica || ''}"`,
          `"${p.ocupacao || ''}"`,
          `"${p.observacoes || ''}"`,

          // Avaliação
          item.id,
          item.data_avaliacao || '',
          item.hora_avaliacao || '',
          `"${item.equacao_de_regressao_escolhida || ''}"`,
          item.fator_atividade_fisica ?? '',
          item.peso_paciente ?? '',
          item.altura_paciente ?? '',
          item.altura_sentado_paciente ?? '',
          item.envergadura_paciente ?? '',
          item.percentual_de_gordura ?? '',

          // Dobras
          item.dobra_cutanea_triceps ?? '',
          item.dobra_cutanea_subescapular ?? '',
          item.dobra_cutanea_biceps ?? '',
          item.dobra_cutanea_crista_iliaca ?? '',
          item.dobra_cutanea_supraespinhal ?? '',
          item.dobra_cutanea_abdominal ?? '',
          item.dobra_cutanea_coxa_media ?? '',
          item.dobra_cutanea_panturrilha ?? '',

          // Perímetros
          item.perimetro_braco_relaxado ?? '',
          item.perimetro_braco_contraido ?? '',
          item.perimetro_antibraco ?? '',
          item.perimetro_cintura ?? '',
          item.perimetro_abdominal ?? '',
          item.perimetro_quadril ?? '',
          item.perimetro_coxa_maxima ?? '',
          item.perimetro_coxa_media ?? '',
          item.perimetro_panturrilha ?? '',

          // Diâmetros
          item.diametro_umero ?? '',
          item.diametro_femur ?? '',
          item.diametro_punho ?? '',
          item.diametro_maleolar ?? '',

          // Calculados
          calc.imc ?? '',
          calc.massa_gorda ?? '',
          calc.massa_magra ?? '',
          calc.massa_muscular ?? '',
          calc.relacao_cintura_quadril ?? '',
          calc.relacao_cintura_estatura ?? '',
          calc.indice_massa_ossea_imo ?? '',
          calc.area_previsao_visceral_apvat ?? '',
          calc.indice_adiposo_muscular ?? '',
          calc.somatorio_6_dobras ?? '',
          calc.somatorio_8_dobras ?? '',
          calc.perimetro_corrigido_braco ?? '',
          calc.perimetro_corrigido_coxa ?? '',
          calc.perimetro_corrigido_panturrilha ?? '',
          calc.somatotipo_endomorfia ?? '',
          calc.somatotipo_mesomorfia ?? '',
          calc.somatotipo_ectomorfia ?? '',
          calc.somatocarta_eixo_x ?? '',
          calc.somatocarta_eixo_y ?? '',
          `"${calc.circunferencia_cintura_status || ''}"`,
          `"${calc.classificacao_gordura_morrow || ''}"`,
          `"${calc.classificacao_escala_argoref || ''}"`
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
          Baixe uma planilha completa contendo todas as variáveis antropométricas, cadastrais e calculadas dos seus pacientes.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            💾
          </div>
          <div>
            <span className="text-xs font-bold text-gray-800 block">Exportar Backup Completo (Meus Dados)</span>
            <span className="text-[11px] text-gray-400 block">Arquivo CSV estruturado para Excel, Google Planilhas e análises avançadas</span>
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