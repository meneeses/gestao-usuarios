// controllers/usuarios.controller.js
// Controller responsável pelas operações CRUD de usuários
const { queryAll, queryGet, runQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

// Listar todos os usuários (sem campo senha)
function listarTodos(req, res) {
    try {
        const usuarios = queryAll('SELECT id, nome, email, perfil, criado_em FROM usuarios');
        return res.status(200).json(usuarios);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return res.status(500).json({ erro: 'Erro ao buscar usuários' });
    }
}

// Consultar um usuário específico por ID
function consultarPorId(req, res) {
    const id = parseInt(req.params.id, 10);

    // Cliente só pode ver o próprio perfil
    if (req.usuario.perfil === 'cliente' && req.usuario.id !== id) {
        return res.status(403).json({ erro: 'Acesso negado. Perfil insuficiente.' });
    }

    try {
        const usuario = queryGet('SELECT id, nome, email, perfil, criado_em FROM usuarios WHERE id = ?', [id]);

        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        return res.status(200).json(usuario);
    } catch (error) {
        console.error('Erro ao consultar usuário:', error);
        return res.status(500).json({ erro: 'Erro ao consultar usuário' });
    }
}

// Criar novo usuário
function criar(req, res) {
    const { nome, email, senha, perfil } = req.body;

    // Validação de campos obrigatórios
    if (!nome || !email || !senha || !perfil) {
        return res.status(400).json({ erro: 'Todos os campos (nome, email, senha, perfil) são obrigatórios' });
    }

    // Validação de perfil
    const perfisValidos = ['administrador', 'operador', 'cliente'];
    if (!perfisValidos.includes(perfil)) {
        return res.status(400).json({ erro: 'Perfil inválido. Use: administrador, operador ou cliente' });
    }

    // Validação de email (regex básico)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ erro: 'Formato de e-mail inválido' });
    }

    // Validação de tamanho de senha
    if (senha.length < 6) {
        return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres' });
    }

    try {
        // Verificar se email já existe
        const usuarioExistente = queryGet('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (usuarioExistente) {
            return res.status(409).json({ erro: 'E-mail já cadastrado' });
        }

        // Criptografar senha com bcrypt (10 rounds de salt)
        const salt = bcrypt.genSaltSync(10);
        const senhaHash = bcrypt.hashSync(senha, salt);

        // Inserir usuário no banco de dados usando consulta parametrizada
        const info = runQuery(
            'INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
            [nome, email, senhaHash, perfil]
        );

        // Buscar o usuário recém-criado para retornar
        const novoUsuario = queryGet(
            'SELECT id, nome, email, perfil, criado_em FROM usuarios WHERE id = ?',
            [info.lastInsertRowid]
        );

        return res.status(201).json(novoUsuario);
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return res.status(500).json({ erro: 'Erro ao criar usuário' });
    }
}

// Atualizar dados de um usuário
function atualizar(req, res) {
    const id = parseInt(req.params.id, 10);
    const { nome, email, senha, perfil } = req.body;

    // Regras de negócio de atualização por perfil
    // Cliente só pode atualizar seu próprio cadastro
    if (req.usuario.perfil === 'cliente' && req.usuario.id !== id) {
        return res.status(403).json({ erro: 'Acesso negado' });
    }

    // Cliente não pode alterar perfil ou senha
    if (req.usuario.perfil === 'cliente' && (perfil || senha)) {
        return res.status(403).json({ erro: 'Clientes não podem alterar o próprio perfil ou senha' });
    }

    // Operador não pode alterar senha de outros usuários
    if (req.usuario.perfil === 'operador' && senha && req.usuario.id !== id) {
        return res.status(403).json({ erro: 'Operadores não podem alterar a senha de outros usuários' });
    }

    try {
        // Verificar se o usuário existe
        const usuarioAtual = queryGet('SELECT * FROM usuarios WHERE id = ?', [id]);
        if (!usuarioAtual) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        // Verificar email duplicado se estiver alterando
        if (email && email !== usuarioAtual.email) {
            const emailExiste = queryGet('SELECT id FROM usuarios WHERE email = ?', [email]);
            if (emailExiste) {
                return res.status(409).json({ erro: 'E-mail já cadastrado' });
            }
        }

        // Preparar dados para atualização
        const dadosAtualizar = {
            nome: nome || usuarioAtual.nome,
            email: email || usuarioAtual.email,
            perfil: perfil || usuarioAtual.perfil,
            senha: usuarioAtual.senha
        };

        // Se uma nova senha foi fornecida, criptografá-la
        if (senha) {
            const salt = bcrypt.genSaltSync(10);
            dadosAtualizar.senha = bcrypt.hashSync(senha, salt);
        }

        // Executar a atualização usando consulta parametrizada
        runQuery(
            'UPDATE usuarios SET nome = ?, email = ?, senha = ?, perfil = ? WHERE id = ?',
            [dadosAtualizar.nome, dadosAtualizar.email, dadosAtualizar.senha, dadosAtualizar.perfil, id]
        );

        // Buscar o usuário atualizado para retornar
        const usuarioAtualizado = queryGet(
            'SELECT id, nome, email, perfil, criado_em FROM usuarios WHERE id = ?',
            [id]
        );

        return res.status(200).json(usuarioAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        return res.status(500).json({ erro: 'Erro ao atualizar usuário' });
    }
}

// Excluir um usuário
function excluir(req, res) {
    const id = parseInt(req.params.id, 10);

    // Impedir que o administrador exclua sua própria conta
    if (req.usuario.id === id) {
        return res.status(400).json({ erro: 'Não é possível excluir sua própria conta' });
    }

    try {
        // Verificar se o usuário existe
        const usuario = queryGet('SELECT id FROM usuarios WHERE id = ?', [id]);

        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        // Excluir o usuário usando consulta parametrizada
        runQuery('DELETE FROM usuarios WHERE id = ?', [id]);

        return res.status(204).send();
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        return res.status(500).json({ erro: 'Erro ao excluir usuário' });
    }
}

module.exports = {
    listarTodos,
    consultarPorId,
    criar,
    atualizar,
    excluir
};
