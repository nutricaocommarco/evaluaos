import React from 'react'

export default function EmConstrucao() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-24 h-24 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-300 dark:text-slate-600 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
      </div>
      <h2 className="text-2xl font-black text-gray-800 dark:text-slate-100 mb-2">Página em Construção</h2>
      <p className="text-gray-500 dark:text-slate-400 max-w-md">
        A seção selecionada está sendo desenvolvida. Em breve você poderá acessá-la por aqui!
      </p>
    </div>
  )
}
