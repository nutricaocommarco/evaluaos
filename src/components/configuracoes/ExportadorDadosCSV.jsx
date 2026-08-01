import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext' // Importa a autenticação/status do plano
import { useNavigate } from 'react-router-dom'

export default function ExportadorDadosCSV() {
  const [exportando, setExportando] = useState(false)
  const [modalUpgradeAberto, setModalUpgradeAberto] = useState(false)
  
  const { planoStatus } = useAuth()
  const navigate = useNavigate()

  const exportarBackupCompletoCSV = async () => {
    // 🔒 TRAVA PLANO PRO: Se não for 'pro', abre o modal de upgrade e cancela a exportação
    if (planoStatus !== 'pro') {
      setModalUpgradeAberto(true)
      return
    }

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
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800 block">Exportar Backup Completo (Meus Dados)</span>
              {planoStatus !== 'pro' && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase">
                  Exclusivo Pro
                </span>
              )}
            </div>
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

      {/* 👑 MODAL DE UPGRADE PRO */}
      {modalUpgradeAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-2xl mx-auto">
              👑
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">Recurso Exclusivo do Plano Pro</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                A exportação completa de backups em CSV e planilhas é uma funcionalidade avançada reservada aos assinantes do **Plano Pro**.
              </p>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-left text-xs text-amber-900 space-y-1">
              <p className="font-semibold">Vantagens de assinar o Pro:</p>
              <p>• Backup ilimitado dos seus dados em CSV</p>
              <p>• Cadastro ilimitado de alunos e avaliações</p>
              <p>• Links de laudos e evolução sem limites</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => navigate('/meu-plano')}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition-colors shadow-md"
              >
                Conhecer o Plano Pro
              </button>
              <button
                onClick={() => setModalUpgradeAberto(false)}
                className="w-full py-2 bg-transparent text-gray-400 font-semibold rounded-xl text-xs hover:text-gray-600 transition-colors"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}