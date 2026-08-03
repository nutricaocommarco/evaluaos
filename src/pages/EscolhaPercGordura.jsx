import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import * as Eq from '../utils/equacoes'
import { recomendarEquacaoIdeal } from '../utils/EngineRecomendacaoEquacoes'

const listaFeminina = [
  { nome: 'Durnin et al. (1974) - 4skf', func: Eq.calcularFemDurnin1974 },
  { nome: 'Jackson et al. (1980) - 3skf', func: Eq.calcularFemJacksonPollock1980_3skf },
  { nome: 'Petroski (1995) - 4skf', func: Eq.calcularFemPetroski1995_4skf },
  { nome: 'Guedes (1985) - 3skf', func: Eq.calcularFemGuedes1985_3skf },
  { nome: 'Withers et al. (1987) - 4skf', func: Eq.calcularFemWithers1987_4skf },
  { nome: 'Withers et al. (1987) - 6skf', func: Eq.calcularFemWithers1987_6skf },
  { nome: 'Slaughter et al. (1988) - 2skf', func: Eq.calcularFemSlaughter1988_2skf },
  { nome: 'Yuhasz (1974) - 6skf', func: Eq.calcularFemYuhasz1974_6skf },
  { nome: 'Katch & McArdle (1973) - 3skf', func: Eq.calcularFemKatchMcArdle1973_3skf },
  { nome: 'Sloan et al. (1962) - 2skf', func: Eq.calcularFemSloan1962_2skf },
  { nome: 'Wilmore & Behnke (1970) - 3skf', func: Eq.calcularFemWilmoreBehnke1970_3skf },
  { nome: 'Thorland et al. (1984) - Generalizada', func: Eq.calcularFemThorlandGeneralizada1984 },
  { nome: 'Lewis et al. (1978) - Dobras e Perímetros', func: Eq.calcularFemLewis1978 },
  { nome: 'Jackson et al. (1980) - 4skf', func: Eq.calcularFemJacksonPollock1980_4skf },
  { nome: 'Tran & Weltman (1989) - Perímetros', func: Eq.calcularFemTranWeltman1989_Perimetros },
  { nome: 'Weltman et al. (1988) - Perímetros', func: Eq.calcularFemWeltman1988_Perimetros },
  { nome: 'Woolcott & Bergman 2018', func: Eq.calcularFemWoolcottBergman2018 },
  { nome: 'Deurenberg et al. (1991) - Por IMC', func: Eq.calcularFemDeurenberg1991_IMC },
  { nome: 'Mitchell et al. 2020 7skd ISAK', func: Eq.calcularFemMitchell2020_7skf },
  { nome: 'Eston et al. 2005 3skf ISAK', func: Eq.calcularFemEston2005_3skf },
  { nome: 'Evans et al. 2005 3skf Brancas', func: Eq.calcularFemEvans2005_3skf_Brancas },
  { nome: 'Evans et al. 2005 3skf Negras', func: Eq.calcularFemEvans2005_3skf_Negras },
  { nome: 'Durnin 4skf (menor de 17 anos)', func: Eq.calcularFemDurnin1974_Menor17 },
  { nome: 'Durnin 4skf (16-19 anos)', func: Eq.calcularFemDurnin1974_16a19anos },
  { nome: 'Durnin 4skf (20-29 anos)', func: Eq.calcularFemDurnin1974_20a29anos },
  { nome: 'Durnin 4skf (30-39 anos)', func: Eq.calcularFemDurnin1974_30a39anos },
  { nome: 'Durnin 4skf (40-49 anos)', func: Eq.calcularFemDurnin1974_40a49anos },
  { nome: 'Durnin 4skf - Variação F (50+ anos Alt)', func: Eq.calcularFemDurnin1974_50a58anos },
  { nome: 'Durnin  et al. 1974 1skf', func: Eq.calcularFemDurnin1974_1skf },
  { nome: 'Durnin  et al. 1974 2skf', func: Eq.calcularFemDurnin1974_2skf },
  { nome: 'Nagamine & Suzuki, 1964 2skf', func: Eq.calcularFemNagamineSuzuki1964_2skf },
  { nome: 'Deurenberg et al. 1990 pré-puberes', func: Eq.calcularFemDeurenberg1990_PrePuberes },
  { nome: 'Deurenberg et al. 1990 púberes', func: Eq.calcularFemDeurenberg1990_Puberes },
  { nome: 'Deurenberg et al. 1990 pós-puberes', func: Eq.calcularFemDeurenberg1990_PosPuberes },
  { nome: 'Ortiz-Hernández et al. 2016', func: Eq.calcularFemOrtizHernandez2016 }
];

const listaMasculina = [
  { nome: 'Mitchell et al. (2020) - 7skf ISAK', func: Eq.calcularMascMitchell2020_7skd },
  { nome: 'Woolcott & Bergman (2018) - RFM', func: Eq.calcularMascWoolcottBergman2018 },
  { nome: 'Guedes (1985) - 3skf', func: Eq.calcularMascGuedes1985_3skd },
  { nome: 'Deurenberg et al. (1991) - Por IMC', func: Eq.calcularMascDeurenberg1991_IMC },
  { nome: 'Weltman et al. (1987) - Por Perímetros', func: Eq.calcularMascWeltman1987 },
  { nome: 'Petroski (1995) - 4skf', func: Eq.calcularMascPetroski1995_4skd },
  { nome: 'Stewart & Hannan (2000) - 2skf', func: Eq.calcularMascStewartHannan_2skd },
  { nome: 'Faulkner (1968) - 4skf', func: Eq.calcularMascFaulkner1968_4skd },
  { nome: 'Reilly et al. (2009) - 4skf ISAK', func: Eq.calcularMascReilly2009_4skd },
  { nome: 'Evans et al. (2005) - 3skf (Brancos)', func: Eq.calcularMascEvans2005_3skd_White },
  { nome: 'Evans et al. (2005) - 3skf (Negros)', func: Eq.calcularMascEvans2005_3skd_Black },
  { nome: 'Katch & McArdle (1973) - 3skf', func: Eq.calcularMascKatchMcArdle1973_3skd },
  { nome: 'Withers et al. (1987) - 7skf', func: Eq.calcularMascWithers1987_7skd },
  { nome: 'Slaughter et al. (1988) - 2skf', func: Eq.calcularMascSlaughter1988_2skd },
  { nome: 'Yuhasz (1974) - 6skf', func: Eq.calcularMascYuhasz1974_6skd },
  { nome: 'Wilmore & Behnke (1969) - 2skf', func: Eq.calcularMascWilmoreBehnke1969_2skd },
  { nome: 'Boileau et al. (1985) - 2skf', func: Eq.calcularMascBoileau1985_2skd },
  { nome: 'Deurenberg et al. (1990) - Pré-Púberes', func: Eq.calcularMascDeurenberg1990_4skd_PrePuberes },
  { nome: 'Deurenberg et al. (1990) - Púberes', func: Eq.calcularMascDeurenberg1990_4skd_Puberes },
  { nome: 'Deurenberg et al. (1990) - Pós-Púberes', func: Eq.calcularMascDeurenberg1990_4skd_PosPuberes },
  { nome: 'Eston et al. (2005) - 2skf ISAK', func: Eq.calcularMascEston2005_2skd },
  { nome: 'Eston et al. (2005) - 6skf ISAK', func: Eq.calcularMascEston2005_6skd },
  { nome: 'Durnin et al. (1974) - 4skf (17 a 72 anos)', func: Eq.calcularMascDurnin1974_17a72anos },
  { nome: 'Durnin et al. (1974) - 4skf (17 a 19 anos)', func: Eq.calcularMascDurnin1974_17a19anos },
  { nome: 'Durnin et al. (1974) - 4skf (20 a 29 anos)', func: Eq.calcularMascDurnin1974_20a29anos },
  { nome: 'Durnin et al. (1974) - 4skf (30 a 39 anos)', func: Eq.calcularMascDurnin1974_30a39anos },
  { nome: 'Durnin et al. (1974) - 4skf (40 a 49 anos)', func: Eq.calcularMascDurnin1974_40a49anos },
  { nome: 'Durnin et al. (1974) - 4skf (50 a 72 anos)', func: Eq.calcularMascDurnin1974_50a72anos },
  { nome: 'Durnin et al. (1974) - 1skf (Só Tríceps)', func: Eq.calcularMascDurnin1974_1skd },
  { nome: 'Durnin & Rahaman (1967) - 4skf (< 17 anos)', func: Eq.calcularMascDurninRahaman1967_4skd },
  { nome: 'Forsyth & Sinning (1973) - 2skf', func: Eq.calcularMascForsythSinning1973_2skd },
  { nome: 'Nagamine & Suzuki (1964) - 2skf', func: Eq.calcularMascNagamineSuzuki1964_2skd },
  { nome: 'Sloan (1967) - 2skf', func: Eq.calcularMascSloan1967_2skd },
  { nome: 'Hortobagyi et al. (1992) - Massa/Estatura', func: Eq.calcularMascHortobagyi1992 },
  { nome: 'Ortiz-Hernández et al. (2016) - Mista', func: Eq.calcularMascOrtizHernandez2016 }
];

export default function EscolhaPercGordura() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const pacienteInicial = location.state?.pacienteInicial || null
  const avaliacaoIdInicial = location.state?.avaliacaoIdInicial || null

  const [busca, setBusca] = useState('')
  const [pacientesFiltrados, setPacientesFiltrados] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  
  const [pacienteSelecionado, setPacienteSelecionado] = useState(pacienteInicial)
  const [historicoAvaliacoes, setHistoricoAvaliacoes] = useState([])
  const [avaliacaoAtual, setAvaliacaoAtual] = useState(null)
  const [medidasBrutas, setMedidasBrutas] = useState({})
  const [dadosCalculados, setDadosCalculados] = useState({})
  const [equacaoSelecionada, setEquacaoSelecionada] = useState('')
  const [resultadoGordura, setResultadoGordura] = useState(0)
  const [metadados, setMetadados] = useState(null)
  const [salvando, setSalvando] = useState(false)

  // ESTADO DA RECOMENDAÇÃO AUTOMÁTICA DA ENGINE TCC
  const [recomendacaoEngine, setRecomendacaoEngine] = useState(null)

  const dropdownRef = useRef(null)

  const buscarEquacaoPadraoConfigurada = async (sexoPaciente) => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) return ''

      const { data: conf } = await supabase
        .from('configuracoes_avaliador')
        .select('equacao_padrao_masculina, equacao_padrao_feminina')
        .eq('auth_id', authData.user.id)
        .maybeSingle()

      if (conf) {
        if (sexoPaciente === 'M') return conf.equacao_padrao_masculina || ''
        if (sexoPaciente === 'F') return conf.equacao_padrao_feminina || ''
      }
    } catch (err) {
      console.error('Erro ao carregar equação padrão:', err)
    }
    return ''
  }

  useEffect(() => {
    if (pacienteInicial) {
      selecionarPacienteViaForm(pacienteInicial, avaliacaoIdInicial)
    }
  }, [pacienteInicial, avaliacaoIdInicial])

  useEffect(() => {
    const buscarPacientes = async () => {
      if (busca.length < 1) {
        setPacientesFiltrados([])
        return
      }
      const { data, error } = await supabase
        .from('pacientes')
        .select('id, nome_completo, sexo, data_nascimento, pratica_esporte, modalidade_esportiva')
        .ilike('nome_completo', `%${busca}%`)
        .limit(5)

      if (!error && data) setPacientesFiltrados(data)
    }
    
    const delayDebounce = setTimeout(() => buscarPacientes(), 300)
    return () => clearTimeout(delayDebounce)
  }, [busca])

  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  const selecionarPacienteViaForm = async (paciente, avaliacaoIdReq) => {
    setPacienteSelecionado(paciente)
    setBusca(paciente.nome_completo)
    setShowDropdown(false)

    const { data: historico } = await supabase
      .from('avaliacoes')
      .select('id, data_avaliacao')
      .eq('id_paciente', paciente.id)
      .order('data_avaliacao', { ascending: false })
      
    if (historico) setHistoricoAvaliacoes(historico)

    if (avaliacaoIdReq) {
      const { data: aval } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('id', avaliacaoIdReq)
        .single()

      if (aval) {
        setAvaliacaoAtual(aval)
        setMedidasBrutas(aval)
        
        // DISPARA A ENGINE DE RECOMENDAÇÃO CIENTÍFICA (TCC)
        const rec = recomendarEquacaoIdeal(aval, paciente)
        setRecomendacaoEngine(rec)

        if (aval.equacao_de_regressao_escolhida && aval.percentual_de_gordura != null && aval.percentual_de_gordura > 0) {
          setEquacaoSelecionada(aval.equacao_de_regressao_escolhida)
        } else if (rec.nomeEquacaoRecomendada) {
          setEquacaoSelecionada(rec.nomeEquacaoRecomendada)
        } else {
          const eqPadrao = await buscarEquacaoPadraoConfigurada(paciente.sexo)
          setEquacaoSelecionada(eqPadrao)
        }
      }

      const { data: calc } = await supabase
        .from('dados_calculados')
        .select('*')
        .eq('id_avaliacao', avaliacaoIdReq)
        .maybeSingle()
        
      if (calc) setDadosCalculados(calc)
    }
  }

  const selecionarPacienteBusca = async (paciente) => {
    setPacienteSelecionado(paciente)
    setBusca(paciente.nome_completo)
    setShowDropdown(false)
    setEquacaoSelecionada('')
    setResultadoGordura(0)
    setMetadados(null)
    setDadosCalculados({})

    const { data: historico } = await supabase
      .from('avaliacoes')
      .select('id, data_avaliacao')
      .eq('id_paciente', paciente.id)
      .order('data_avaliacao', { ascending: false })

    if (historico && historico.length > 0) {
      setHistoricoAvaliacoes(historico)
      selecionarAvaliacaoDoHistorico(historico[0].id, paciente)
    } else {
      setHistoricoAvaliacoes([])
      setAvaliacaoAtual(null)
      setMedidasBrutas({})
      alert('Este paciente ainda não possui avaliações cadastradas.')
    }
  }

  const selecionarAvaliacaoDoHistorico = async (idAvaliacao, pacienteOverride) => {
    const pacObj = pacienteOverride || pacienteSelecionado
    const { data: aval } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('id', idAvaliacao)
      .single()

    if (aval) {
      setAvaliacaoAtual(aval)
      setMedidasBrutas(aval)
      
      const rec = recomendarEquacaoIdeal(aval, pacObj)
      setRecomendacaoEngine(rec)

      if (aval.equacao_de_regressao_escolhida && aval.percentual_de_gordura != null && aval.percentual_de_gordura > 0) {
        setEquacaoSelecionada(aval.equacao_de_regressao_escolhida)
      } else if (rec.nomeEquacaoRecomendada) {
        setEquacaoSelecionada(rec.nomeEquacaoRecomendada)
      } else {
        const eqPadrao = await buscarEquacaoPadraoConfigurada(pacObj?.sexo)
        setEquacaoSelecionada(eqPadrao)
      }
    }

    const { data: calc } = await supabase
      .from('dados_calculados')
      .select('*')
      .eq('id_avaliacao', idAvaliacao)
      .maybeSingle()
      
    if (calc) setDadosCalculados(calc)
  }

  useEffect(() => {
    if (!pacienteSelecionado || !equacaoSelecionada || !medidasBrutas) return

    const lista = pacienteSelecionado.sexo === 'F' ? listaFeminina : listaMasculina
    const equacao = lista.find(eq => eq.nome === equacaoSelecionada)

    if (equacao && typeof equacao.func === 'function') {
      try {
        const resultado = equacao.func(medidasBrutas, pacienteSelecionado)
        
        if (typeof resultado === 'object' && resultado !== null) {
          setResultadoGordura(resultado.valor || 0)
          setMetadados(resultado.info || null)
        } else {
          setResultadoGordura(resultado || 0)
          setMetadados(null)
        }
      } catch (err) {
        console.error("Erro no cálculo:", err)
        setResultadoGordura(0)
        setMetadados(null)
      }
    }
  }, [equacaoSelecionada, medidasBrutas, pacienteSelecionado])

  const handleSalvar = async () => {
    if (!avaliacaoAtual) return alert('Nenhuma avaliação encontrada para atualizar.')
    if (resultadoGordura <= 0) return alert('Calcule o percentual primeiro.')

    setSalvando(true)

    const { error: avalError } = await supabase
      .from('avaliacoes')
      .update({
        equacao_de_regressao_escolhida: equacaoSelecionada,
        percentual_de_gordura: resultadoGordura
      })
      .eq('id', avaliacaoAtual.id)

    const peso = Number(medidasBrutas.peso_paciente || 0)
    const massaGorda = peso > 0 ? (resultadoGordura * peso) / 100 : 0
    const massaMagra = peso > 0 ? peso - massaGorda : 0

    const massaMuscular = Number(dadosCalculados.massa_muscular || 0)
    let iam = 0
    if (massaMuscular > 0) {
      iam = massaGorda / massaMuscular
    }

    const { error: calcError } = await supabase
      .from('dados_calculados')
      .update({
        massa_gorda: Number(massaGorda.toFixed(2)),
        massa_magra: Number(massaMagra.toFixed(2)),
        indice_adiposo_muscular: Number(iam.toFixed(2))
      })
      .eq('id_avaliacao', avaliacaoAtual.id)

    setSalvando(false)

    if (avalError || calcError) {
      alert('Erro ao salvar: ' + (avalError?.message || calcError?.message))
    } else {
      alert('Equação, % Gordura, Massas e IAM salvos com sucesso!')
      navigate('/laudo-antropometrico', { state: { avaliacaoId: avaliacaoAtual.id } })
    }
  }

  const listaParaExibir = pacienteSelecionado?.sexo === 'F' ? listaFeminina : listaMasculina

  return (
    <div className="max-w-3xl mx-auto space-y-8 bg-white p-6 sm:p-8 rounded-xl shadow border border-gray-100 pb-12">
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Laboratório de Equações</h2>
        <p className="text-sm text-gray-500">Escolha a equação ideal para o paciente e valide os resultados.</p>
      </div>

      <div className="space-y-2 relative" ref={dropdownRef}>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Pesquisar Paciente
        </label>
        <input
          type="text"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Digite o nome (Ex: Mar...)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
        />
        
        {showDropdown && pacientesFiltrados.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {pacientesFiltrados.map(p => (
              <li
                key={p.id}
                onClick={() => selecionarPacienteBusca(p)}
                className="px-4 py-3 cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 text-sm font-medium border-b border-gray-100 last:border-0"
              >
                {p.nome_completo} <span className="text-xs text-gray-400 font-normal ml-2">({p.sexo})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pacienteSelecionado && avaliacaoAtual && (
        <div className="space-y-6 animate-fade-in-up">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 border border-gray-100 rounded-lg p-4 gap-4">
            <div>
              <p className="text-sm text-gray-700">Avaliando: <strong>{pacienteSelecionado.nome_completo}</strong></p>
              <p className="text-xs text-gray-500 mt-1">Peso Coletado: {medidasBrutas.peso_paciente || 0} kg</p>
            </div>

            {historicoAvaliacoes.length > 0 && (
              <div className="w-full sm:w-auto">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Avaliação Selecionada
                </label>
                <select
                  value={avaliacaoAtual.id}
                  onChange={(e) => selecionarAvaliacaoDoHistorico(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {historicoAvaliacoes.map(hist => (
                    <option key={hist.id} value={hist.id}>
                      {new Date(hist.data_avaliacao).toLocaleDateString('pt-BR')} (Ref: {String(hist.id).slice(0, 4)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 💎 A CEREJA DO BOLO: CARD DE RECOMENDAÇÃO AUTOMÁTICA DA ENGINE TCC */}
          {recomendacaoEngine && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💎</span>
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                    Recomendação Científica EvaluaOS
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setEquacaoSelecionada(recomendacaoEngine.nomeEquacaoRecomendada)}
                  className="text-[10px] font-extrabold bg-emerald-600 text-white px-3 py-1 rounded-md hover:bg-emerald-700 transition-colors shadow-2xs"
                >
                  Aplicar Esta Equação
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-800">
                  {recomendacaoEngine.nomeEquacaoRecomendada}
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {recomendacaoEngine.motivo}
                </p>
              </div>

              {recomendacaoEngine.travaKerr && (
                <div className="pt-2 border-t border-emerald-100 flex flex-wrap gap-4 text-xs text-emerald-800 font-semibold">
                  <span>🔒 Trava de Segurança (Kerr, 1991): {recomendacaoEngine.travaKerr.massaAdiposaKg} kg ({recomendacaoEngine.travaKerr.pctAdiposo}%)</span>
                  <span>Σ 6 Dobras: {recomendacaoEngine.indicadoresBrutos.soma6} mm ({recomendacaoEngine.indicadoresBrutos.statusArgoref})</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 border-t border-gray-100 pt-6">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Escolha a Equação de Regressão
            </label>
            <select
              value={equacaoSelecionada}
              onChange={(e) => setEquacaoSelecionada(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
            >
              <option value="">Selecione uma equação...</option>
              {listaParaExibir.map((eq, i) => (
                <option key={i} value={eq.nome}>{eq.nome}</option>
              ))}
            </select>
          </div>

          {metadados && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 transition-all">
              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">Validação Científica</h4>
              <ul className="text-sm text-blue-800 space-y-1.5">
                <li><strong>Autor(es):</strong> {metadados.autor} ({metadados.ano})</li>
                <li><strong>Protocolo:</strong> {metadados.protocolo}</li>
                <li><strong>População Alvo:</strong> {metadados.populacao}</li>
                <li><strong>Faixa Etária Padrão:</strong> {metadados.faixaEtaria}</li>
                <li><strong>Padrão Ouro:</strong> {metadados.referencia}</li>
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-6 items-center bg-emerald-50 border border-emerald-100 p-6 rounded-xl">
            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-emerald-800 text-sm font-semibold uppercase tracking-wider">Resultado Calculado</h4>
              <p className="text-xs text-emerald-600 mt-1">Percentual de Gordura Corporal (%G)</p>
            </div>
            <div className="text-5xl font-black text-emerald-700">
              {resultadoGordura > 0 ? resultadoGordura : '--'}
              <span className="text-2xl ml-1">%</span>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSalvar}
              disabled={!equacaoSelecionada || resultadoGordura <= 0 || salvando}
              className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 disabled:opacity-50 transition-all w-full sm:w-auto"
            >
              {salvando ? 'Salvando...' : 'Salvar Resultado na Avaliação'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}