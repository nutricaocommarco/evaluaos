export const ARTIGO_HOLWAY_2005_ARGOREF = {
  id: 'holway-2005-argoref',
  titulo: 'Tabelas ARGOREF: Os Dados de Referência Definitivos para a Avaliação Antropométrica',
  subtitulo: 'Entenda como utilizar os baremos de Francis Holway para comparar seu paciente com uma população saudável real e não com atletas de elite.',
  autores: 'Francis Holway, MSc. (Club Atlético River Plate / ISAK Level 4)',
  revista: 'Cineantropometría y Ciencias de la Salud',
  doiUrl: 'https://nutricaocommarco.com.br/artigos/argoref-holway-2005.pdf',
  categoria: 'Antropometria',
  tipo: 'artigo',
  tempoLeitura: '9 min de leitura',
  capa: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',

  resumoCard: 'Descubra a relevância das Tabelas ARGOREF para classificar o perfil morfológico de adultos jovens (20 a 30 anos) com rigor metrológico ISAK.',

  conteudoCompleto: {
    introducao: `
      <p className="text-gray-700 leading-relaxed mb-4">
        Em cineantropometria, a pergunta mais frequente feita após a medição de um paciente é: <strong>"Como estão os meus resultados?"</strong>. Para responder a essa pergunta com precisão científica, o profissional precisa comparar os dados medidos com uma população de referência saudável, não sedentária, mas que também não seja formada por atletas de elite.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        O prestigiado antropometrista <strong>Francis Holway</strong> compilou a base de dados conhecida como <strong>ARGOREF</strong>. A amostra foi coletada por alunos e instrutores ISAK Nível 2 e 3 com rigor metrológico estrito (Erro Técnico de Medição inferior a 5% para dobras e 1% para perímetros/diâmetros), gerando tabelas normativas para adultos de 20 a 30 anos.
      </p>
    `,

    aSequenciaDoAnalise: `
      <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3 flex items-center gap-2">
        📊 A Sequência do Diagnóstico Antropométrico
      </h3>
      <p className="text-gray-700 leading-relaxed mb-4">
        Holway reforça que para a tomada de decisão no consultório ou academia, o avaliador deve seguir seis passos fundamentais:
      </p>
      <ol className="list-decimal pl-5 space-y-2 text-gray-700 mb-6">
        <li>Selecionar as variáveis a medir (protocolo).</li>
        <li>Medir minimizando os erros técnicos (ETM).</li>
        <li>Descrever os dados brutos.</li>
        <li><strong>Comparar / Classificar com uma tabela de referência.</strong></li>
        <li>Analisar o contexto morfológico e funcional.</li>
        <li>Tomar a conduta dietética ou de treinamento.</li>
      </ol>
    `,

    classificacaoPercentis: `
      <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3 flex items-center gap-2">
        📈 Classificação por Percentis (Frisancho, 1990)
      </h3>
      <p className="text-gray-700 leading-relaxed mb-4">
        O artigo estabelece os pontos de corte para categorizar variáveis antropométricas de forma clara:
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 space-y-3">
        <h4 className="font-bold text-gray-900 text-sm">Geral (Estatura, Músculo, Diâmetros, Perímetros):</h4>
        <ul className="list-disc pl-5 space-y-1 text-gray-700 text-xs">
          <li><strong>Muito Baixo:</strong> &lt; Percentil 5</li>
          <li><strong>Baixo:</strong> Percentil 5 a 15</li>
          <li><strong>Promédio / Normal:</strong> Percentil 15 a 85</li>
          <li><strong>Elevado:</strong> Percentil 85 a 95</li>
          <li><strong>Muito Elevado:</strong> &gt; Percentil 95</li>
        </ul>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 space-y-3">
        <h4 className="font-bold text-amber-900 text-sm">Exceção para Adiposidade e Dobras Cutâneas (Viés à Esquerda):</h4>
        <ul className="list-disc pl-5 space-y-1 text-amber-800 text-xs">
          <li><strong>Muito Baixo:</strong> &lt; Percentil 5</li>
          <li><strong>Baixo:</strong> Percentil 5 a 15</li>
          <li><strong>Promédio / Normal:</strong> Percentil 15 a 75</li>
          <li><strong>Elevado:</strong> Percentil 75 a 85</li>
          <li><strong>Muito Elevado:</strong> &gt; Percentil 85</li>
        </ul>
      </div>
    `,

    modeloKerr5Masas: `
      <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3 flex items-center gap-2">
        🧩 Modelo de 5 Massas de Kerr (1988) e o Índice Músculo/Ósseo
      </h3>
      <p className="text-gray-700 leading-relaxed mb-4">
        As tabelas ARGOREF trazem a referência para o Fracionamento em 5 Massas (Adiposa, Muscular, Residual, Óssea e Piel), modelo anatomicamente validado em cadáveres:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
          <h5 className="font-bold text-emerald-900 text-xs uppercase mb-1">Masculino (20-30 anos)</h5>
          <p className="text-xs text-emerald-800"><strong>Masa Adiposa:</strong> 24,2% ± 4,4% (18,2 kg)</p>
          <p className="text-xs text-emerald-800"><strong>Masa Muscular:</strong> 48,3% ± 3,7% (36,0 kg)</p>
          <p className="text-xs text-emerald-800"><strong>Índice Músculo/Ósseo:</strong> 4,3 ± 0,5</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
          <h5 className="font-bold text-emerald-900 text-xs uppercase mb-1">Femenino (20-30 anos)</h5>
          <p className="text-xs text-emerald-800"><strong>Masa Adiposa:</strong> 33,8% ± 4,1% (19,2 kg)</p>
          <p className="text-xs text-emerald-800"><strong>Masa Muscular:</strong> 39,3% ± 3,5% (22,4 kg)</p>
          <p className="text-xs text-emerald-800"><strong>Índice Músculo/Ósseo:</strong> 3,5 ± 0,5</p>
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed mb-4">
        O <strong>Índice Músculo/Ósseo (Músculo em kg / Hueso em kg)</strong> é a clássica relação "motor/chassi". Um valor abaixo do percentil 15 (3,0 para mulheres e 3,8 para homens) indica baixa reserva muscular para a estrutura óssea, enquanto atletas de força/potência se aproximam da marca de 5,0 kg de músculo para cada 1,0 kg de osso.
      </p>
    `,

    conclusao: `
      <div className="bg-gray-900 text-white rounded-2xl p-6 mt-8 shadow-lg space-y-2">
        <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-wider">🎯 Aplicação Prática no EvaluaOS</h4>
        <p className="text-xs text-gray-300 leading-relaxed">
          Com as referências ARGOREF integradas aos algoritmos do EvaluaOS, você evita comparações irrealistas. Seu laudo entrega percentis precisos de adiposidade, massa muscular e proporcionalidade óssea respaldados por dados científicos da América Latina!
        </p>
      </div>
    `
  }
}
