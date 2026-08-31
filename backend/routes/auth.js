const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha, tipo } = req.body;
    
    let usuario;
    if (tipo === 'familiar') {
      usuario = await db.getAsync('SELECT * FROM familiares WHERE email = ? AND ativo = 1', [email]);
    } else {
      usuario = await db.getAsync('SELECT * FROM usuarios WHERE email = ? AND ativo = 1', [email]);
    }

    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário não encontrado' });
    }

    // Em produção, usar bcrypt.compare
    // const valido = await bcrypt.compare(senha, usuario.senha_hash);
    const valido = senha === 'villa2024'; // Senha padrão para demo

    if (!valido) {
      return res.status(401).json({ erro: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { 
        id: usuario.id, 
        nome: usuario.nome, 
        email: usuario.email,
        tipo: tipo === 'familiar' ? 'familiar' : usuario.tipo 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: tipo === 'familiar' ? 'familiar' : usuario.tipo
      }
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Verificar token
router.get('/verificar', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ erro: 'Token não fornecido' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valido: true, usuario: decoded });
  } catch (err) {
    res.status(401).json({ valido: false, erro: err.message });
  }
});

module.exports = router;