// config/database.js
// Módulo de banco de dados usando sql.js (SQLite compilado para WebAssembly)
// Não requer compilação nativa, funciona em qualquer sistema operacional
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Caminho do arquivo do banco de dados
const dbPath = path.join(__dirname, '..', 'usuarios.db');

let db = null;

// Função para salvar o banco de dados no disco
function salvarBanco() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

// Inicializar o banco de dados de forma assíncrona
async function inicializarBanco() {
    const SQL = await initSqlJs();

    // Carregar banco existente ou criar novo
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
        console.log('Banco de dados carregado do arquivo existente.');
    } else {
        db = new SQL.Database();
        console.log('Novo banco de dados criado.');
    }

    // Criar a tabela se não existir
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            perfil TEXT NOT NULL CHECK(perfil IN ('administrador', 'operador', 'cliente')),
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Verificar se existe algum usuário
    const resultado = db.exec('SELECT COUNT(*) as count FROM usuarios');
    const count = resultado.length > 0 ? resultado[0].values[0][0] : 0;

    // Inserir usuário administrador padrão se a tabela estiver vazia
    if (count === 0) {
        console.log('Banco de dados vazio. Semeando usuário administrador padrão...');
        const salt = bcrypt.genSaltSync(10);
        const senhaHash = bcrypt.hashSync('Admin@123', salt);

        db.run(
            'INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
            ['Administrador', 'admin@sistema.com', senhaHash, 'administrador']
        );
        console.log('Usuário administrador padrão criado com sucesso.');
    }

    // Salvar o banco no disco
    salvarBanco();

    return db;
}

// Executar SELECT que retorna múltiplas linhas
function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(params);

    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

// Executar SELECT que retorna uma única linha
function queryGet(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(params);

    let row = null;
    if (stmt.step()) {
        row = stmt.getAsObject();
    }
    stmt.free();
    return row;
}

// Executar INSERT, UPDATE, DELETE
function runQuery(sql, params = []) {
    db.run(sql, params);
    
    // Obter rowid e rowsModified ANTES de exportar o banco
    const lastRowIdResult = db.exec('SELECT last_insert_rowid()');
    const lastInsertRowid = (lastRowIdResult.length > 0 && lastRowIdResult[0].values.length > 0) 
        ? lastRowIdResult[0].values[0][0] 
        : 0;
    const changes = db.getRowsModified();

    // Salvar alterações no disco
    salvarBanco();

    return {
        lastInsertRowid,
        changes
    };
}

module.exports = {
    inicializarBanco,
    queryAll,
    queryGet,
    runQuery,
    salvarBanco
};
