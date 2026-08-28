// routes/usuarios.routes.js
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const { verificarToken } = require('../middleware/auth');
const { autorizar } = require('../middleware/rbac');

// Todas as rotas de usuários requerem autenticação
router.use(verificarToken);

// GET /api/usuarios -> Apenas administrador e operador
router.get('/', autorizar('administrador', 'operador'), usuariosController.listarTodos);

// GET /api/usuarios/:id -> Qualquer perfil, mas com restrições dentro do controller
router.get('/:id', usuariosController.consultarPorId);

// POST /api/usuarios -> Apenas administrador
router.post('/', autorizar('administrador'), usuariosController.criar);

// PUT /api/usuarios/:id -> Restrições baseadas no perfil aplicadas no controller
router.put('/:id', usuariosController.atualizar);

// DELETE /api/usuarios/:id -> Apenas administrador
router.delete('/:id', autorizar('administrador'), usuariosController.excluir);

module.exports = router;
