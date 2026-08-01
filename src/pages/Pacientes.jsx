import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Pacientes({ userId }) {
  const navigate = useNavigate()

  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  
  // Estado para identificar o motivo do modal de upgrade ('limite' ou 'exclusao')
  const [upgradeReason, setUpgradeReason] = useState('limite')

  // Status do plano do avaliador
  const [planoStatus, setPlanoStatus] = useState('gratis') // 'gratis' ou 'pro'/'ativo'

  const [historicoPaciente, setHistoricoPaciente] = useState(null)
  const [avaliacoesList, setAvaliacoesList] = useState([])

  // --- ESTADOS DE BUSCA E FILTROS ---
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSexo, setFilterSexo] = useState('Todos')
  const [filterEsporte, setFilterEsporte] = useState('Todos')

  // Estado para controlar se estamos editando ou criando
  const [editingPacienteId, setEditingPacienteId] = useState(null)

  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [sexo, setSexo] = useState('M')
  const [etnia, setEtnia] = useState('')
  const [nacionalidade, setNacionalidade] = useState('Brasileira')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [ocupacao, setOcupacao] = useState('')
  const [praticaEsporte, setPraticaEsporte] = useState(false)
  const [modalidadeEsportiva, setModalidadeEsportiva] = useState('')
  const [nivelPratica, setNivelPratica] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchPacientes = async () => {
    setLoading(true)

    const { data: authUser } = await supabase.auth.getUser()
    const currentAuthId = authUser?.user?.id || userId

    if (currentAuthId) {
      const { data: avalData } = await supabase
        .from('avaliadores')
        .select('plano_status')
        .eq('auth_id', currentAuthId)
        .maybeSingle()

      if (avalData?.plano_status) {
        setPlanoStatus(avalData.plano_status.toLowerCase())
      } else {
        setPlanoStatus('gratis')
      }
    }

    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar pacientes:', error)
    } else {
      setPacientes(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPacientes()
  }, [])

  const isFreeAccount = planoStatus !== 'pro' && planoStatus !== 'ativo'

  // 🛡️ Trava do 8º paciente (Cota de 7)
  const handleOpenNovoPaciente = () => {
    if (isFreeAccount && pacientes.length >= 7) {
      setUpgradeReason('limite')
      setShowUpgradeModal(true)
      return
    }

    setEditingPacienteId(null)
    setNome('')
    setDataNascimento('')
    setSexo('M')
    setEtnia('')
    setNacionalidade('Brasileira')
    setEmail('')
    setTelefone('')
    setOcupacao('')
    setPraticaEsporte(false)
    setModalidadeEsportiva('')
    setNivelPratica('')
    setObservacoes('')
    setShowModal(true)
  }

  const handleEditPaciente = (p) => {
    setEditingPacienteId(p.id)
    setNome(p.nome_completo || '')
    setDataNascimento(p.data_nascimento || '')
    setSexo(p.sexo || 'M')
    setEtnia(p.etnia || '')
    setNacionalidade(p.nacionalidade || 'Brasileira')
    setEmail(p.email || '')
    setTelefone(p.telefone || '')
    setOcupacao(p.ocupacao || '')
    setPraticaEsporte(p.pratica_esporte === true || p.pratica_esporte === 'true')
    setModalidadeEsportiva(p.modalidade_esportiva || '')
    setNivelPratica(p.nivel_pratica || '')
    setObservacoes(p.observacoes || '')
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!editingPacienteId && isFreeAccount && pacientes.length >= 7) {
      setUpgradeReason('limite')
      setShowUpgradeModal(true)
      return
    }

    setSaving(true)

    const payload = {
      id_avaliador: userId,
      nome_completo: nome,
      data_nascimento: dataNascimento || null,
      sexo,
      etnia,
      nacionalidade,
      email,
      telefone,
      ocupacao,
      pratica_esporte: praticaEsporte,
      modalidade_esportiva: praticaEsporte ? modalidadeEsportiva : null,
      nivel_pratica: praticaEsporte ? nivelPratica : null,
      observacoes
    }

    if (editingPacienteId) {
      const { error } = await supabase
        .from('pacientes')
        .update(payload)
        .eq('id', editingPacienteId)

      if (error) {
        alert('Erro ao atualizar paciente: ' + error.message)
      } else {
        setShowModal(false)
        fetchPacientes()
      }
    } else {
      const { error } = await supabase.from('pacientes').insert([payload])

      if (error) {
        alert('Erro ao cadastrar paciente: ' + error.message)
      } else {
        setShowModal(false)
        fetchPacientes()
      }
    }
    setSaving(false)
  }

  const handleVerHistorico = async (paciente) => {
    setHistoricoPaciente(paciente)
    const { data } = await supabase
      .from('avaliacoes')
      .select('id, data_avaliacao, equacao_de_regressao_escolhida, peso_paciente')
      .eq('id_paciente', paciente.id)
      .order('data_avaliacao', { ascending: false })

    setAvaliacoesList(data || [])
  }

  const handleDeleteAvaliacao = async (idAvaliacao) => {
    const digitado = window.prompt("⚠️ Ação irreversível!\n\nPara confirmar a exclusão desta avaliação, digite exatamente a palavra APAGAR:")

    if (digitado === "APAGAR") {
      try {
        await supabase.from('dados_calculados').delete().eq('id_avaliacao', idAvaliacao)
        const { error } = await supabase.from('avaliacoes').delete().eq('id', idAvaliacao)
        if (error) throw error

        setAvaliacoesList(avaliacoesList.filter(a => a.id !== idAvaliacao))
        alert('Avaliação excluída com sucesso!')
      } catch (err) {
        alert('Erro ao excluir avaliação: ' + err.message)
      }
    } else if (digitado !== null) {
      alert('Palavra incorreta. A exclusão foi cancelada.')
    }
  }

  // 🛡️ Trava de exclusão de pacientes para contas grátis
  const handleDeletePaciente = async (idPaciente) => {
    if (isFreeAccount) {
      setUpgradeReason('exclusao')
      setShowUpgradeModal(true)
      return
    }

    const digitado = window.prompt("⚠️ ATENÇÃO: Isso apagará o paciente e todo o seu histórico!\n\nDigite APAGAR para confirmar:")

    if (digitado === "APAGAR") {
      const { error } = await supabase.from('pacientes').delete().eq('id', idPaciente)
      if (error) {
        alert('Erro ao excluir paciente: ' + error.message)
      } else {
        fetchPacientes()
        alert('Paciente excluído com sucesso!')
      }
    } else if (digitado !== null) {
      alert('Palavra incorreta. A exclusão foi cancelada.')
    }
  }

  // --- LÓGICA DE FILTRAGEM ---
  const pacientesFiltrados = pacientes.filter(p => {
    const termo = searchTerm.toLowerCase();

    const matchBusca = 
      p.nome_completo?.toLowerCase().includes(termo) || 
      p.email?.toLowerCase().includes(termo);

    const matchSexo = filterSexo === 'Todos' || p.sexo === filterSexo;

    const isPraticante = p.pratica_esporte === true || p.pratica_esporte === 'true';
    const matchEsporte = filterEsporte === 'Todos' ||
                         (filterEsporte === 'Pratica' && isPraticante) ||
                         (filterEsporte === 'NaoPratica' && !isPraticante);

    return matchBusca && matchSexo && matchEsporte;
  });

  return (
    <div className="space-y-6 pb-10">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Meus Pacientes</h2>
          <p className="text-sm text-gray-500">
            Gerencie a lista de alunos e pacientes avaliados
            {isFreeAccount && (
              <span className="ml-2 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-xs">
                Uso: {pacientes.length}/7 Pacientes Grátis
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleOpenNovoPaciente}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm transition-colors w-full sm:w-auto shadow-sm flex items-center justify-center gap-2"
        >
          <span>+ Novo Paciente</span>
          {isFreeAccount && <span className="text-[10px] bg-emerald-800 px-1.5 py-0.5 rounded font-bold">({pacientes.length}/7)</span>}
        </button>
      </div>

      {/* BARRA DE BUSCA E FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            type="text" 
            placeholder="Buscar paciente por nome ou e-mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
          />
        </div>

        <div className="flex flex-row gap-3">
          <select 
            value={filterSexo} 
            onChange={(e) => setFilterSexo(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="Todos">Sexo: Todos</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>

          <select 
            value={filterEsporte} 
            onChange={(e) => setFilterEsporte(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="Todos">Esporte: Todos</option>
            <option value="Pratica">Praticantes</option>
            <option value="NaoPratica">Sedentários</option>
          </select>
        </div>
      </div>

      {/* LISTA DE PACIENTES */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando pacientes...</div>
        ) : pacientes.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
            <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            <p>Nenhum paciente cadastrado ainda.</p>
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum paciente encontrado com esses filtros.
          </div>
        ) : (
          <>
            {/* VISÃO MOBILE */}
            <div className="block md:hidden">
              {pacientesFiltrados.map((p) => {
                const ePraticante = p.pratica_esporte === true || p.pratica_esporte === 'true'
                return (
                  <div key={p.id} className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm uppercase">{p.nome_completo}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {p.sexo === 'M' ? 'Masculino' : 'Feminino'} • {p.telefone || p.email || '-'}
                        </p>
                      </div>
                      {ePraticante ? (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-semibold text-center leading-tight">
                          {p.modalidade_esportiva || 'Esporte'}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded-full text-[10px] font-semibold text-center leading-tight">
                          Sedentário
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-50">
                      <button 
                        onClick={() => handleVerHistorico(p)}
                        className="py-2 px-3 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-xs rounded-lg text-center"
                      >
                        Histórico
                      </button>

                      <button 
                        onClick={() => navigate('/evolucao', { state: { paciente: p } })}
                        className="py-2 px-3 text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-1 font-semibold text-xs text-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        Evolução
                      </button>

                      <button 
                        onClick={() => navigate('/nova-avaliacao', { state: { paciente: p } })}
                        className="py-2 px-3 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs rounded-lg text-center shadow-sm col-span-2"
                      >
                        + Nova Avaliação
                      </button>

                      <button 
                        onClick={() => handleEditPaciente(p)}
                        className="py-2 px-3 text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1 font-semibold text-xs text-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        Editar
                      </button>

                      <button 
                        onClick={() => handleDeletePaciente(p.id)}
                        className={`py-2 px-3 border rounded-lg transition-colors flex items-center justify-center gap-1 font-semibold text-xs text-center ${
                          isFreeAccount 
                            ? 'text-gray-400 border-gray-200 bg-gray-50' 
                            : 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100'
                        }`}
                      >
                        {isFreeAccount && <span>🔒</span>}
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        Excluir
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* VISÃO DESKTOP */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b">
                    <th className="p-4">Nome</th>
                    <th className="p-4">Sexo</th>
                    <th className="p-4">Contato</th>
                    <th className="p-4">Esporte</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {pacientesFiltrados.map((p) => {
                    const ePraticante = p.pratica_esporte === true || p.pratica_esporte === 'true'
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-gray-900 uppercase">{p.nome_completo}</td>
                        <td className="p-4">{p.sexo === 'M' ? 'Masculino' : 'Feminino'}</td>
                        <td className="p-4">{p.telefone || p.email || '-'}</td>
                        <td className="p-4">
                          {ePraticante ? (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              {p.modalidade_esportiva || 'Sim'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              Não
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-3 flex items-center justify-end gap-2">
                          <button onClick={() => handleVerHistorico(p)} className="text-gray-600 hover:text-gray-900 font-medium text-xs underline">
                            Histórico
                          </button>

                          <button 
                            onClick={() => navigate('/evolucao', { state: { paciente: p } })} 
                            className="text-emerald-700 font-medium text-xs border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                            title="Ver Gráficos de Evolução"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                            Evolução
                          </button>

                          <button 
                            onClick={() => navigate('/nova-avaliacao', { state: { paciente: p } })} 
                            className="text-white font-medium text-xs bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded transition-colors"
                          >
                            + Avaliação
                          </button>

                          <button onClick={() => handleEditPaciente(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors inline-flex items-center" title="Editar Paciente">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                          </button>

                          <button 
                            onClick={() => handleDeletePaciente(p.id)} 
                            className={`p-1.5 rounded transition-colors inline-flex items-center ${
                              isFreeAccount 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-red-500 hover:bg-red-50'
                            }`} 
                            title={isFreeAccount ? "Exclusão bloqueada no plano Grátis" : "Excluir Paciente"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL PACIENTE (CRIAÇÃO OU EDIÇÃO) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {editingPacienteId ? 'Atualizar Paciente' : 'Cadastrar Paciente'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nome Completo *</label>
                <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do paciente" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Data de Nascimento</label>
                  <input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-gray-50/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Sexo *</label>
                  <select value={sexo} onChange={(e) => setSexo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-gray-50/50">
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 shadow disabled:opacity-50">
                  {saving ? 'Salvando...' : editingPacienteId ? 'Atualizar Paciente' : 'Salvar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 MODAL DINÂMICO DE UPGRADE PRO (AJUSTADO E CONTEXTUALIZADO) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-5 border border-emerald-100 relative">
            
            {/* ÍCONE ADAPTATIVO */}
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
              {upgradeReason === 'limite' ? '🚀' : '🔒'}
            </div>

            {/* MENSAGEM DINÂMICA DE ACORDO COM A AÇÃO */}
            <div>
              <h3 className="text-xl font-black text-gray-900 uppercase">
                {upgradeReason === 'limite' ? 'Sua Consultoria Cresceu!' : 'Recurso do Plano Pro'}
              </h3>
              
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {upgradeReason === 'limite' ? (
                  <>Você atingiu o limite de <strong className="text-gray-800">7 pacientes cadastrados</strong> no Plano Gratuito. Faça o upgrade para o <strong className="text-emerald-600">Plano Pro</strong> e libere vagas ilimitadas!</>
                ) : (
                  <>No Plano Gratuito, a exclusão de pacientes é desabilitada para preservação de histórico. Faça o upgrade para o <strong className="text-emerald-600">Plano Pro</strong> para ter gerenciamento e exclusão completa!</>
                )}
              </p>
            </div>

            {/* LISTA DE BENEFÍCIOS DO PLANO PRO */}
            <div className="bg-emerald-50/70 p-4 rounded-xl text-left space-y-2 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">O que você ganha no Plano Pro:</span>
              <ul className="text-xs text-gray-700 space-y-2 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Pacientes Ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Logomarca e Nome da sua Empresa nos Laudos
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Gerenciamento e Exclusão Completa de Registros
                </li>
              </ul>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => navigate('/configuracoes?aba=plano')}
                className="w-full py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 shadow-md transition-colors"
              >
                Conhecer o Plano Pro (Apenas R$ 29,90/mês)
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Continuar no Plano Gratuito por enquanto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO HISTÓRICO DE AVALIAÇÕES */}
      {historicoPaciente && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-800">Histórico: {historicoPaciente.nome_completo}</h3>
              <button onClick={() => setHistoricoPaciente(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded">✕</button>
            </div>

            {avaliacoesList.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-gray-500">
                <p className="text-sm">Nenhuma avaliação realizada ainda.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {avaliacoesList.map((a) => (
                  <div key={a.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {a.data_avaliacao ? new Date(a.data_avaliacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                      </p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{a.equacao_de_regressao_escolhida || 'Sem Equação'} • {a.peso_paciente}kg</p>
                    </div>

                    <div className="flex gap-2 items-center">
                      <button onClick={() => navigate('/nova-avaliacao', { state: { paciente: historicoPaciente, avaliacaoIdParaEditar: a.id } })} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded">Editar</button>
                      <button onClick={() => handleDeleteAvaliacao(a.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded">Excluir</button>
                      <button onClick={() => navigate('/laudo-antropometrico', { state: { avaliacaoId: a.id } })} className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-semibold">Laudo</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}