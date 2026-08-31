const express = require('express');
const db = require('../database/db');
const router = express.Router();

// Listar mensagens por idoso
router.get('/idoso/:idoso_id', async (req, res) => {
  try {
    const mensagens = await db.allAsync(
      `SELECT m.*, f.nome as familiar_nome, f.grau_parentesco
       FROM mensagens m
       JOIN familiares f ON m.familiar_id = f.id
       WHERE m.idoso_id = ? ORDER BY m.data_envio DESC`,
      [req.params.idoso_id]
    );
    res.json(mensagens);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Criar mensagem (Portal da Família)
router.post('/', async (req, res) => {
  try {
    const { idoso_id, familiar_id, tipo, conteudo, arquivo_url } = req.body;
    const result = await db.runAsync(
      `INSERT INTO mensagens (idoso_id, familiar_id, tipo, conteudo, arquivo_url, status)
       VALUES (?, ?, ?, ?, ?, 'pendente')`,
      [idoso_id, familiar_id, tipo, conteudo, arquivo_url]
    );
    res.status(201).json({ id: result.id, mensagem: 'Mensagem enviada para aprovação' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Aprovar mensagem
router.put('/:id/aprovar', async (req, res) => {
  try {
    const { cuidador_id } = req.body;
    await db.runAsync(
      `UPDATE mensagens SET status = 'aprovada', aprovado_por = ?, data_aprovacao = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [cuidador_id, req.params.id]
    );
    res.json({ mensagem: 'Mensagem aprovada' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Pendentes
router.get('/pendentes', async (req, res) => {
  try {
    const pendentes = await db.allAsync('SELECT * FROM v_mensagens_pendentes');
    res.json(pendentes);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;