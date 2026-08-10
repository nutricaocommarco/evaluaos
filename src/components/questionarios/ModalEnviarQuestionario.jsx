import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { Copy, Check } from 'lucide-react'

// Cria um `questionario_envios` (com token público) pra um questionário
// escolhido, opcionalmente já ligado a um paciente. Depois de criado, mostra
// o link pra copiar/mandar — sem fechar sozinho, pra dar tempo do nutri copiar.
export default function ModalEnviarQuestionario({ questionarios, pacientes, pacientePreSelecionado, userId, aoFechar, aoCriado }) {
  const [questionarioId, setQuestionarioId] = useState(questionarios[0]?.id ?? '')
  const [pacienteId, setPacienteId] = useState(pacientePreSelecionado?.id ?? '')
  const [criando, setCriando] = useState(false)
  const [envioCriado, setEnvioCriado] = useState(null)
  const [copiado, setCopiado] = useState(false)

  const pacienteSelecionado = pacientePreSelecionado || pacientes.find((p) => String(p.id) === String(pacienteId))
  const link = envioCriado ? `${window.location.origin}/questionario/${envioCriado.token_publico}` : ''

  const handleCriar = async () => {
    if (!questionarioId) return
    setCriando(true)
    const { data, error } = await supabase
      .from('questionario_envios')
      .insert({
        id_questionario: questionarioId,
        id_avaliador: userId,
        id_paciente: pacienteId || null,
      })
      .select()
      .single()
    setCriando(false)
    if (error) { alert('Erro ao gerar envio: ' + error.message); return }
    setEnvioCriado(data)
    aoCriado(data)
  }

  const handleCopiar = async () => {
    await navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const telefoneLimpo = pacienteSelecionado?.telefone?.replace(/\D/g, '')
  const questionarioTitulo = questionarios.find((q) => String(q.id) === String(questionarioId))?.titulo
  const mensagemWhatsApp = `Olá${pacienteSelecionado ? ` *${pacienteSelecionado.nome_completo.split(' ')[0]}*` : ''}, tudo bem?\n\nPreparei um questionário rapidinho pra você responder: "${questionarioTitulo}".\n\n${link}\n\nQualquer dúvida, me chama!`
  const linkWhatsApp = telefoneLimpo
    ? `https://wa.me/${telefoneLimpo.startsWith('55') ? telefoneLimpo : '55' + telefoneLimpo}?text=${encodeURIComponent(mensagemWhatsApp)}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Enviar questionário</h3>

        {!envioCriado ? (
          <>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Questionário
              </label>
              <select
                value={questionarioId}
                onChange={(e) => setQuestionarioId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              >
                {questionarios.length === 0 && <option value="">Nenhum questionário criado ainda</option>}
                {questionarios.map((q) => (
                  <option key={q.id} value={q.id}>{q.titulo}</option>
                ))}
              </select>
            </div>

            {pacientePreSelecionado ? (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Paciente
                </label>
                <p className="text-sm text-gray-700 dark:text-slate-300 px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  {pacientePreSelecionado.nome_completo}
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Paciente (opcional)
                </label>
                <select
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Link genérico, sem paciente associado</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome_completo}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={aoFechar}
                className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!questionarioId || criando}
                onClick={handleCriar}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
              >
                {criando ? 'Gerando...' : 'Gerar link'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-slate-300">Link gerado — copie e mande pro paciente:</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={link}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 outline-none"
              />
              <button
                onClick={handleCopiar}
                className="shrink-0 flex items-center gap-1 px-3 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700"
              >
                {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            {linkWhatsApp && (
              <a
                href={linkWhatsApp}
                target="_blank"
                rel="noreferrer"
                className="block text-center py-2.5 bg-green-500 text-white text-xs font-semibold rounded-lg shadow hover:bg-green-600 transition-colors"
              >
                💬 Enviar por WhatsApp
              </a>
            )}
            <div className="flex justify-end pt-2">
              <button
                onClick={aoFechar}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
