const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'Especificacao-Requisitos-Caixa-de-Memorias.pdf');

// Inicializa o documento PDF em formato A4
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true,
  info: {
    Title: 'Documento de Requisitos de Software - Caixa de Memórias Digital',
    Author: 'Equipe de Engenharia de Software & Villa do Conde',
    Subject: 'Especificação de Requisitos Funcionais, Clínicos e Não-Funcionais',
    Keywords: 'Requisitos, Terapia de Reminiscência, Gerontologia, Alzheimer, Telegram Bot, Supabase',
    CreationDate: new Date()
  }
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Paleta de cores oficial do projeto
const primary = '#2A5D8A';    // Azul Profundo / Institucional
const secondary = '#2A9D8F';  // Verde Sálvia / Saúde e Cura
const coral = '#E85D75';      // Rosa Coral / Afeto e Ação
const dark = '#264653';       // Ardósia Escura / Texto Principal
const muted = '#666666';      // Cinza Médio / Apoio
const bgLight = '#F8F5F0';    // Bege Claro Acolhedor
const borderLight = '#E2DDD5';

// Helpers de layout
function checkPageBreak(neededHeight = 80) {
  if (doc.y + neededHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    drawPageHeader();
  }
}

function drawPageHeader() {
  doc.save();
  doc.fontSize(8).fillColor(muted).font('Helvetica');
  doc.text('Caixa de Memórias Digital — Documento de Requisitos de Software (SRS)', 50, 25);
  doc.text('Residencial Sênior Villa do Conde', 380, 25, { align: 'right', width: 165 });
  doc.strokeColor(borderLight).lineWidth(0.5).moveTo(50, 38).lineTo(545, 38).stroke();
  doc.restore();
  doc.y = 55;
}

function sectionHeader(title, icon = '') {
  checkPageBreak(60);
  doc.moveDown(0.8);
  const currentY = doc.y;
  doc.rect(50, currentY, 4, 22).fill(secondary);
  doc.fontSize(16).fillColor(dark).font('Helvetica-Bold');
  doc.text(`${icon ? icon + ' ' : ''}${title}`, 62, currentY + 3);
  doc.moveDown(0.6);
  doc.strokeColor(borderLight).lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.8);
}

function subSectionHeader(title) {
  checkPageBreak(40);
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor(primary).font('Helvetica-Bold');
  doc.text(title, 50, doc.y);
  doc.moveDown(0.4);
}

function paragraph(text, options = {}) {
  checkPageBreak(25);
  doc.fontSize(10).fillColor(dark).font('Helvetica').lineGap(3);
  doc.text(text, { align: 'justify', ...options });
  doc.moveDown(0.5);
}

function bulletItem(boldPrefix, text) {
  checkPageBreak(30);
  const startY = doc.y;
  doc.circle(56, startY + 5, 2.5).fill(secondary);
  doc.fontSize(10).fillColor(dark).font('Helvetica-Bold');
  doc.text(boldPrefix, 66, startY, { continued: true, lineGap: 3 });
  doc.font('Helvetica').fillColor(dark).text(` ${text}`, { align: 'justify' });
  doc.moveDown(0.4);
}

function infoCard(title, text, borderColor = primary, bgColor = bgLight) {
  checkPageBreak(70);
  const startY = doc.y;
  const padding = 12;
  const width = 495;
  
  // Mede a altura necessária
  doc.font('Helvetica').fontSize(9.5);
  const textHeight = doc.heightOfString(text, { width: width - (padding * 2) - 8, lineGap: 2.5 });
  const totalHeight = textHeight + (title ? 28 : 22);

  doc.save();
  doc.roundedRect(50, startY, width, totalHeight, 6).fill(bgColor);
  doc.roundedRect(50, startY, 4, totalHeight, 2).fill(borderColor);
  doc.strokeColor(borderLight).lineWidth(0.5).roundedRect(50, startY, width, totalHeight, 6).stroke();
  
  if (title) {
    doc.fontSize(10.5).fillColor(borderColor).font('Helvetica-Bold');
    doc.text(title, 62, startY + padding);
    doc.fontSize(9.5).fillColor(dark).font('Helvetica').lineGap(2.5);
    doc.text(text, 62, startY + padding + 16, { width: width - (padding * 2) - 8, align: 'justify' });
  } else {
    doc.fontSize(9.5).fillColor(dark).font('Helvetica').lineGap(2.5);
    doc.text(text, 62, startY + padding, { width: width - (padding * 2) - 8, align: 'justify' });
  }
  doc.restore();

  doc.y = startY + totalHeight + 10;
}

function requirementItem(code, name, priority, description) {
  checkPageBreak(65);
  const startY = doc.y;
  const width = 495;
  const pColor = priority === 'Alta' ? coral : (priority === 'Média' ? primary : secondary);

  doc.save();
  doc.roundedRect(50, startY, width, 22, 4).fill('#EAE6DF');
  doc.fontSize(10).fillColor(dark).font('Helvetica-Bold');
  doc.text(`[${code}] ${name}`, 58, startY + 5);
  
  // Badge de prioridade
  doc.roundedRect(460, startY + 3, 75, 16, 8).fill(pColor);
  doc.fontSize(8).fillColor('#FFFFFF').font('Helvetica-Bold');
  doc.text(`Prioridade ${priority}`, 460, startY + 7, { width: 75, align: 'center' });
  doc.restore();

  doc.y = startY + 28;
  doc.fontSize(9.5).fillColor(dark).font('Helvetica').lineGap(2.5);
  doc.text(description, 58, doc.y, { width: 480, align: 'justify' });
  doc.moveDown(0.7);
}

// ==========================================
// PÁGINA 1: CAPA INSTITUCIONAL ELEGANTE
// ==========================================
doc.rect(0, 0, doc.page.width, doc.page.height).fill(bgLight);

// Banner Superior
doc.rect(0, 0, doc.page.width, 220).fill(primary);
doc.rect(0, 220, doc.page.width, 10).fill(secondary);

// Logotipo / Emblema CM
doc.save();
doc.roundedRect(50, 45, 60, 60, 12).fill('#FFFFFF');
doc.fontSize(26).fillColor(primary).font('Helvetica-Bold');
doc.text('CM', 50, 60, { width: 60, align: 'center' });
doc.restore();

doc.fontSize(28).fillColor('#FFFFFF').font('Helvetica-Bold');
doc.text('Caixa de Memórias Digital', 125, 52);

doc.fontSize(14).fillColor('#D8E5F0').font('Helvetica');
doc.text('Sistema Integrado de Terapia de Reminiscência e Conexão Familiar', 125, 86);

doc.fontSize(11).fillColor('#FFFFFF').font('Helvetica');
doc.text('Residencial Sênior Villa do Conde • Plataforma Assistencial 2.0', 125, 110);

// Cartão Central de Identificação do Documento
const cardY = 260;
doc.save();
doc.roundedRect(50, cardY, 495, 145, 8).fill('#FFFFFF');
doc.strokeColor(borderLight).lineWidth(1).roundedRect(50, cardY, 495, 145, 8).stroke();
doc.roundedRect(50, cardY, 6, 145, 3).fill(coral);

doc.fontSize(13).fillColor(dark).font('Helvetica-Bold');
doc.text('ESPECIFICAÇÃO DE REQUISITOS DE SOFTWARE (SRS)', 70, cardY + 18);

doc.strokeColor(borderLight).lineWidth(0.5).moveTo(70, cardY + 38).lineTo(525, cardY + 38).stroke();

doc.fontSize(9.5).fillColor(muted).font('Helvetica');
doc.text('Versão do Documento:', 70, cardY + 48);
doc.text('Data de Referência:', 70, cardY + 66);
doc.text('Status:', 70, cardY + 84);
doc.text('Autor / Responsável:', 70, cardY + 102);
doc.text('Público-Alvo:', 70, cardY + 120);

doc.fillColor(dark).font('Helvetica-Bold');
doc.text('2.0 (Versão Oficial Consolidada)', 200, cardY + 48);
doc.text('Setembro de 2026', 200, cardY + 66);
doc.text('Aprovado para Produção / Clínico', 200, cardY + 84);
doc.text('Equipe Multidisciplinar & Engenharia de Software', 200, cardY + 102);
doc.text('Cuidadores, Enfermagem, Psicologia, Gestão e Famílias', 200, cardY + 120);
doc.restore();

// Resumo Executivo na Capa
doc.y = 430;
doc.fontSize(14).fillColor(dark).font('Helvetica-Bold');
doc.text('Sumário Executivo', 50, doc.y);
doc.moveDown(0.4);
doc.strokeColor(secondary).lineWidth(2).moveTo(50, doc.y).lineTo(180, doc.y).stroke();
doc.moveDown(0.8);

paragraph(
  'A "Caixa de Memórias Digital" é uma tecnologia assistiva e clínica desenvolvida sob medida para a Instituição de Longa Permanência para Idosos (ILPI) Villa do Conde. O sistema tem como propósito fundamental desacelerar os impactos das demências e declínios cognitivos (como a Doença de Alzheimer) por meio da Terapia de Reminiscência Digital (TRD), integrando ativamente o ecossistema familiar via automação com Telegram Bot e gerando telemetria clínica quantificável (Taxa de Engajamento Afetivo - TEA).'
);

infoCard(
  'Princípio Clínico-Assistencial:',
  'O resgate das memórias biográficas consolidadas ativa conexões neurais profundas associadas à identidade e às emoções. Através de estímulos multissensoriais (fotografias familiares, cantigas do passado, mensagens de voz de netos e vídeos de confraternizações), reduz-se a ansiedade, os episódios de agitação psicomotora e o sentimento de despersonalização comum no confinamento institucional.',
  secondary
);

// ==========================================
// PÁGINA 2: ESCOPO E ARQUITETURA
// ==========================================
doc.addPage();
drawPageHeader();

sectionHeader('1. Escopo e Objetivos do Projeto');

paragraph(
  'O projeto abrange uma solução completa composta por uma aplicação web responsiva (Next.js), uma API de microsserviços (Node.js/Express), um banco de dados relacional e repositório de mídias em nuvem (Supabase) e um canal de mensageria conversacional via Telegram Bot.'
);

subSectionHeader('1.1. Objetivos Estratégicos');
bulletItem('Apoio Clínico à Reminiscência:', 'Fornecer aos cuidadores uma interface imersiva, sem distrações, para conduzir sessões de resgate memorial individuais ou em grupo.');
bulletItem('Aproximação Familiar Contínua:', 'Superar a barreira da distância geográfica permitindo que parentes enviem fotos, áudios carinhosos e vídeos pelo aplicativo que já usam diariamente (Telegram).');
bulletItem('Segurança e Curadoria de Conteúdo:', 'Garantir que nenhum conteúdo externo seja exibido diretamente ao idoso sem a prévia moderação e validação da equipe de enfermagem/cuidado.');
bulletItem('Telemetria e Acompanhamento Evolutivo:', 'Mensurar a Taxa de Engajamento Afetivo (TEA) em cada sessão, gerando dados que auxiliam na avaliação neurológica e geriátrica.');

sectionHeader('2. Perfis de Usuários (Atores do Sistema)');

requirementItem('AT-01', 'Morador / Residente (Público Beneficiário)', 'Alta',
  'Idoso residente na instituição, com graus variados de preservação cognitiva. Interage com o sistema de forma mediada através do "Modo Terapêutico", com foco em estímulo auditivo, visual e afetivo sem necessidade de alfabetização digital.');

requirementItem('AT-02', 'Cuidador / Equipe Multidisciplinar', 'Alta',
  'Profissionais de enfermagem, cuidadores, terapeutas ocupacionais e psicólogos. Responsáveis por conduzir as sessões, cadastrar e editar moradores, moderar as mídias submetidas pelo Telegram e registrar as notas clínicas da sessão TEA.');

requirementItem('AT-03', 'Familiar / Responsável', 'Alta',
  'Filhos, netos e parentes do morador. Enviam memórias multimídia diretamente pelo bot do Telegram ou pelo Portal da Família, recebendo notificações instantâneas sobre a aprovação das lembranças.');

requirementItem('AT-04', 'Administrador da Instituição', 'Média',
  'Gestor da ILPI responsável pelo gerenciamento de usuários, auditoria de acessos e acompanhamento dos indicadores globais da instituição através do Dashboard.');

// ==========================================
// PÁGINA 3: REQUISITOS FUNCIONAIS - PARTE 1
// ==========================================
doc.addPage();
drawPageHeader();

sectionHeader('3. Requisitos Funcionais (RF)');

paragraph('A seguir estão catalogados os requisitos funcionais prioritários implementados no sistema:');

requirementItem('RF-01', 'Cadastro e Gestão de Moradores', 'Alta',
  'O sistema deve permitir o cadastro, listagem, edição completa e exclusão de idosos. Cada morador possui: Nome Completo, Idade, Quarto/Leito, Diagnóstico Clínico (ex: Alzheimer Moderado, Demência Vascular) e foto de identificação.');

requirementItem('RF-02', 'Vínculo Familiar Multi-Usuário', 'Alta',
  'O sistema deve permitir associar múltiplos familiares a um mesmo morador. Cada familiar possui nome, e-mail de acesso e relação com o idoso. A exclusão de um familiar não afeta o histórico do morador.');

requirementItem('RF-03', 'Galeria Multimídia da Caixa de Memórias', 'Alta',
  'O sistema deve permitir o armazenamento e categorização de mídias em três formatos principais: Fotos (JPEG/PNG/WEBP), Áudios/Músicas (MP3/OGG/WAV) e Vídeos (MP4/WebM). Cada registro armazena título, descrição/história, tipo e autoria do registro.');

requirementItem('RF-04', 'Upload Múltiplo e Armazenamento em Nuvem', 'Alta',
  'O cuidador pode selecionar múltiplos arquivos simultaneamente para envio. O sistema armazena os arquivos de forma segura e durável no Supabase Storage (bucket "memorias-idosos"), gerando URLs públicas seguras com fallback para data-URI.');

requirementItem('RF-05', 'Modo Terapêutico Imersivo (Carrossel)', 'Alta',
  'O sistema deve prover uma tela dedicada de visualização limpa ("Modo Terapêutico"), com botões ampliados de navegação (Anterior / Próxima) e tocador integrado de áudio/música, permitindo ao cuidador projetar ou segurar o tablet na frente do idoso sem poluição visual.');

requirementItem('RF-06', 'Preservação de Foco no Modo Idoso', 'Alta',
  'Para evitar confusão e toques acidentais por parte do idoso durante a sessão, controles administrativos complexos (como botão de retorno técnico à área do cuidador) devem permanecer ocultos na tela principal de memórias do morador.');

// ==========================================
// PÁGINA 4: REQUISITOS FUNCIONAIS - PARTE 2
// ==========================================
doc.addPage();
drawPageHeader();

sectionHeader('3. Requisitos Funcionais (Continuação)');

requirementItem('RF-07', 'Integração Conversacional Telegram Bot', 'Alta',
  'O sistema deve integrar um bot oficial no Telegram (@caixa_memorias_villa_bot). Familiares podem interagir via chat para conectar seu número ao morador através do comando /start <id> ou comando /morador <id>. O bot guia o familiar com mensagens acolhedoras e formatadas.');

requirementItem('RF-08', 'Recepção Autônoma de Fotos, Áudios e Vídeos', 'Alta',
  'O bot deve escutar e processar automaticamente fotos (com ou sem legenda), mensagens de voz (gravadas pelo microfone do Telegram), arquivos de áudio, notas de vídeo circulares e vídeos anexados, baixando os buffers e salvando-os no Supabase Storage.');

requirementItem('RF-09', 'Fila de Moderação e Triagem (Aprovações)', 'Alta',
  'Toda mídia enviada pelo Telegram entra com status "pendente" na tabela telegram_submissoes. O cuidador tem uma aba exclusiva "📲 Aprovações Telegram" no painel web, onde pode visualizar a prévia, áudio ou vídeo antes de liberar.');

requirementItem('RF-10', 'Aprovação e Notificação Automática ao Familiar', 'Alta',
  'Ao clicar em "Aprovar", a mídia é transferida para a tabela oficial "memorias" do idoso e exibida no Modo Terapêutico. Simultaneamente, o bot envia uma mensagem no chat privado do familiar avisando com entusiasmo que a memória foi aceita pela equipe.');

requirementItem('RF-11', 'Recusa com Justificativa e Feedback Humano', 'Média',
  'Caso a mídia contenha conteúdo que possa desencadear ansiedade ou não seja adequada, o cuidador pode recusar informando um motivo. O familiar recebe uma mensagem educada no Telegram explicando a decisão clínica.');

requirementItem('RF-12', 'Módulo de Telemetria TEA (Taxa de Engajamento Afetivo)', 'Alta',
  'O cuidador pode registrar sessões de terapia informando: Morador, Título da Memória Utilizada, Cuidador Responsável, Nível de Engajamento (escala 1 a 5), Reação Observada (ex: Entusiasmo [1.2], Serena [1.0], Nostalgia/Choro [0.5], Desinteresse [0.2]) e Observações Clínicas.');

requirementItem('RF-13', 'Cálculo e Histórico Longitudinal TEA', 'Alta',
  'O sistema calcula a média ponderada do engajamento histórico de cada morador: (Engajamento * Multiplicador de Emoção) / Total de Sessões, permitindo identificar quais estímulos geram melhores resultados terapêuticos.');

// ==========================================
// PÁGINA 5: REQUISITOS NÃO-FUNCIONAIS E DADOS
// ==========================================
doc.addPage();
drawPageHeader();

sectionHeader('4. Requisitos Não-Funcionais (RNF)');

requirementItem('RNF-01', 'Acessibilidade e Gerontotecnologia (WCAG 2.1)', 'Alta',
  'A interface para o morador deve empregar alto contraste de cores (WCAG AAA), tipografia com tamanho mínimo de 16px e alvos de toque com no mínimo 48x48px para mitigar tremores e dificuldades motoras senis.');

requirementItem('RNF-02', 'Disponibilidade e Conectividade Resiliente', 'Alta',
  'O polling do Telegram Bot deve forçar resolução em IPv4 (family: 4) para evitar falhas de rota e timeouts (ETIMEDOUT) em redes Windows. O servidor implementa Encerramento Gracioso (Graceful Shutdown) para liberar conexões.');

requirementItem('RNF-03', 'Desempenho e Timeout de Segurança', 'Média',
  'As consultas à API e ao Supabase possuem timeout de segurança em 5 segundos com fallbacks demonstrativos em memória/LocalStorage, impedindo que a tela do cuidador congele em caso de instabilidade na internet.');

requirementItem('RNF-04', 'Segurança da Informação e Privacidade (LGPD)', 'Alta',
  'Fotos e dados clínicos dos idosos são armazenados com segurança, acessíveis apenas sob autenticação ou via links únicos e seguros. Nenhuma mídia externa vai a público sem moderação prévia.');

requirementItem('RNF-05', 'Arquitetura Tecnológica e Modularidade', 'Alta',
  'Frontend desacoplado desenvolvido em Next.js 14 (React) e backend modular em Node.js com Express e Supabase Client. Comunicação padronizada em REST JSON com proxy reverso configurado no NextConfig.');

sectionHeader('5. Modelo de Dados e Entidades Principais');

paragraph('A estrutura de persistência no Supabase está fundamentada nas seguintes tabelas relacionais:');

bulletItem('idosos:', 'id, nome_completo, idade, quarto, diagnostico, foto_url, created_at');
bulletItem('usuarios_sistema:', 'id, nome, email, senha (hash), idoso_id (FK opcional), role, created_at');
bulletItem('memorias:', 'id, idoso_id (FK), titulo, descricao, tipo_midia, arquivo_url, autor_registro, created_at');
bulletItem('interacoes_tea:', 'id, idoso_id (FK), memoria_titulo, cuidador_responsavel, nivel_engajamento, multiplicador_emocao, rotulo_reacao, observacoes_sessao, created_at');
bulletItem('telegram_vinculos:', 'chat_id (PK), username, nome_usuario, idoso_id (FK), updated_at');
bulletItem('telegram_submissoes:', 'id, idoso_id (FK), chat_id, nome_familiar, tipo_midia, arquivo_url, legenda, status (pendente/aprovado/recusado), motivo_recusa, created_at');

// ==========================================
// PÁGINA 6: FLUXOS DE INTERAÇÃO E CONCLUSÃO
// ==========================================
doc.addPage();
drawPageHeader();

sectionHeader('6. Fluxo Operacional: Do Envio à Sessão Clínica');

infoCard(
  'Etapa 1: Envio Familiar via Telegram',
  '1. O cuidador gera o link exclusivo do morador no painel (/cuidador) e envia no WhatsApp da família.\n2. O familiar clica no link, abre o Telegram (@caixa_memorias_villa_bot) e pressiona "Começar".\n3. O chat vincula instantaneamente o familiar ao idoso correspondente.\n4. O familiar grava um áudio afetuoso ("Oi vovó!") ou anexa uma foto do almoço de domingo.',
  primary
);

infoCard(
  'Etapa 2: Curadoria e Moderação pelo Cuidador',
  '1. O cuidador acessa a aba "📲 Aprovações Telegram" no painel web.\n2. A mídia aparece com foto/áudio/vídeo, legenda e nome do remetente.\n3. O cuidador avalia a adequação clínica e clica em "✅ Aprovar".\n4. O familiar recebe notificação imediata no Telegram confirmando a aprovação.',
  secondary
);

infoCard(
  'Etapa 3: Sessão de Reminiscência e Avaliação TEA',
  '1. O cuidador abre o perfil do idoso e clica em "Iniciar Modo Terapêutico".\n2. A foto/áudio do neto é reproduzida em tela cheia com alta clareza.\n3. O idoso sorri, se emociona e comenta sobre a família.\n4. Ao final, o cuidador registra a sessão TEA (Nota 5, Entusiasmo 1.2), retroalimentando o histórico clínico do residente.',
  coral
);

sectionHeader('7. Conclusão e Próximos Passos');

paragraph(
  'A plataforma "Caixa de Memórias Digital" representa uma convergência pioneira entre gerontologia, neuropsicologia e engenharia de software humanizada. Ao integrar o canal mais acessível e difundido entre os familiares (o Telegram) com uma interface técnica de alta confiabilidade clínica, o Residencial Villa do Conde consolida um padrão de excelência no tratamento afetivo e individualizado da pessoa idosa.'
);

doc.moveDown(1.5);
doc.strokeColor(borderLight).lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
doc.moveDown(1);

doc.fontSize(9).fillColor(muted).font('Helvetica');
doc.text('Documento gerado automaticamente pelo Sistema Antigravity / Villa do Conde Software Suite.', 50, doc.y, { align: 'center' });
doc.text('Todos os direitos reservados • Residencial Sênior Villa do Conde • 2026', 50, doc.y + 12, { align: 'center' });

// ==========================================
// NUMERAÇÃO DE PÁGINAS (RODAPÉ FINAL)
// ==========================================
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  // Não coloca rodapé na capa (página 0)
  if (i > 0) {
    doc.save();
    doc.strokeColor(borderLight).lineWidth(0.5).moveTo(50, doc.page.height - 35).lineTo(545, doc.page.height - 35).stroke();
    doc.fontSize(8.5).fillColor(muted).font('Helvetica');
    doc.text('Caixa de Memórias Digital — Residencial Villa do Conde', 50, doc.page.height - 25);
    doc.text(`Página ${i + 1} de ${range.count}`, 450, doc.page.height - 25, { align: 'right', width: 95 });
    doc.restore();
  }
}

doc.end();

writeStream.on('finish', () => {
  console.log('✅ PDF de Requisitos gerado com sucesso em: ' + outputPath);
});
