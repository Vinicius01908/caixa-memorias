const express = require('express');
const db = require('../database/db');
const router = express.Router();

// Dashboard geral
router.get('/', async (req, res) => {
  try {
    const totalIdosos = await db.getAsync('SELECT COUNT(*) as total FROM idosos WHERE ativo = 1');
    const totalMemorias = await db.getAsync("SELECT COUNT(*) as total FROM memorias WHERE status = 'ativo'");
    const totalInteracoes = await db.getAsync('SELECT COUNT(*) as total FROM interacoes WHERE created_at >= date("now", "-30 days")');
    const mensagensPendentes = await db.getAsync("SELECT COUNT(*) as total FROM mensagens WHERE status = 'pendente'");
    const memoriasPendentes = await db.getAsync("SELECT COUNT(*) as total FROM memorias WHERE status = 'pendente'");
    
    const engajamento = await db.allAsync('SELECT * FROM v_engajamento_por_idoso ORDER BY media_engajamento DESC LIMIT 10');
    const categorias = await db.allAsync('SELECT * FROM v_memorias_por_categoria');
    const ultimasInteracoes = await db.allAsync('SELECT * FROM v_interacoes_resumo ORDER BY created_at DESC LIMIT 20');

    res.json({
      resumo: {
        total_idosos: totalIdosos.total,
        total_memorias: totalMemorias.total,
        interacoes_30dias: totalInteracoes.total,
        mensagens_pendentes: mensagensPendentes.total,
        memorias_pendentes: memoriasPendentes.total
      },
      engajamento,
      categorias,
      ultimas_interacoes: ultimasInteracoes
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;