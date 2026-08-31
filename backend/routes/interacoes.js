const express = require('express');
const db = require('../database/db');
const router = express.Router();

// Registrar nova interação
router.post('/', async (req, res) => {
  try {
    const {
      idoso_id, memoria_id, cuidador_id, tipo_interacao,
      reacao_observada, nivel_engajamento, tempo_interacao_segundos, observacoes
    } = req.body;

    const result = await db.runAsync(
      `INSERT INTO interacoes (idoso_id, memoria_id, cuidador_id, tipo_interacao,
       reacao_observada, nivel_engajamento, tempo_interacao_segundos, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [idoso_id, memoria_id, cuidador_id, tipo_interacao,
       reacao_observada, nivel_engajamento, tempo_interacao_segundos, observacoes]
    );

    res.status(201).json({ id: result.id, mensagem: 'Interação registrada' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Listar interações por idoso
router.get('/idoso/:idoso_id', async (req, res) => {
  try {
    const interacoes = await db.allAsync(
      `SELECT * FROM v_interacoes_resumo WHERE idoso_id = ? ORDER BY created_at DESC`,
      [req.params.idoso_id]
    );
    res.json(interacoes);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Resumo de engajamento
router.get('/engajamento', async (req, res) => {
  try {
    const resumo = await db.allAsync('SELECT * FROM v_engajamento_por_idoso ORDER BY media_engajamento DESC');
    res.json(resumo);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;