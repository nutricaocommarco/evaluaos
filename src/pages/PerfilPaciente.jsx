import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from '../components/SidebarPaciente'
import GeradorPdfCompleto from '../components/GeradorPdfCompleto'
import InterruptorVisibilidade from '../components/InterruptorVisibilidade'
import { User, Mail, Phone, Briefcase, Activity, FileText, TrendingUp, CreditCard, Pencil, FileDown, History, PlusCircle, ClipboardList, Link2, Check, Stethoscope, Calendar, Settings, Sun, Moon, MonitorSmartphone } from 'lucide-react'

function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null
  const nasc = new Date(dataNascimento + 'T12:00:00')
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-BR')
}

const CAMPOS_VAZIOS = {
  nome_completo: '', data_nascimento: '', sexo: 'M', etnia: '', nacionalidade: 'Brasileira',
  email: '', telefone: '', ocupacao: '', pratica_esporte: false, modalidade_esportiva: '', nivel_pratica: '', observacoes: '',
}

function CardInfo({ icone: Icone, label, valor }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center shrink-0 text-gray-400 dark:text-slate-500">
        <Icone size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{valor || '-'}</p>
      </div>
    </div>
  )
}

export default function PerfilPaciente({ userId }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [itemAtivo] = useState('perfil')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(CAMPOS_VAZIOS)
  const [saving, setSaving] = useState(false)
  const [showGeradorPdf, setShowGeradorPdf] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)

  const [showHistorico, setShowHistorico] = useState(false)
  const [avaliacoesList, setAvaliacoesList] = useState([])

  const carregarPaciente = async () => {
    setLoading(true)
    const { data } = await supabase.from('pacientes').select('*').eq('id', id).maybeSingle()
    setPaciente(data || null)
    setLoading(false)
  }

  useEffect(() => {
    carregarPaciente()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const abrirEdicao = () => {
    setForm({
      nome_completo: paciente.nome_completo || '',
      data_nascimento: paciente.data_nascimento || '',
      sexo: paciente.sexo || 'M',
      etnia: paciente.etnia || '',
      nacionalidade: paciente.nacionalidade || 'Brasileira',
      email: paciente.email || '',
      telefone: paciente.telefone || '',
      ocupacao: paciente.ocupacao || '',
      pratica_esporte: paciente.pratica_esporte === true || paciente.pratica_esporte === 'true',
      modalidade_esportiva: paciente.modalidade_esportiva || '',
      nivel_pratica: paciente.nivel_pratica || '',
      observacoes: paciente.observacoes || '',
    })
    setShowModal(true)
  }

  const handleCopiarLinkArea = async () => {
    const link = `${window.location.origin}/area/${paciente.token_publico}`
    await navigator.clipboard.writeText(link)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  // null = segue o tema configurado no perfil do nutricionista (padrão de
  // hoje); true/false trava claro/escuro só no app desse paciente.
  const handleAlterarTema = async (valor) => {
    setPaciente((prev) => ({ ...prev, tema_dark_mode: valor }))
    const { error } = await supabase.from('pacientes').update({ tema_dark_mode: valor }).eq('id', paciente.id)
    if (error) alert('Erro ao salvar tema: ' + error.message)
  }

  const abrirHistorico = async () => {
    setShowHistorico(true)
    const { data } = await supabase
      .from('avaliacoes')
      .select('id, data_avaliacao, equacao_de_regressao_escolhida, peso_paciente, visivel_paciente')
      .eq('id_paciente', id)
      .order('data_avaliacao', { ascending: false })
    setAvaliacoesList(data || [])
  }

  const toggleVisivelAvaliacao = async (avaliacao) => {
    const novoValor = !avaliacao.visivel_paciente
    const { error } = await supabase.from('avaliacoes').update({ visivel_paciente: novoValor }).eq('id', avaliacao.id)
    if (error) { alert('Erro ao atualizar visibilidade: ' + error.message); return }
    setAvaliacoesList((prev) => prev.map((a) => (a.id === avaliacao.id ? { ...a, visivel_paciente: novoValor } : a)))
  }

  const handleExcluirAvaliacao = async (idAvaliacao) => {
    const digitado = window.prompt('⚠️ Ação irreversível!\n\nPara confirmar a exclusão desta avaliação, digite exatamente a palavra APAGAR:')
    if (digitado !== 'APAGAR') {
      if (digitado !== null) alert('Palavra incorreta. A exclusão foi cancelada.')
      return
    }
    try {
      await supabase.from('dados_calculados').delete().eq('id_avaliacao', idAvaliacao)
      const { error } = await supabase.from('avaliacoes').delete().eq('id', idAvaliacao)
      if (error) throw error
      setAvaliacoesList((prev) => prev.filter((a) => a.id !== idAvaliacao))
    } catch (err) {
      alert('Erro ao excluir avaliação: ' + err.message)
    }
  }

  const handleSalvar = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      data_nascimento: form.data_nascimento || null,
      modalidade_esportiva: form.pratica_esporte ? form.modalidade_esportiva : null,
      nivel_pratica: form.pratica_esporte ? form.nivel_pratica : null,
    }
    const { error } = await supabase.from('pacientes').update(payload).eq('id', paciente.id)
    setSaving(false)
    if (error) { alert('Erro ao atualizar paciente: ' + error.message); return }
    setShowModal(false)
    carregarPaciente()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-primary-600 font-bold animate-pulse">Carregando perfil...</p>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <p className="text-gray-600 dark:text-slate-300 font-semibold">Paciente não encontrado.</p>
        <button onClick={() => navigate('/pacientes')} className="text-primary-600 font-semibold text-sm hover:underline">
          ← Voltar para Pacientes
        </button>
      </div>
    )
  }

  const idade = calcularIdade(paciente.data_nascimento)

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
      <SidebarPaciente paciente={paciente} itemAtivo={itemAtivo} onSelecionarItem={() => {}} />

      <div className="flex-1 min-w-0 space-y-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 shrink-0">
              <User size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black text-gray-800 dark:text-slate-100 truncate">{paciente.nome_completo}</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {paciente.sexo === 'M' ? 'Masculino' : 'Feminino'}{idade != null ? ` · ${idade} anos` : ''} · Paciente desde {formatarData(paciente.created_at?.slice(0, 10))}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCopiarLinkArea}
              title="Copiar link da Área do Paciente pra mandar pro paciente"
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              {linkCopiado ? <Check size={15} /> : <Link2 size={15} />} {linkCopiado ? 'Copiado!' : 'Link da Área do Paciente'}
            </button>
            <button
              onClick={() => setShowGeradorPdf(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileDown size={15} /> Gerar PDF
            </button>
            <button
              onClick={abrirEdicao}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors"
            >
              <Pencil size={14} /> Editar Dados
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4">Dados Pessoais</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CardInfo icone={Mail} label="E-mail" valor={paciente.email} />
            <CardInfo icone={Phone} label="Telefone" valor={paciente.telefone} />
            <CardInfo icone={Calendar} label="Data de Nascimento" valor={paciente.data_nascimento ? `${formatarData(paciente.data_nascimento)}${idade != null ? ` (${idade} anos)` : ''}` : null} />
            <CardInfo icone={Briefcase} label="Ocupação" valor={paciente.ocupacao} />
            <CardInfo icone={User} label="Etnia / Nacionalidade" valor={[paciente.etnia, paciente.nacionalidade].filter(Boolean).join(' · ')} />
            {(paciente.pratica_esporte === true || paciente.pratica_esporte === 'true') && (
              <CardInfo icone={Activity} label="Esporte" valor={[paciente.modalidade_esportiva, paciente.nivel_pratica].filter(Boolean).join(' · ') || 'Sim'} />
            )}
          </div>
          {paciente.observacoes && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Observações</p>
              <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{paciente.observacoes}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Settings size={12} /> Configuração do App do Paciente
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
            Tema do portal desse paciente — independente do tema que você usa no seu painel.
          </p>
          <div className="flex rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden w-fit">
            <button
              onClick={() => handleAlterarTema(null)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
                paciente.tema_dark_mode == null
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <MonitorSmartphone size={13} /> Padrão
            </button>
            <button
              onClick={() => handleAlterarTema(false)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-l border-gray-200 dark:border-slate-700 transition-colors ${
                paciente.tema_dark_mode === false
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sun size={13} /> Claro
            </button>
            <button
              onClick={() => handleAlterarTema(true)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-l border-gray-200 dark:border-slate-700 transition-colors ${
                paciente.tema_dark_mode === true
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <Moon size={13} /> Escuro
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/nova-avaliacao', { state: { paciente } })}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3 text-left hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 shrink-0">
              <PlusCircle size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-slate-100">Nova Avaliação</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Registrar uma nova avaliação antropométrica</p>
            </div>
          </button>

          <button
            onClick={() => navigate(`/pacientes/${paciente.id}/prontuario`, { state: { abrirNovaConsulta: true } })}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3 text-left hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shrink-0">
              <Stethoscope size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-slate-100">Nova Consulta</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Registrar uma consulta no Prontuário</p>
            </div>
          </button>

          <button
            onClick={abrirHistorico}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3 text-left hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-slate-400 shrink-0">
              <History size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-slate-100">Histórico de Avaliações</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Ver, editar ou excluir avaliações antigas</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/evolucao', { state: { paciente } })}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3 text-left hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 shrink-0">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-slate-100">Gráficos de Evolução</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Ver comparativo antropométrico</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/agenda', { state: { pacientePreSelecionado: paciente } })}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3 text-left hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-slate-100">Agendar Consulta</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Marcar horário na Agenda</p>
            </div>
          </button>

          <button
            onClick={() => navigate(`/pacientes/${paciente.id}/questionarios`)}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3 text-left hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 shrink-0">
              <ClipboardList size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-slate-100">Questionários</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Enviar e ver respostas</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/financeiro', { state: { pacientePreSelecionado: paciente } })}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3 text-left hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 shrink-0">
              <CreditCard size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-slate-100">Pagamentos</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Ver histórico e registrar</p>
            </div>
          </button>
        </div>

        <p className="text-[11px] text-gray-400 dark:text-slate-500 text-center flex items-center justify-center gap-1">
          <FileText size={12} /> Histórico de avaliações, planos e documentos ficam nos itens do menu ao lado.
        </p>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Editar Dados do Paciente</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSalvar} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Nome Completo</label>
                <input
                  type="text" required
                  value={form.nome_completo}
                  onChange={(e) => setForm({ ...form, nome_completo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Nascimento</label>
                  <input
                    type="date"
                    value={form.data_nascimento}
                    onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Sexo</label>
                  <select
                    value={form.sexo}
                    onChange={(e) => setForm({ ...form, sexo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Telefone</label>
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Etnia</label>
                  <input
                    type="text"
                    value={form.etnia}
                    onChange={(e) => setForm({ ...form, etnia: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Nacionalidade</label>
                  <input
                    type="text"
                    value={form.nacionalidade}
                    onChange={(e) => setForm({ ...form, nacionalidade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Ocupação</label>
                <input
                  type="text"
                  value={form.ocupacao}
                  onChange={(e) => setForm({ ...form, ocupacao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={form.pratica_esporte}
                  onChange={(e) => setForm({ ...form, pratica_esporte: e.target.checked })}
                  className="w-4 h-4 accent-primary-600"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Pratica esporte</span>
              </label>

              {form.pratica_esporte && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Modalidade</label>
                    <input
                      type="text"
                      value={form.modalidade_esportiva}
                      onChange={(e) => setForm({ ...form, modalidade_esportiva: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Nível</label>
                    <input
                      type="text"
                      value={form.nivel_pratica}
                      onChange={(e) => setForm({ ...form, nivel_pratica: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Observações</label>
                <textarea
                  rows={3}
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGeradorPdf && (
        <GeradorPdfCompleto
          paciente={paciente}
          avaliadorUserId={userId}
          aoFechar={() => setShowGeradorPdf(false)}
        />
      )}

      {showHistorico && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Histórico: {paciente.nome_completo}</h3>
              <button onClick={() => setShowHistorico(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded">✕</button>
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
                      <InterruptorVisibilidade ativo={a.visivel_paciente} onToggle={() => toggleVisivelAvaliacao(a)} />
                      <button
                        onClick={() => navigate('/nova-avaliacao', { state: { paciente, avaliacaoIdParaEditar: a.id } })}
                        className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 dark:bg-blue-900/20 rounded transition-colors"
                        title="Editar Avaliação"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleExcluirAvaliacao(a.id)}
                        className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 dark:bg-red-900/20 rounded transition-colors"
                        title="Excluir Avaliação"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
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
