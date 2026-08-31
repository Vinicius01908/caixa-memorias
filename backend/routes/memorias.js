const express = require('express');
const db = require('../database/db');
const router = express.Router();

// Listar todas as memorias (com filtros)
router.get('/', async (req, res) => {
  try {
    const { idoso_id, categoria_id, tipo_midia, status = 'ativo' } = req.query;
    let sql = 'SELECT * FROM v_memorias_completas WHERE status = ?';
    const params = [status];

    if (idoso_id) { sql += ' AND idoso_id = ?'; params.push(idoso_id); }
    if (categoria_id) { sql += ' AND categoria_id = ?'; params.push(categoria_id); }
    if (tipo_midia) { sql += ' AND tipo_midia = ?'; params.push(tipo_midia); }

    sql += ' ORDER BY data_aproximada DESC';
    
    const memorias = await db.allAsync(sql, params);
    res.json(memorias);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Buscar memória por ID
router.get('/:id', async (req, res) => {
  try {
    const memoria = await db.getAsync('SELECT * FROM v_memorias_completas WHERE id = ?', [req.params.id]);
    if (!memoria) return res.status(404).json({ erro: 'Memória não encontrada' });

    const midias = await db.allAsync('SELECT * FROM midias WHERE memoria_id = ?', [req.params.id]);
    res.json({ ...memoria, midias });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Criar memória
router.post('/', async (req, res) => {
  try {
    const {
      idoso_id, titulo, descricao, data_aproximada,
      categoria_id, emocao, autor_registro, tipo_midia,
      arquivo_url, thumbnail_url
    } = req.body;

    const result = await db.runAsync(
      `INSERT INTO memorias (idoso_id, titulo, descricao, data_aproximada,
       categoria_id, emocao, autor_registro, tipo_midia, arquivo_url, thumbnail_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')`,
      [idoso_id, titulo, descricao, data_aproximada, categoria_id,
       emocao, autor_registro, tipo_midia, arquivo_url, thumbnail_url]
    );

    res.status(201).json({ id: result.id, mensagem: 'Memória enviada para aprovação' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Aprovar memória
router.put('/:id/aprovar', async (req, res) => {
  try {
    const { cuidador_id } = req.body;
    await db.runAsync(
      `UPDATE memorias SET status = 'ativo', aprovado_por = ?, data_aprovacao = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [cuidador_id, req.params.id]
    );
    res.json({ mensagem: 'Memória aprovada com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Reproduzir memória (registra interação)
router.post('/:id/reproduzir', async (req, res) => {
  try {
    const { idoso_id, cuidador_id } = req.body;
    await db.runAsync(
      `INSERT INTO interacoes (idoso_id, memoria_id, cuidador_id, tipo_interacao, nivel_engajamento)
       VALUES (?, ?, ?, 'reproducao', 3)`,
      [idoso_id, req.params.id, cuidador_id]
    );
    res.json({ mensagem: 'Reprodução registrada' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;