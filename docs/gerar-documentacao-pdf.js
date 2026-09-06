const fs = require('fs');
const path = require('path');

const output = path.join(__dirname, 'funcionalidades-caixa-de-memorias.pdf');
const W = 595.28, H = 841.89, M = 46;
const navy = [0.15, 0.27, 0.33], blue = [0.16, 0.36, 0.54];
const teal = [0.16, 0.62, 0.56], coral = [0.91, 0.36, 0.46];
let pages = [], ops = [], y = H - M;

function esc(s) { return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
function rgb(c) { return c.map(n => n.toFixed(3)).join(' ') + ' rg'; }
function rect(x, yy, w, h, c) { ops.push(`${rgb(c)} ${x} ${yy} ${w} ${h} re f`); }
function text(x, yy, size, str, bold = false, c = navy) {
  ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${c.map(n => n.toFixed(3)).join(' ')} rg 1 0 0 1 ${x} ${yy} Tm (${esc(str)}) Tj ET`);
}
function line(x1, y1, x2, y2, c = [0.82, 0.85, 0.85], width = 0.7) { ops.push(`${c.map(n => n.toFixed(3)).join(' ')} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`); }
function wrap(str, size, max) {
  const words = str.split(/\s+/), lines = []; let line = '';
  for (const word of words) { const test = line ? `${line} ${word}` : word; if (test.length * size * 0.49 > max && line) { lines.push(line); line = word; } else line = test; }
  if (line) lines.push(line); return lines;
}
function para(str, size = 10.5, leading = 15, color = navy) {
  for (const l of wrap(str, size, W - 2 * M)) { text(M, y, size, l, false, color); y -= leading; }
  y -= 7;
}
function heading(str, color = blue) { if (y < 120) finishPage(); text(M, y, 17, str, true, color); y -= 10; line(M, y, W - M, y, [0.78, 0.83, 0.84]); y -= 19; }
function item(title, body, color = blue) { if (y < 110) finishPage(); rect(M, y - 5, 5, 35, color); text(M + 15, y + 18, 11.5, title, true); y -= 1; const lines = wrap(body, 10, W - M - (M + 15)); for (const l of lines) { text(M + 15, y, 10, l); y -= 14; } y -= 12; }
function footer(n) { line(M, 32, W - M, 32); text(M, 19, 8.5, 'Caixa de Memórias - Villa do Conde', false, [0.35, 0.42, 0.44]); text(W - M - 48, 19, 8.5, `Página ${n}`, false, [0.35, 0.42, 0.44]); }
function finishPage() { footer(pages.length + 1); pages.push(ops.join('\n')); ops = []; y = H - M; }

// Capa
rect(0, 0, W, H, [0.969, 0.961, 0.941]);
rect(0, H - 150, W, 150, blue); rect(0, H - 164, W, 14, teal);
text(M, H - 77, 29, 'Caixa de Memórias', true, [1, 1, 1]);
text(M, H - 106, 15, 'Funcionalidades do projeto', false, [0.92, 0.96, 0.97]);
rect(M, H - 286, 74, 74, teal); text(M + 19, H - 260, 28, 'CM', true, [1, 1, 1]);
text(M + 96, H - 234, 18, 'Villa do Conde', true); text(M + 96, H - 258, 12, 'Residencial Sênior', false, [0.35, 0.42, 0.44]);
y = H - 347;
para('Este documento apresenta os recursos identificados no código do projeto Caixa de Memórias. A solução apoia o cuidado centrado no morador por meio de recordações, comunicação familiar e acompanhamento de sessões.', 12, 19);
heading('Visão geral', teal);
para('A aplicação reúne uma interface web para cuidadores e familiares, perfis individuais de moradores e uma API com persistência em SQLite. A interface atual também usa armazenamento local do navegador para a experiência demonstrativa.', 10.8, 16);
rect(M, 115, W - 2 * M, 73, [0.91, 0.95, 0.94]);
text(M + 18, 160, 12, 'Públicos atendidos', true, teal);
text(M + 18, 138, 10.5, 'Cuidadores e equipe assistencial  |  Familiares  |  Moradores (uso mediado)', false);
text(M, 70, 9, 'Documento gerado em 04 de setembro de 2026.', false, [0.35, 0.42, 0.44]);
pages.push(ops.join('\n')); ops = []; y = H - M;

heading('Funcionalidades para o cuidado e a memória');
item('Perfis de moradores', 'Cadastro, edição e remoção de moradores. O perfil reúne nome, idade, quarto e diagnóstico, além de permitir consultar a galeria de memórias vinculada.');
item('Galeria multimídia', 'Registro e apresentação de fotos, áudios, músicas e vídeos. Cada item pode conter título, descrição e identificação de quem o enviou. A equipe pode adicionar vários arquivos de uma vez e excluir anexos.');
item('Modo terapêutico', 'Exibição em tela dedicada de fotos e áudios com navegação entre memórias, favorecendo sessões de reminiscência conduzidas pelo cuidador.');
item('Cine-Memória', 'Modo de exibição de vídeos em tela dedicada, com seletor de cenas e legenda baseada na descrição do registro.');
item('Telemetria clínica - TEA', 'Registro de sessões com memória ou tema utilizado, responsável, nível de engajamento, reação observada e anotações. O sistema mantém histórico por morador e calcula a Taxa de Engajamento Afetivo (TEA).', teal);
item('Acessibilidade na tela inicial', 'Alternância de alto contraste para melhorar a legibilidade da tela de seleção de moradores.', coral);

heading('Funcionalidades para familiares', coral);
item('Portal da Família', 'Área vinculada ao morador correspondente, na qual familiares podem enviar mensagens afetivas em texto, áudio, foto ou vídeo. O envio aceita anexo e apresenta confirmação ao usuário.');
item('Contas e vínculos', 'O cuidador pode criar a conta de um familiar e associá-la a um morador. O login diferencia os perfis de cuidador e família e direciona cada pessoa à área adequada.');
finishPage();

heading('Gestão, acompanhamento e serviços de backend');
item('Painel do cuidador', 'Reúne abas para anexar memórias, registrar telemetria, administrar arquivos, cadastrar moradores, cadastrar familiares e gerenciar perfis. Também permite encerrar a sessão.');
item('Fluxo de aprovação', 'A API prevê que memórias e mensagens recebidas tenham status pendente e sejam aprovadas pela equipe antes de se tornarem disponíveis.');
item('Indicadores de gestão', 'O endpoint de dashboard consolida total de moradores ativos, memórias ativas, interações dos últimos 30 dias, itens pendentes, engajamento por morador, categorias e últimas interações.');
item('Histórico de interações', 'A API registra reproduções de memórias e interações de cuidado, incluindo reação observada, nível de engajamento, duração e observações.');
item('Filtros e consulta de memórias', 'Os serviços permitem listar memórias por morador, categoria, tipo de mídia e status, além de recuperar os anexos de uma memória específica.');
item('Segurança e operação', 'O backend disponibiliza autenticação por token, cabeçalhos de segurança, CORS, logs de requisição, limite para payloads e rota de verificação de saúde do serviço.', teal);

heading('Arquitetura identificada', teal);
para('Frontend em Next.js/React com estilos CSS e Tailwind disponível no projeto. Backend em Node.js/Express, com banco de dados SQLite e rotas para autenticação, moradores, memórias, interações, familiares, mensagens e dashboard.', 10.5, 16);

heading('Observação de escopo', coral);
para('Algumas telas da interface demonstrativa persistem dados no localStorage do navegador. Em paralelo, o repositório já contém API e esquema de banco para centralizar dados, aprovações e indicadores em um ambiente integrado.', 10.5, 16);
rect(M, 120, W - 2 * M, 58, [0.94, 0.94, 0.91]);
text(M + 16, 151, 11, 'Resumo', true, [0.45, 0.39, 0.18]);
text(M + 16, 132, 10, 'Uma plataforma para preservar histórias, aproximar famílias e apoiar sessões de cuidado.', false, [0.35, 0.32, 0.20]);
finishPage();

const objects = [];
const add = s => { objects.push(s); return objects.length; };
const font1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
const font2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
// Reserva o objeto /Pages antes de criar as páginas-filhas, pois cada /Page
// precisa apontar para ele no campo /Parent.
const pagesId = add('');
const pageIds = pages.map(content => { const contentId = add(`<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`); return { contentId }; });
for (const p of pageIds) p.id = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> >> /Contents ${p.contentId} 0 R >>`);
objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(p => `${p.id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
const catalog = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'; const offsets = [0];
objects.forEach((obj, i) => { offsets.push(Buffer.byteLength(pdf, 'latin1')); pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
const start = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (let i = 1; i < offsets.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${start}\n%%EOF\n`;
fs.writeFileSync(output, Buffer.from(pdf, 'latin1'));
console.log(output);
