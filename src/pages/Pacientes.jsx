import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { usePlano } from '../contexts/PlanoContext'
import ModalEnviarQuestionario from '../components/questionarios/ModalEnviarQuestionario'

export default function Pacientes({ userId }) {
  const navigate = useNavigate()
  const { isPro, isBeta } = usePlano()

  const [questionarios, setQuestionarios] = useState([])
  const [pacienteParaEnviarQuestionario, setPacienteParaEnviarQuestionario] = useState(null)

  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Motivo do modal de upgrade ('limite' ou 'exclusao')
  const [upgradeReason, setUpgradeReason] = useState('limite')

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

  useEffect(() => {
    if (!isBeta) return
    supabase.from('questionarios').select('id, titulo').order('titulo').then(({ data }) => setQuestionarios(data || []))
  }, [isBeta])

  const isFreeAccount = !isPro

  // Trava do 8º paciente (Cota de 7)
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Meus Pacientes</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Gerencie a lista de alunos e pacientes avaliados
            {isFreeAccount && (
              <span className="ml-2 font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 px-2 py-0.5 rounded border border-primary-100 dark:border-primary-900/40 text-xs">
                Uso: {pacientes.length}/7 Pacientes Grátis
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleOpenNovoPaciente}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors w-full sm:w-auto shadow-sm flex items-center justify-center gap-2"
        >
          <span>+ Novo Paciente</span>
          {isFreeAccount && <span className="text-[10px] bg-primary-800 px-1.5 py-0.5 rounded font-bold">({pacientes.length}/7)</span>}
        </button>
      </div>

      {/* BARRA DE BUSCA E FILTROS */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            type="text" 
            placeholder="Buscar paciente por nome ou e-mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
          />
        </div>

        <div className="flex flex-row gap-3">
          <select 
            value={filterSexo} 
            onChange={(e) => setFilterSexo(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-300 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="Todos">Sexo: Todos</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>

          <select 
            value={filterEsporte} 
            onChange={(e) => setFilterEsporte(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-300 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="Todos">Esporte: Todos</option>
            <option value="Pratica">Praticantes</option>
            <option value="NaoPratica">Sedentários</option>
          </select>
        </div>
      </div>

      {/* LISTA DE PACIENTES */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-gray-100 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-slate-400">Carregando pacientes...</div>
        ) : pacientes.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-slate-400 flex flex-col items-center justify-center">
            <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            <p>Nenhum paciente cadastrado ainda.</p>
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-slate-400">
            Nenhum paciente encontrado com esses filtros.
          </div>
        ) : (
          <>
            {/* VISÃO MOBILE */}
            <div className="block md:hidden">
              {pacientesFiltrados.map((p) => {
                const ePraticante = p.pratica_esporte === true || p.pratica_esporte === 'true'
                return (
                  <div key={p.id} className="p-4 border-b border-gray-100 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm uppercase">{p.nome_completo}</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          {p.sexo === 'M' ? 'Masculino' : 'Feminino'} • {p.telefone || p.email || '-'}
                        </p>
                      </div>
                      {ePraticante ? (
                        <span className="px-2 py-1 bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-[10px] font-semibold text-center leading-tight">
                          {p.modalidade_esportiva || 'Esporte'}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-full text-[10px] font-semibold text-center leading-tight">
                          Sedentário
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-50">
                      <button 
                        onClick={() => handleVerHistorico(p)}
                        className="py-2 px-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold text-xs rounded-lg text-center"
                      >
                        Histórico
                      </button>

                      <button 
                        onClick={() => navigate('/evolucao', { state: { paciente: p } })}
                        className="py-2 px-3 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 dark:bg-primary-900/20 rounded-lg transition-colors flex items-center justify-center gap-1 font-semibold text-xs text-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        Evolução
                      </button>

                      <button
                        onClick={() => navigate(`/pacientes/${p.id}/prontuario`)}
                        className="py-2 px-3 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors flex items-center justify-center gap-1 font-semibold text-xs text-center col-span-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        Prontuário
                      </button>

                      <button
                        onClick={() => navigate('/nova-avaliacao', { state: { paciente: p } })}
                        className="py-2 px-3 bg-primary-600 text-white hover:bg-primary-700 font-semibold text-xs rounded-lg text-center shadow-sm col-span-2"
                      >
                        + Nova Avaliação
                      </button>

                      <button 
                        onClick={() => handleEditPaciente(p)}
                        className="py-2 px-3 text-blue-600 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 dark:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-1 font-semibold text-xs text-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        Editar
                      </button>

                      <button 
                        onClick={() => handleDeletePaciente(p.id)}
                        className={`py-2 px-3 border rounded-lg transition-colors flex items-center justify-center gap-1 font-semibold text-xs text-center ${
                          isFreeAccount 
                            ? 'text-gray-400 dark:text-slate-400 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800' 
                            : 'text-red-600 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 dark:bg-red-900/20'
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
                  <tr className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs uppercase font-semibold border-b">
                    <th className="p-4">Nome</th>
                    <th className="p-4">Sexo</th>
                    <th className="p-4">Contato</th>
                    <th className="p-4">Esporte</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700 dark:text-slate-300">
                  {pacientesFiltrados.map((p) => {
                    const ePraticante = p.pratica_esporte === true || p.pratica_esporte === 'true'
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="p-4 font-medium text-gray-900 dark:text-slate-100 uppercase">{p.nome_completo}</td>
                        <td className="p-4">{p.sexo === 'M' ? 'Masculino' : 'Feminino'}</td>
                        <td className="p-4">{p.telefone || p.email || '-'}</td>
                        <td className="p-4">
                          {ePraticante ? (
                            <span className="px-2 py-1 bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              {p.modalidade_esportiva || 'Sim'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              Não
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-3 flex items-center justify-end gap-2">
                          <button onClick={() => handleVerHistorico(p)} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 font-medium text-xs underline">
                            Histórico
                          </button>

                          <button 
                            onClick={() => navigate('/evolucao', { state: { paciente: p } })} 
                            className="text-primary-700 dark:text-primary-400 font-medium text-xs border border-primary-100 dark:border-primary-900/40 bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 dark:bg-primary-900/20 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                            title="Ver Gráficos de Evolução"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                            Evolução
                          </button>

                          <button
                            onClick={() => navigate(`/pacientes/${p.id}/prontuario`)}
                            className="text-indigo-700 dark:text-indigo-400 font-medium text-xs border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                            title="Prontuário Clínico"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                            Prontuário
                          </button>

                          {isBeta && (
                            <button
                              onClick={() => setPacienteParaEnviarQuestionario(p)}
                              className="text-green-700 dark:text-green-400 font-medium text-xs border border-green-100 dark:border-green-900/40 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                              title="Enviar questionário por WhatsApp"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                              Questionário
                            </button>
                          )}

                          <button
                            onClick={() => navigate('/nova-avaliacao', { state: { paciente: p } })}
                            className="text-white font-medium text-xs bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded transition-colors"
                          >
                            + Avaliação
                          </button>

                          <button onClick={() => handleEditPaciente(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:bg-blue-900/20 rounded transition-colors inline-flex items-center" title="Editar Paciente">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                          </button>

                          <button 
                            onClick={() => handleDeletePaciente(p.id)} 
                            className={`p-1.5 rounded transition-colors inline-flex items-center ${
                              isFreeAccount 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:bg-red-900/20'
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

      {/* MODAL COMPLETO DE PACIENTE (CRIAÇÃO OU EDIÇÃO COM TODOS OS CAMPOS) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                {editingPacienteId ? 'Atualizar Paciente' : 'Cadastrar Paciente'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do paciente"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-gray-50/50 dark:bg-slate-800/70 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Sexo *
                  </label>
                  <select
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-gray-50/50 dark:bg-slate-800/70 focus:bg-white"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Etnia / Cor
                  </label>
                  <select
                    value={etnia}
                    onChange={(e) => setEtnia(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-gray-50/50 dark:bg-slate-800/70 focus:bg-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="Caucasiano">Caucasiano (Branco)</option>
                    <option value="Afrodescendente">Afrodescendente (Negro)</option>
                    <option value="Asiatico">Asiático</option>
                    <option value="Pardo">Pardo</option>
                    <option value="Indigena">Indígena</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Nacionalidade
                  </label>
                  <input
                    type="text"
                    value={nacionalidade}
                    onChange={(e) => setNacionalidade(e.target.value)}
                    placeholder="Brasileira"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(21) 99999-9999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Ocupação / Profissão
                </label>
                <input
                  type="text"
                  value={ocupacao}
                  onChange={(e) => setOcupacao(e.target.value)}
                  placeholder="Ex: Atleta, Estudante, Engenheiro..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={praticaEsporte}
                    onChange={(e) => setPraticaEsporte(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    Pratica atividade física ou esporte regularmente?
                  </span>
                </label>
              </div>

              {praticaEsporte && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-primary-50/50 dark:bg-primary-900/20 p-3 rounded-lg border border-primary-100 dark:border-primary-900/40">
                  <div>
                    <label className="block text-xs font-bold text-primary-800 dark:text-primary-300 uppercase tracking-wider mb-1">
                      Modalidade
                    </label>
                    <input
                      type="text"
                      value={modalidadeEsportiva}
                      onChange={(e) => setModalidadeEsportiva(e.target.value)}
                      placeholder="Ex: Musculação, Corrida..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-primary-800 dark:text-primary-300 uppercase tracking-wider mb-1">
                      Nível
                    </label>
                    <select
                      value={nivelPratica}
                      onChange={(e) => setNivelPratica(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-900"
                    >
                      <option value="">Selecione...</option>
                      <option value="Recreacional">Recreacional</option>
                      <option value="Amador">Amador</option>
                      <option value="Profissional">Profissional / Elite</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Observações
                </label>
                <textarea
                  rows="3"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Anotações adicionais..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingPacienteId ? 'Atualizar Paciente' : 'Salvar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DINÂMICO DE UPGRADE PRO */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-5 border border-primary-100 dark:border-primary-900/40 relative">
            
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 dark:bg-primary-900/20 text-primary-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
              {upgradeReason === 'limite' ? '🚀' : '🔒'}
            </div>

            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 uppercase">
                {upgradeReason === 'limite' ? 'Sua Consultoria Cresceu!' : 'Recurso do Plano Pro'}
              </h3>
              
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
                {upgradeReason === 'limite' ? (
                  <>Você atingiu o limite de <strong className="text-gray-800 dark:text-slate-100">7 pacientes cadastrados</strong> no Plano Gratuito. Faça o upgrade para o <strong className="text-primary-600">Plano Pro</strong> e libere vagas ilimitadas!</>
                ) : (
                  <>No Plano Gratuito, a exclusão de pacientes é desabilitada para preservação de histórico. Faça o upgrade para o <strong className="text-primary-600">Plano Pro</strong> para ter gerenciamento e exclusão completa!</>
                )}
              </p>
            </div>

            <div className="bg-primary-50/70 dark:bg-primary-900/20 p-4 rounded-xl text-left space-y-2 border border-primary-100 dark:border-primary-900/40">
              <span className="text-[10px] font-bold text-primary-800 dark:text-primary-300 uppercase tracking-wider block">O que você ganha no Plano Pro:</span>
              <ul className="text-xs text-gray-700 dark:text-slate-300 space-y-2 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-primary-600 font-bold">✓</span> Pacientes Ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary-600 font-bold">✓</span> Logomarca e Nome da sua Empresa nos Laudos
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary-600 font-bold">✓</span> Gerenciamento e Exclusão Completa de Registros
                </li>
              </ul>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => navigate('/meu-plano')}
                className="w-full py-3 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-700 shadow-md transition-colors"
              >
                Conhecer o Plano Pro (Apenas R$ 29,90/mês)
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2 text-xs font-semibold text-gray-400 dark:text-slate-400 hover:text-gray-600 transition-colors"
              >
                Continuar no Plano Gratuito por enquanto
              </button>
            </div>
          </div>
        </div>
      )}

      {pacienteParaEnviarQuestionario && (
        <ModalEnviarQuestionario
          questionarios={questionarios}
          pacientes={[]}
          pacientePreSelecionado={pacienteParaEnviarQuestionario}
          userId={userId}
          aoFechar={() => setPacienteParaEnviarQuestionario(null)}
          aoCriado={() => {}}
        />
      )}

      {/* MODAL DO HISTÓRICO DE AVALIAÇÕES */}
      {historicoPaciente && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Histórico: {historicoPaciente.nome_completo}</h3>
              <button onClick={() => setHistoricoPaciente(null)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded">✕</button>
            </div>

            {avaliacoesList.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-gray-500 dark:text-slate-400">
                <p className="text-sm">Nenhuma avaliação realizada ainda.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {avaliacoesList.map((a) => (
                  <div key={a.id} className="flex justify-between items-center p-3 border border-gray-100 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-slate-100">
                        {a.data_avaliacao ? new Date(a.data_avaliacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                      </p>
                      <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mt-0.5">{a.equacao_de_regressao_escolhida || 'Sem Equação'} • {a.peso_paciente}kg</p>
                    </div>

<div className="flex gap-2 items-center">
  {/* Ícone do Lápis */}
  <button
    onClick={() => navigate('/nova-avaliacao', { state: { paciente: historicoPaciente, avaliacaoIdParaEditar: a.id } })}
    className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 dark:bg-blue-900/20 rounded transition-colors"
    title="Editar Avaliação"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
  </button>

  {/* Ícone da Lixeira */}
  <button 
    onClick={() => handleDeleteAvaliacao(a.id)} 
    className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 dark:bg-red-900/20 rounded transition-colors" 
    title="Excluir Avaliação"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  </button>

  {/* Botão de Laudo */}
  <button
    onClick={() => navigate('/laudo-antropometrico', { state: { avaliacaoId: a.id } })}
    className="px-3 py-1.5 bg-primary-600 text-white rounded-md text-xs font-semibold hover:bg-primary-700 shadow-sm transition-colors ml-1"
  >
    Laudo
  </button>
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