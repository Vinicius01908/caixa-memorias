const express = require('express');
const db = require('../database/db');
const router = express.Router();

// Listar familiares
router.get('/', async (req, res) => {
  try {
    const familiares = await db.allAsync('SELECT * FROM familiares WHERE ativo = 1 ORDER BY nome');
    res.json(familiares);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Criar familiar
router.post('/', async (req, res) => {
  try {
    const { nome, grau_parentesco, telefone, email, whatsapp, permissao_acesso } = req.body;
    const result = await db.runAsync(
      `INSERT INTO familiares (nome, grau_parentesco, telefone, email, whatsapp, permissao_acesso)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nome, grau_parentesco, telefone, email, whatsapp, permissao_acesso || 'visualizar']
    );
    res.status(201).json({ id: result.id, mensagem: 'Familiar cadastrado' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Vincular familiar a idoso
router.post('/vincular', async (req, res) => {
  try {
    const { idoso_id, familiar_id, tipo_vinculo } = req.body;
    await db.runAsync(
      `INSERT OR IGNORE INTO vinculos (idoso_id, familiar_id, tipo_vinculo) VALUES (?, ?, ?)`,
      [idoso_id, familiar_id, tipo_vinculo || 'familiar']
    );
    res.json({ mensagem: 'Vínculo criado com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;