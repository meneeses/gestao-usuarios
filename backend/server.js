// server.js
// Ponto de entrada da aplicação - API REST para Gestão de Usuários
const express = require('express');
const cors = require('cors');
const path = require('path');
const { inicializarBanco } = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permitir todas as origens em desenvolvimento
app.use(express.json()); // Fazer parse de corpos JSON

// Servir arquivos estáticos do diretório frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Endpoint de health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', mensagem: 'Servidor rodando normalmente' });
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Inicializar banco de dados e depois iniciar o servidor
inicializarBanco().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Servidor iniciado com sucesso na porta ${PORT}`);
        console.log(`🌐 Acesse: http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error('❌ Erro ao inicializar o banco de dados:', err);
    process.exit(1);
});
