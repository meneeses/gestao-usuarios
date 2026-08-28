// middleware/rbac.js

// Middleware de controle de acesso baseado em perfis (Role-Based Access Control)
function autorizar(...perfisPermitidos) {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ erro: 'Usuário não autenticado' });
        }
        
        if (!perfisPermitidos.includes(req.usuario.perfil)) {
            return res.status(403).json({ erro: 'Acesso negado. Perfil insuficiente.' });
        }
        
        next();
    };
}

module.exports = {
    autorizar
};
