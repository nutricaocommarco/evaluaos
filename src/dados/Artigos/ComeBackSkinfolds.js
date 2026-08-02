export const ARTIGO_COME_BACK_SKINFOLDS = {
  id: 'come-back-skinfolds-2021',
  titulo: 'Come Back Skinfolds, All Is Forgiven: O Resgate Científico das Dobras Cutâneas',
  subtitulo: 'Uma revisão crítica sobre a eficácia dos métodos de composição corporal no esporte de alto rendimento.',
  autores: 'Andreas M. Kasper, Carl Langan-Evans, James P. Morton, Graeme L. Close et al. (2021)',
  revista: 'Nutrients (MDPI)',
  doiUrl: 'https://doi.org/10.3390/nu13041075',
  categoria: 'Artigos e Ciência',
  tipo: 'artigo',
  tempoLeitura: '10 min de leitura',
  capa: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
  
  // Resumo executivo para o card
  resumoCard: 'Entenda por que o DXA não é o padrão-ouro absoluto que todos pensavam e por que o Somatório de Dobras (ISAK) é a ferramenta mais confiável e imune a erros de hidratação na prática clínica.',

  // Conteúdo estruturado em seções explicativas
  conteudoCompleto: {
    introducao: `
No meio esportivo e clínico, criou-se nos últimos anos a falsa narrativa de que a avaliação de dobras cutâneas com plicômetro (caliper) teria ficado obsoleta com a chegada de tecnologias de imagem avançadas, como a Densitometria Óssea (DXA) e a Bioimpedância (BIA).

No entanto, este estudo publicado na prestigiada revista *Nutrients* faz uma provocação necessária e cientificamente embasada: "Voltem dobras cutâneas, estão todas perdoadas!". Os pesquisadores da Liverpool John Moores University analisaram os bastidores do esporte de elite para demonstrar que o DXA sofre de limitações severas na prática do dia a dia.
    `,

    oMitoDoDXA: `
### 🚫 O Mito do DXA como "Padrão-Ouro" Inquestionável

Embora o DXA seja excelente para avaliar o Conteúdo Mineral Ósseo (BMC) e a assimetria muscular de membros lesionados, ele apresenta grande sensibilidade a fatores biológicos cotidianos do atleta que produzem erros grosseiros de leitura:

1. **Glicocênio e Água Muscular:** Uma supercompensação de carboidratos (carbo-loading) aumenta a água intramuscular e faz o DXA registrar um ganho fictício de Massa Magra (LM) de até 2,5%. Se o atleta estiver em depleção de glicocênio, o exame aponta falsa perda muscular.
2. **Refeições e Hidratação:** Uma simples refeição sólida antes do exame pode alterar o percentual de gordura estimado no DXA em até 2,6%.
3. **Erros Fisiologicamente Impossíveis:** Em atletas de artes marciais (MMA) e esportes de combate submetidos a perda rápida de peso (desidratação), o DXA registrou flutuações absurdas de massa magra de até 17,5% em apenas 4 dias — uma variação biologicamente impossível.
4. **Tamanho da Cama do Aparelho:** Atletas muito altos (> 195 cm) ou muito largos (como jogadores de rugby) não cabem perfeitamente na área de varredura. Mudar a posição da cabeça/pés no mesmo dia variou a estimativa de gordura em mais de 3 kg no mesmo indivíduo.
    `,

    aVitoriaDasDobras: `
### 📏 Por que as Dobras Cutâneas Vencem na Prática?

A medição de dobras cutâneas avalia a espessura da gordura subcutânea diretamente. Ao contrário do DXA e da Bioimpedância, **o plicômetro é praticamente imune a alterações agudas de refeições, uso de suplementos (como creatina) ou estado de hidratação do dia**.

* **Confiabilidade Prática:** Quando realizada por um avaliador treinado e certificado (padrão ISAK), a dobra cutânea mede o tecido adiposo com altíssima reprodutibilidade.
* **Custo e Portabilidade:** O equipamento é barato, leve, não emite radiação ionizante e pode ser realizado semanalmente na beira do campo, quadra ou consultório.
    `,

    aAlertadaDasEquacoes: `
### ⚠️ A Armadilha do "% de Gordura" e a Solução do Somatório (mm)

Um dos alertas mais importantes do estudo é sobre a **conversão das dobras em Percentual de Gordura (%GC)** através de equações matemáticas (ex: Jackson & Pollock, Durnin & Womersley, Withers, etc.).

* Existem mais de 100 equações na literatura, cada uma criada para uma população específica (jovens, idosos, sedentários, atletas de determinado esporte).
* Usar a equação errada no mesmo paciente pode variar o percentual de gordura de 4% para 8% instantaneamente.
* Nenhuma equação foi validada para rastrear mudanças longitudinais frequentes em atletas.

#### 💡 A Recomendação dos Autores e do EvaluaOS:
Pare de tentar adivinhar o percentual de gordura relativo via equações para comparar resultados! A melhor conduta científica é utilizar o **Somatório de Dobras Cutâneas em milímetros (ex: Sum das 8 Dobras ISAK - $\\sum 8 SF$)**. 

O somatório em mm reflete a evolução real do paciente com absoluta precisão e sem as distorções causadas por fórmulas preditivas.
    `,

    conclusaoEPratica: `
### 🎯 Aplicação no Consultório e Mensagem Final

Se o seu objetivo no consultório é acompanhar a perda de gordura e o ganho de massa ao longo do tempo em pacientes livres e atletas, **as dobras cutâneas em milímetros são mais confiáveis, práticas e reproduzíveis do que exames caros como o DXA**.

O DXA deve ser reservado para momentos específicos onde se deseja avaliar a densidade mineral óssea (ex: suspeita de baixa disponibilidade energética / RED-S) ou assimetrias de membros pós-lesão.
    `
  }
}
