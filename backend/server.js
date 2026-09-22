require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos
app.use('/assets', express.static(path.join(__dirname, '../assets')));

const { inicializarTelegramBot, pararTelegramBot } = require('./telegramBot');

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/idosos', require('./routes/idosos'));
app.use('/api/memorias', require('./routes/memorias'));
app.use('/api/interacoes', require('./routes/interacoes'));
app.use('/api/familiares', require('./routes/familiares'));
app.use('/api/mensagens', require('./routes/mensagens'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/telegram', require('./routes/telegram'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), servico: 'Caixa de Memorias Digital' });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    nome: 'Caixa de Memorias Digital - API',
    versao: '1.0.0',
    instituicao: 'Villa do Conde',
    endpoints: [
      '/api/auth',
      '/api/idosos',
      '/api/memorias',
      '/api/interacoes',
      '/api/familiares',
      '/api/mensagens',
      '/api/dashboard'
    ]
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Banco: ${process.env.DATABASE_PATH || './database/caixa_memorias.db'}`);
  inicializarTelegramBot();
});

const finalizar = async () => {
  await pararTelegramBot();
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', finalizar);
process.on('SIGTERM', finalizar);