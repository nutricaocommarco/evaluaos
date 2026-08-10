import React, { useEffect, useRef, useState } from 'react'
import { Bold, Italic, Underline, Strikethrough, Palette, Eraser, Undo2, Redo2, Wand2, Trash2, List, ListOrdered } from 'lucide-react'

// Editor de texto rico minimalista — contentEditable + execCommand, sem
// depender de uma biblioteca de editor (TipTap/Quill/etc). Cobre só o que a
// tela precisa: negrito/itálico/sublinhado/tachado/cor, limpar formatação,
// desfazer/refazer e "utilizar modelo".
//
// Semi-controlado de propósito: initialHtml só é aplicado uma vez, no mount
// (o modal que usa este componente é desmontado/remontado a cada abertura,
// então isso já cobre trocar de "nova" pra "editando"). Depois disso, tanto
// digitação quanto aplicar um modelo mexem direto no DOM + onChange — assim
// nunca reseta o cursor no meio da digitação.

const CORES = ['#111827', '#dc2626', '#d97706', '#16a34a', '#2563eb', '#7c3aed']

// Allowlist de tags/atributos — aplicado no save (nas telas que usam este
// editor), não aqui; exportado pra reuso.
const TAGS_PERMITIDAS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SPAN', 'P', 'DIV', 'BR', 'UL', 'OL', 'LI'])

export function sanitizarHtmlEditor(html) {
  if (!html) return ''
  const template = document.createElement('template')
  template.innerHTML = html

  const limpar = (node) => {
    Array.from(node.childNodes).forEach((filho) => {
      if (filho.nodeType === Node.ELEMENT_NODE) {
        if (!TAGS_PERMITIDAS.has(filho.tagName)) {
          while (filho.firstChild) filho.parentNode.insertBefore(filho.firstChild, filho)
          filho.parentNode.removeChild(filho)
          return
        }
        Array.from(filho.attributes).forEach((attr) => {
          if (filho.tagName === 'SPAN' && attr.name === 'style') {
            const corMatch = /color\s*:\s*[^;]+/i.exec(attr.value)
            if (corMatch) filho.setAttribute('style', corMatch[0])
            else filho.removeAttribute('style')
          } else {
            filho.removeAttribute(attr.name)
          }
        })
        limpar(filho)
      } else if (filho.nodeType !== Node.TEXT_NODE) {
        filho.remove()
      }
    })
  }

  limpar(template.content)
  return template.innerHTML
}

function BotaoToolbar({ onClick, title, children, ativo }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 ${ativo ? 'bg-gray-100 dark:bg-slate-800 text-primary-600' : 'text-gray-600 dark:text-slate-300'}`}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({ initialHtml, onChange, modelos = [], onEscolherModelo, onExcluirModelo, placeholder }) {
  const editorRef = useRef(null)
  const [showCores, setShowCores] = useState(false)
  const [showModelos, setShowModelos] = useState(false)
  const coresRef = useRef(null)
  const modelosRef = useRef(null)

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialHtml || ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleClickFora = (e) => {
      if (coresRef.current && !coresRef.current.contains(e.target)) setShowCores(false)
      if (modelosRef.current && !modelosRef.current.contains(e.target)) setShowModelos(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  const dispararChange = () => onChange(editorRef.current.innerHTML)

  const exec = (comando, valor) => {
    editorRef.current.focus()
    document.execCommand(comando, false, valor)
    dispararChange()
  }

  const aplicarModelo = (modelo) => {
    editorRef.current.innerHTML = modelo.conteudo || ''
    setShowModelos(false)
    dispararChange()
    onEscolherModelo?.(modelo)
  }

  return (
    <div className="border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex-wrap">
        {modelos.length > 0 && (
          <div className="relative" ref={modelosRef}>
            <button
              type="button"
              onClick={() => setShowModelos((v) => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <Wand2 size={14} /> Utilizar modelo
            </button>
            {showModelos && (
              <ul className="absolute left-0 z-20 mt-1 w-56 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                {modelos.map((m) => (
                  <li key={m.id} className="flex items-center justify-between px-3 py-2 text-xs border-b border-gray-100 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800">
                    <button type="button" onClick={() => aplicarModelo(m)} className="flex-1 text-left truncate">{m.titulo}</button>
                    {onExcluirModelo && (
                      <button type="button" onClick={() => onExcluirModelo(m.id)} className="text-gray-400 hover:text-red-600 shrink-0 ml-2" title="Excluir modelo">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <span className="w-px h-4 bg-gray-300 dark:bg-slate-700 mx-1" />
        <BotaoToolbar onClick={() => exec('bold')} title="Negrito"><Bold size={14} /></BotaoToolbar>
        <BotaoToolbar onClick={() => exec('italic')} title="Itálico"><Italic size={14} /></BotaoToolbar>
        <BotaoToolbar onClick={() => exec('underline')} title="Sublinhado"><Underline size={14} /></BotaoToolbar>
        <BotaoToolbar onClick={() => exec('strikeThrough')} title="Tachado"><Strikethrough size={14} /></BotaoToolbar>
        <div className="relative" ref={coresRef}>
          <BotaoToolbar onClick={() => setShowCores((v) => !v)} title="Cor do texto"><Palette size={14} /></BotaoToolbar>
          {showCores && (
            <div className="absolute left-0 z-20 mt-1 p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl flex gap-1.5">
              {CORES.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { exec('foreColor', cor); setShowCores(false) }}
                  className="w-5 h-5 rounded-full border border-gray-200 dark:border-slate-700"
                  style={{ backgroundColor: cor }}
                  title={cor}
                />
              ))}
            </div>
          )}
        </div>
        <BotaoToolbar onClick={() => exec('removeFormat')} title="Limpar formatação"><Eraser size={14} /></BotaoToolbar>
        <span className="w-px h-4 bg-gray-300 dark:bg-slate-700 mx-1" />
        <BotaoToolbar onClick={() => exec('insertUnorderedList')} title="Tópicos (lista com marcadores)"><List size={14} /></BotaoToolbar>
        <BotaoToolbar onClick={() => exec('insertOrderedList')} title="Lista numerada"><ListOrdered size={14} /></BotaoToolbar>
        <span className="w-px h-4 bg-gray-300 dark:bg-slate-700 mx-1" />
        <BotaoToolbar onClick={() => exec('undo')} title="Desfazer"><Undo2 size={14} /></BotaoToolbar>
        <BotaoToolbar onClick={() => exec('redo')} title="Refazer"><Redo2 size={14} /></BotaoToolbar>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={dispararChange}
        data-placeholder={placeholder}
        className="rte-content rte-html min-h-[220px] max-h-[480px] overflow-y-auto px-3 py-2 text-sm leading-relaxed outline-none bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100"
      />
      <style>{`
        .rte-content:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
      `}</style>
    </div>
  )
}
