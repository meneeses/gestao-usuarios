// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-gestao-usuarios-2024';
const TOKEN_EXPIRATION = '1h';

// Middleware de verificação do JWT
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded; // { id, nome, email, perfil }
        next();
    } catch (error) {
        return res.status(401).json({ erro: 'Token inválido ou expirado' });
    }
}

// Função para gerar JWT
function gerarToken(usuario) {
    const payload = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
}

module.exports = {
    verificarToken,
    gerarToken,
    JWT_SECRET,
    TOKEN_EXPIRATION
};
