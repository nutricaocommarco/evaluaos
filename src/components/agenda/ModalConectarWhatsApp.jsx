import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../../supabaseClient'

// Mostra o QR Code da Evolution API pro nutricionista escanear com o
// próprio WhatsApp, e faz polling do status até conectar. Chamado a
// partir do card "Conectar WhatsApp" em Avaliador.jsx > Integrações.
export default function ModalConectarWhatsApp({ aoFechar, aoConectado }) {
  const [qrcode, setQrcode] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [conectado, setConectado] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    async function iniciar() {
      const { data: { session } } = await supabase.auth.getSession()
      try {
        const res = await fetch('/api/whatsapp/connect', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Falha ao conectar')
        setQrcode(data.qrcode)
      } catch (err) {
        setErro(err.message)
      } finally {
        setCarregando(false)
      }
    }
    iniciar()

    pollRef.current = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/whatsapp/status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (data.conectado) {
        setConectado(true)
        clearInterval(pollRef.current)
        aoConectado(data.numero)
      }
    }, 3000)

    return () => clearInterval(pollRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 text-center">
        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Conectar WhatsApp</h3>

        {conectado ? (
          <p className="text-sm text-emerald-600 font-semibold">✅ WhatsApp conectado com sucesso!</p>
        ) : carregando ? (
          <p className="text-sm text-primary-600 font-semibold animate-pulse">Gerando QR Code...</p>
        ) : erro ? (
          <p className="text-sm text-red-600">{erro}</p>
        ) : qrcode ? (
          <>
            <img
              src={qrcode.startsWith('data:') ? qrcode : `data:image/png;base64,${qrcode}`}
              alt="QR Code do WhatsApp"
              className="mx-auto w-52 h-52 border border-gray-200 dark:border-slate-700 rounded-lg"
            />
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Abra o WhatsApp no celular do consultório → Aparelhos conectados → Conectar um aparelho, e escaneie este código.
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-slate-400">Não foi possível gerar o QR Code.</p>
        )}

        <div className="flex justify-end pt-2">
          <button onClick={aoFechar} className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
