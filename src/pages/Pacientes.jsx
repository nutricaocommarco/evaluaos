<div className="flex gap-2 items-center">
  {/* Lápis de Editar Avaliação */}
  <button 
    onClick={() => navigate('/nova-avaliacao', { state: { paciente: historicoPaciente, avaliacaoIdParaEditar: a.id } })} 
    className="p-1.5 text-blue-500 hover:bg-blue-100 rounded"
  >
    Editar
  </button>

  {/* Lixeira de Excluir Avaliação */}
  <button 
    onClick={() => handleDeleteAvaliacao(a.id)} 
    className="p-1.5 text-red-500 hover:bg-red-100 rounded"
  >
    Excluir
  </button>

  {/* Botão de Abrir o Laudo */}
  <button 
    onClick={() => navigate('/laudo-antropometrico', { state: { avaliacaoId: a.id } })} 
    className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-semibold"
  >
    Laudo
  </button>
</div>