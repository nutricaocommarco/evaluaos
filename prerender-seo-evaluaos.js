import fs from 'fs';
import path from 'path';

// 🔗 Domínio base oficial do EvaluaOS
const DOMAIN = "https://evaluaos.com"; // ou seu subdomínio do Vercel/Netlify

// 🖼️ Imagem de marca padrão para compartilhamentos (Logo / Preview do SaaS)
const LOGO_SAAS = `${DOMAIN}/evaluaos_og_preview.jpg`; 

// ==========================================
// 🧠 FUNÇÕES GERADORAS DE SCHEMAS DO EVALUAOS
// ==========================================

// Schema para a Página Inicial / Landing Page (Software SaaS)
function getSoftwareSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "EvaluaOS",
    "operatingSystem": "Web, iOS, Android",
    "applicationCategory": "HealthApplication",
    "url": DOMAIN,
    "description": "Sistema completo e inteligente de Avaliação Antropométrica, Composição Corporal e Protocolos ISAK para Nutricionistas e Personal Trainers.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BRL"
    }
  };
}

// Schema de Organização (Avaliador / Empresa)
function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "EvaluaOS",
    "url": DOMAIN,
    "logo": `${DOMAIN}/logo_evaluaos.png`,
    "sameAs": [
      "https://instagram.com/evaluaos"
    ]
  };
}

// Schema de Relatório Médico / Laudo (Para links de Laudo e Evolução)
function getMedicalReportSchema(titulo, url, pacienteNome) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "name": titulo,
    "url": url,
    "about": [
      { "@type": "MedicalEntity", "name": "Antropometria" },
      { "@type": "MedicalEntity", "name": "Composição Corporal" },
      { "@type": "MedicalEntity", "name": "Cineantropometria ISAK" }
    ],
    "specialty": "Dietetics"
  };
}

// Breadcrumb
function getBreadcrumbSchema(nomePagina, url) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "EvaluaOS", "item": DOMAIN },
      { "@type": "ListItem", "position": 2, "name": nomePagina, "item": url }
    ]
  };
}

// ==========================================
// 📝 1. DEFINIÇÃO DAS ROTAS DO EVALUAOS
// ==========================================
const routes = [
  // 🟢 1. Página Principal (Landing Page)
  {
    path: '',
    title: 'EvaluaOS | Sistema Inteligente de Avaliação Antropométrica & ISAK',
    image: `${DOMAIN}/Logo_png.png`,
    desc: 'O software definitivo para nutricionistas e personal trainers. Crie laudos antropométricos, gráficos de evolução e somatocarta de alta precisão em segundos.',
    schemasExtra: [getSoftwareSchema(), getOrganizationSchema()]
  },

  // 🔵 2. Página de Login / Acesso do Avaliador
  {
    path: 'login',
    title: 'Acessar Conta | EvaluaOS Antropometria',
    image: `${DOMAIN}/Logo_png.png`,
    desc: 'Acesse seu painel do EvaluaOS para gerenciar pacientes, realizar novas avaliações antropométricas e acompanhar relatórios de evolução.'
  },

  // 🟣 3. Página de Cadastro / Registro
  {
    path: 'cadastro',
    title: 'Criar Conta Grátis | EvaluaOS Antropometria',
    image: `${DOMAIN}/Logo_png.png`,
    desc: 'Cadastre-se no EvaluaOS e transforme suas avaliações físicas com tecnologia e padrão internacional ISAK.'
  },

  // 🟠 4. Laudo Antropométrico do Paciente (Visitante / WhatsApp)
  {
    path: 'laudo-antropometrico',
    title: 'Laudo Antropométrico de Composição Corporal | EvaluaOS',
    image: `${DOMAIN}/Logo_png.png`,
    desc: 'Confira os resultados completos da sua avaliação antropométrica: percentual de gordura, massas corporais, somatotipo e índices de saúde.',
    schemasExtra: [getMedicalReportSchema("Laudo Antropométrico Oficial", `${DOMAIN}/laudo-antropometrico`)]
  },

  // 🔴 5. Relatório de Evolução (Visitante / WhatsApp)
  {
    path: 'evolucao',
    title: 'Evolução Antropométrica e Comparativo Temporal | EvaluaOS',
    image: `${DOMAIN}/Logo_png.png`,
    desc: 'Acompanhe seu progresso ao longo das consultas: gráficos comparativos de peso, % de gordura, massa muscular e trajetória na somatocarta.',
    schemasExtra: [getMedicalReportSchema("Relatório de Evolução Temporal", `${DOMAIN}/evolucao`)]
  }
];

// ==========================================
// 🚀 INICIALIZAÇÃO DO ROBÔ DE SEO / WHATSAPP
// ==========================================
const distPath = path.resolve('dist');
const baseTemplatePath = path.join(distPath, 'index.html');

if (!fs.existsSync(baseTemplatePath)) {
  console.error('❌ Erro: A pasta "dist" ou o arquivo "dist/index.html" não foi encontrado. Execute "npm run build" primeiro!');
  process.exit(1);
}

const baseTemplate = fs.readFileSync(baseTemplatePath, 'utf-8');

console.log('🚀 Iniciando Injetor Físico de Meta Tags para WhatsApp & Google (EvaluaOS)...');

routes.forEach(route => {
  const safePath = route.path.startsWith('/') ? route.path.slice(1) : route.path;

  const fileAsHtml = path.join(distPath, `${safePath}.html`);
  const dirAsIndex = safePath === '' ? path.join(distPath, 'index.html') : path.join(distPath, safePath, 'index.html');

  let targetFile = '';
  let fileContent = '';

  if (fs.existsSync(dirAsIndex)) {
    targetFile = dirAsIndex;
    fileContent = fs.readFileSync(dirAsIndex, 'utf-8');
  } else if (fs.existsSync(fileAsHtml)) {
    targetFile = fileAsHtml;
    fileContent = fs.readFileSync(fileAsHtml, 'utf-8');
  } else {
    targetFile = safePath === '' ? path.join(distPath, 'index.html') : path.join(distPath, safePath, 'index.html');
    fileContent = baseTemplate;
  }

  const urlAbsoluta = safePath === '' ? DOMAIN : `${DOMAIN}/${safePath}`;

  // Schemas da Página
  const breadcrumbSchema = getBreadcrumbSchema(route.title, urlAbsoluta);
  let schemasHTML = `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>\n`;

  if (route.schemasExtra && route.schemasExtra.length > 0) {
    route.schemasExtra.forEach(schema => {
      schemasHTML += `<script type="application/ld+json">${JSON.stringify(schema)}</script>\n`;
    });
  }

  // 🧹 Limpeza de Tags Antigas/Genéricas no Template
  let cleanHtml = fileContent
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '') 
    .replace(/<meta(?=[^>]*name=['"]description['"])[^>]*>/gi, '') 
    .replace(/<meta(?=[^>]*property=['"]og:[^'"]+['"])[^>]*>/gi, '') 
    .replace(/<link(?=[^>]*rel=['"]canonical['"])[^>]*>/gi, '')
    .replace(/<meta(?=[^>]*name=['"]twitter:[^'"]+['"])[^>]*>/gi, ''); 

  // 📸 Imagem Garantida para WhatsApp (Redimensionamento Automático CDN)
  const imgUrl = route.image || LOGO_SAAS;
  const imgCleanUrl = imgUrl.replace(/^https?:\/\//i, '');
  const imgWhatsApp = `https://i0.wp.com/${imgCleanUrl}?w=1200&strip=all&quality=90`;

  // 🏷️ Injeção das Tags Perfeitas para WhatsApp, Facebook, LinkedIn e Twitter
  const tagsCorretas = `
    <title>${route.title}</title>
    <meta name="description" content="${route.desc}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${urlAbsoluta}" />
    
    <!-- Open Graph (WhatsApp, Facebook, LinkedIn) -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="EvaluaOS" />
    <meta property="og:title" content="${route.title}" />
    <meta property="og:description" content="${route.desc}" />
    <meta property="og:image" content="${imgWhatsApp}" />
    <meta property="og:image:secure_url" content="${imgWhatsApp}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:url" content="${urlAbsoluta}" />

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${route.title}" />
    <meta name="twitter:description" content="${route.desc}" />
    <meta name="twitter:image" content="${imgWhatsApp}" />
    
    ${schemasHTML}
  `;

  const finalHtml = cleanHtml.replace('</head>', `${tagsCorretas}\n</head>`);

  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.writeFileSync(targetFile, finalHtml);

  console.log(`✅ [${safePath || 'Home'}] Gerado HTML estático com Capa de WhatsApp e Schemas!`);
});