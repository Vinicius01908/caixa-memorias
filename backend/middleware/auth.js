const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'villa_do_conde_memorias_2024_seguranca';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.tipo)) {
      return res.status(403).json({ erro: 'Acesso negado: permissão insuficiente' });
    }
    next();
  };
};

module.exports = { authMiddleware, requireRole, JWT_SECRET };