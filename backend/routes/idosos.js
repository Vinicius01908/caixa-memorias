const express = require('express');
const db = require('../database/db');
const router = express.Router();

// Listar todos os idosos ativos
router.get('/', async (req, res) => {
  try {
    const idosos = await db.allAsync(
      'SELECT * FROM idosos WHERE ativo = 1 ORDER BY nome_completo'
    );
    res.json(idosos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Buscar idoso por ID com memorias e familiares
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const idoso = await db.getAsync('SELECT * FROM idosos WHERE id = ? AND ativo = 1', [id]);
    if (!idoso) return res.status(404).json({ erro: 'Idoso não encontrado' });

    const memorias = await db.allAsync(
      `SELECT m.*, c.nome as categoria_nome, c.icone as categoria_icone, c.cor as categoria_cor
       FROM memorias m 
       LEFT JOIN categorias c ON m.categoria_id = c.id
       WHERE m.idoso_id = ? AND m.status = 'ativo' 
       ORDER BY m.data_aproximada DESC`,
      [id]
    );

    const familiares = await db.allAsync(
      `SELECT f.*, v.tipo_vinculo 
       FROM familiares f
       JOIN vinculos v ON f.id = v.familiar_id
       WHERE v.idoso_id = ? AND v.autorizado = 1 AND f.ativo = 1`,
      [id]
    );

    const eventos = await db.allAsync(
      'SELECT * FROM eventos WHERE idoso_id = ? ORDER BY data_evento DESC',
      [id]
    );

    const interacoes = await db.allAsync(
      `SELECT i.*, m.titulo as memoria_titulo, u.nome as cuidador_nome
       FROM interacoes i
       LEFT JOIN memorias m ON i.memoria_id = m.id
       LEFT JOIN usuarios u ON i.cuidador_id = u.id
       WHERE i.idoso_id = ?
       ORDER BY i.created_at DESC LIMIT 20`,
      [id]
    );

    res.json({ idoso, memorias, familiares, eventos, interacoes });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Criar idoso
router.post('/', async (req, res) => {
  try {
    const {
      nome_completo, data_nascimento, idade, foto_principal,
      diagnostico, grau_dependencia, preferencias_pessoais,
      observacoes_clinicas, quarto, data_entrada
    } = req.body;

    const result = await db.runAsync(
      `INSERT INTO idosos (nome_completo, data_nascimento, idade, foto_principal,
       diagnostico, grau_dependencia, preferencias_pessoais, observacoes_clinicas,
       quarto, data_entrada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome_completo, data_nascimento, idade, foto_principal,
       diagnostico, grau_dependencia, preferencias_pessoais,
       observacoes_clinicas, quarto, data_entrada]
    );

    res.status(201).json({ id: result.id, mensagem: 'Idoso cadastrado com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Atualizar idoso
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const campos = Object.keys(req.body);
    const valores = Object.values(req.body);
    
    const setClause = campos.map(c => `${c} = ?`).join(', ');
    valores.push(id);
    
    await db.runAsync(
      `UPDATE idosos SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      valores
    );
    
    res.json({ mensagem: 'Idoso atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;