import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { usePlano } from '../contexts/PlanoContext'

export default function Avaliador() {
  const navigate = useNavigate()
  const { isPro } = usePlano()

  const [loading, setLoading] = useState(true)
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [savingEquip, setSavingEquip] = useState(false)
  const [savingSenha, setSavingSenha] = useState(false)

  // Estados do Perfil do Avaliador 
  const [perfilId, setPerfilId] = useState(null)
  const [email, setEmail] = useState('')
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [telefone, setTelefone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [videoUrlPadrao, setVideoUrlPadrao] = useState('') // 📹 Novo estado

  // Estados dos Equipamentos
  const [equipId, setEquipId] = useState(null)
  const [plicometro, setPlicometro] = useState('')
  const [paquimetro, setPaquimetro] = useState('')
  const [trena, setTrena] = useState('')
  const [balanca, setBalanca] = useState('')
  const [estadiometro, setEstadiometro] = useState('')
  const [banco, setBanco] = useState('')
  const [alturaBanco, setAlturaBanco] = useState('')

  // Estados de Senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')

  // Estados da Logomarca
  const [logoUrl, setLogoUrl] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Carregar Dados Existentes ao Abrir a Página
  useEffect(() => {
    async function carregarDadosAvaliador() {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const userEmail = session.user.email
      setEmail(userEmail)

      // 1. Busca perfil na tabela 'avaliadores' pelo e-mail
      const { data: perfilData, error: perfilError } = await supabase
        .from('avaliadores')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle()

      if (perfilError) {
        console.error('Erro ao buscar perfil:', perfilError.message)
      } else if (perfilData) {
        setPerfilId(perfilData.id)
        setNomeCompleto(perfilData.nome_completo || '')
        setTelefone(perfilData.telefone || '')
        setInstagram(perfilData.instagram || '')
        setEmpresa(perfilData.empresa || '')
        setVideoUrlPadrao(perfilData.video_url_padrao || '')
        setLogoUrl(perfilData.logomarca_url || '')

        // 2. Busca equipamentos vinculados ao ID do avaliador
        const { data: equipData, error: equipError } = await supabase
          .from('equipamentos')
          .select('*')
          .eq('id_avaliador', perfilData.id)
          .maybeSingle()

        if (equipError) {
          console.error('Erro ao buscar equipamentos:', equipError.message)
        } else if (equipData) {
          setEquipId(equipData.id)
          setPlicometro(equipData.plicometro_adipometro || '')
          setPaquimetro(equipData.paquimetro || '')
          setTrena(equipData.trena || '')
          setBalanca(equipData.balanca || '')
          setEstadiometro(equipData.estadiometro || '')
          setBanco(equipData.banco || '')
          setAlturaBanco(equipData.altura_banco ?? '')
        }
      }

      setLoading(false)
    }

    carregarDadosAvaliador()
  }, [])

  // Salvar Perfil
  const handleSalvarPerfil = async (e) => {
    e.preventDefault()
    setSavingPerfil(true)

    const payload = {
      nome_completo: nomeCompleto,
      email,
      telefone,
      instagram,
      empresa: isPro ? empresa : null,
      video_url_padrao: videoUrlPadrao ? videoUrlPadrao.trim() : null
    }

    const { data: existente } = await supabase
      .from('avaliadores')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    let res
    if (existente) {
      res = await supabase
        .from('avaliadores')
        .update(payload)
        .eq('id', existente.id)
        .select()
        .single()
      setPerfilId(existente.id)
    } else {
      res = await supabase
        .from('avaliadores')
        .insert([payload])
        .select()
        .single()
      if (res.data) setPerfilId(res.data.id)
    }

    setSavingPerfil(false)

    if (res.error) {
      alert('Erro ao salvar perfil: ' + res.error.message)
    } else {
      alert('Informações profissionais atualizadas com sucesso!')
    }
  }

  // Salvar Equipamentos
  const handleSalvarEquipamentos = async (e) => {
    e.preventDefault()
    if (!perfilId) {
      return alert('Salve primeiro as Informações Profissionais.')
    }
    setSavingEquip(true)

    const payload = {
      id_avaliador: perfilId,
      plicometro_adipometro: plicometro,
      paquimetro,
      trena,
      balanca,
      estadiometro,
      banco,
      altura_banco: alturaBanco !== '' ? parseFloat(alturaBanco) : null
    }

    const { data: equipExistente } = await supabase
      .from('equipamentos')
      .select('id')
      .eq('id_avaliador', perfilId)
      .maybeSingle()

    let resEquip
    if (equipExistente) {
      resEquip = await supabase
        .from('equipamentos')
        .update(payload)
        .eq('id', equipExistente.id)
        .select()
        .single()
      setEquipId(equipExistente.id)
    } else {
      resEquip = await supabase
        .from('equipamentos')
        .insert([payload])
        .select()
        .single()
      if (resEquip.data) setEquipId(resEquip.data.id)
    }

    setSavingEquip(false)

    if (resEquip.error) {
      alert('Erro ao salvar equipamentos: ' + resEquip.error.message)
    } else {
      alert('Informações dos equipamentos atualizadas com sucesso!')
    }
  }

  // Atualizar Senha
  const handleAtualizarSenha = async (e) => {
    e.preventDefault()

    if (!senhaAtual) return alert('Digite sua senha atual.')
    if (!novaSenha || novaSenha.length < 6) return alert('A nova senha deve ter pelo menos 6 caracteres.')
    if (novaSenha !== confirmaSenha) return alert('As senhas não coincidem.')

    setSavingSenha(true)

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: senhaAtual
    })

    if (loginError) {
      setSavingSenha(false)
      return alert('A senha atual está incorreta.')
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha })

    setSavingSenha(false)

    if (updateError) {
      alert('Erro ao atualizar senha: ' + updateError.message)
    } else {
      alert('Senha atualizada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmaSenha('')
    }
  }

  // Upload de Logomarca
  const handleUploadLogo = async (event) => {
    try {
      if (!isPro) {
        alert('🔒 O envio de logomarca personalizada é um recurso exclusivo do Plano Pro.')
        return
      }

      if (!perfilId) {
        return alert('Por favor, salve suas Informações Profissionais primeiro para poder enviar a logomarca.')
      }

      setUploadingLogo(true)
      
      const file = event.target.files[0]
      if (!file) return

      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB.')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${perfilId}_logo_${Date.now()}.${fileExt}`
      const filePath = `logomarcas/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avaliador_assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('avaliador_assets')
        .getPublicUrl(filePath)

      const urlFinal = publicUrlData.publicUrl

      const { error: updateError } = await supabase
        .from('avaliadores')
        .update({ logomarca_url: urlFinal })
        .eq('id', perfilId)

      if (updateError) throw updateError

      setLogoUrl(urlFinal)
      alert('Logomarca atualizada com sucesso!')

    } catch (error) {
      alert('Erro ao subir imagem: ' + error.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-slate-400">Carregando dados do avaliador...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Painel do Avaliador</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">Gerencie suas informações profissionais, equipamentos de precisão e segurança da conta.</p>
      </div>

      {/* SEÇÃO 1: DADOS PESSOAIS E PROFISSIONAIS */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="border-b pb-3 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider">1. Informações Profissionais</h3>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
            isPro 
              ? 'bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800' 
              : 'bg-amber-50 dark:bg-amber-900/20 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
          }`}>
            {isPro ? '⭐ Plano Pro Ativo' : '🌱 Plano Gratuito (Até 7 Pacientes)'}
          </span>
        </div>

        <form onSubmit={handleSalvarPerfil} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Nome Completo</label>
              <input type="text" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Seu nome" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">E-mail</label>
              <input type="email" disabled value={email} className="mt-1 w-full px-3 py-2 border dark:border-slate-700 rounded-md text-sm bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 cursor-not-allowed" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Telefone / WhatsApp</label>
              <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="(21) 99999-9999" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Instagram</label>
              <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="@seuusuario" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">
                Empresa / Clínica {!isPro && <span className="text-amber-600 text-[10px] font-bold ml-1">(🔒 Exclusivo Pro)</span>}
              </label>
              <input 
                type="text" 
                disabled={!isPro}
                value={empresa} 
                onChange={(e) => setEmpresa(e.target.value)} 
                className={`mt-1 w-full px-3 py-2 border rounded-md text-sm transition-colors ${
                  !isPro 
                    ? 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-400 cursor-not-allowed' 
                    : 'focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-900'
                }`} 
                placeholder={isPro ? "Nome do espaço / consultório" : "🔒 Nome personalizado exclusivo do Plano Pro"} 
              />
            </div>
          </div>

          {/* 🎬 VÍDEO PADRÃO DO CONSULTÓRIO */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase mb-1">
              🎬 Vídeo Padrão de Boas-Vindas / Apresentação do Consultório (YouTube - Opcional)
            </label>
            <input
              type="url"
              value={videoUrlPadrao}
              onChange={(e) => setVideoUrlPadrao(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-900"
            />
            <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-1">
              Este vídeo será exibido em todos os laudos públicos caso você não adicione um vídeo personalizado específico na avaliação do paciente.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={savingPerfil} className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 shadow transition-all disabled:opacity-50">
              {savingPerfil ? 'Salvando...' : 'Salvar Perfil'}
            </button>
          </div>
        </form>
      </div>

      {/* SEÇÃO 2: EQUIPAMENTOS */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="border-b pb-3">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider">2. Equipamentos Utilizados (Padrão ISAK / Antropometria)</h3>
        </div>

        <form onSubmit={handleSalvarEquipamentos} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Plicômetro / Adipômetro</label>
              <input type="text" value={plicometro} onChange={(e) => setPlicometro(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Ex: Cescorf, Lange, Sanny..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Paquímetro</label>
              <input type="text" value={paquimetro} onChange={(e) => setPaquimetro(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Ex: Ósseo pequeno/grande Cescorf..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Trena Antropométrica</label>
              <input type="text" value={trena} onChange={(e) => setTrena(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Ex: Sanny metálica com retração..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Balança</label>
              <input type="text" value={balanca} onChange={(e) => setBalanca(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Ex: Filizola, Toledo, Omron..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Estadiômetro</label>
              <input type="text" value={estadiometro} onChange={(e) => setEstadiometro(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Ex: Portátil Sanny ou de parede..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Banco Antropométrico (Modelo/Marca)</label>
              <input type="text" value={banco} onChange={(e) => setBanco(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Ex: Caixa de madeira ISAK padrão" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Altura do Banco (cm)</label>
              <input type="number" step="0.1" value={alturaBanco} onChange={(e) => setAlturaBanco(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Ex: 40.5" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={savingEquip} className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 shadow transition-all disabled:opacity-50">
              {savingEquip ? 'Salvando...' : 'Salvar Equipamentos'}
            </button>
          </div>
        </form>
      </div>

      {/* SEÇÃO 3: ATUALIZAR SENHA */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="border-b pb-3">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider">3. Segurança da Conta (Atualizar Senha)</h3>
        </div>

        <form onSubmit={handleAtualizarSenha} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Senha Atual</label>
            <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Digite sua senha atual" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Nova Senha</label>
            <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Mínimo de 6 caracteres" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">Confirme a Nova Senha</label>
            <input type="password" value={confirmaSenha} onChange={(e) => setConfirmaSenha(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Digite a nova senha novamente" />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={savingSenha} className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 shadow transition-all disabled:opacity-50">
              {savingSenha ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
          </div>
        </form>
      </div>

      {/* SEÇÃO 4: PERSONALIZAÇÃO */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="border-b pb-3 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider">4. Personalização do Relatório</h3>
          {!isPro && (
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:bg-amber-900/20 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
              🔒 Recurso do Plano Pro
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase mb-2">Logomarca do Consultório (PDF e Web)</label>

          {isPro ? (
            <>
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="h-20 w-auto mb-4 rounded border border-gray-200 dark:border-slate-700 p-1 object-contain" />
              )}

              <input 
                type="file" 
                accept="image/png, image/jpeg" 
                onChange={handleUploadLogo}
                disabled={uploadingLogo}
                className="block w-full text-sm text-gray-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
              />
              {uploadingLogo && <p className="text-xs text-blue-500 mt-2 font-medium">Fazendo upload da imagem, aguarde...</p>}
              <p className="text-xs text-gray-400 dark:text-slate-400 mt-2">Formato JPG ou PNG. O arquivo deve ter no máximo 2MB.</p>
            </>
          ) : (
            <div className="p-5 bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <span>🔒</span> Envio de Logo Personalizada Bloqueado
                </span>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  No Plano Gratuito, os relatórios utilizam o modelo padrão EvaluaOS. Assine o **Plano Pro** para incluir a marca do seu consultório nos laudos PDF e links interativos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/meu-plano')}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 shadow-sm shrink-0 transition-colors"
              >
                Upgrade para Pro a partir de (R$ 29,90)
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}