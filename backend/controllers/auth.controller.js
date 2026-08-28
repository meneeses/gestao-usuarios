// controllers/auth.controller.js
// Controller responsável pela autenticação de usuários
const { queryGet } = require('../config/database');
const bcrypt = require('bcryptjs');
const { gerarToken } = require('../middleware/auth');

function login(req, res) {
    const { email, senha } = req.body;

    // Validação básica
    if (!email || !senha) {
        return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
    }

    try {
        // Buscar usuário pelo e-mail usando consulta parametrizada
        const usuario = queryGet('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (!usuario) {
            return res.status(401).json({ erro: 'Credenciais inválidas' });
        }

        // Verificar a senha com bcrypt
        const senhaValida = bcrypt.compareSync(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ erro: 'Credenciais inválidas' });
        }

        // Gerar token JWT
        const token = gerarToken(usuario);

        // Retornar resposta removendo a senha dos dados do usuário
        const { senha: _, ...usuarioSemSenha } = usuario;

        return res.status(200).json({
            mensagem: 'Login realizado com sucesso',
            token,
            usuario: usuarioSemSenha
        });

    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
}

module.exports = {
    login
};
