document.addEventListener('DOMContentLoaded', () => {
    if (!isAutenticado()) {
        window.location.href = 'index.html';
        return;
    }

    const consoleEl = document.getElementById('api-console');
    if (consoleEl) setApiConsole(consoleEl);

    const usuario = getUsuarioLogado();
    const isCliente = usuario.perfil === 'cliente';
    const isAdmin = usuario.perfil === 'administrador';

    // Header info
    document.getElementById('header-user-info').innerHTML = `
        <span>${usuario.nome}</span>
        <span class="badge badge-${usuario.perfil}">${usuario.perfil}</span>
    `;

    document.getElementById('btn-logout').addEventListener('click', fazerLogout);

    // Profile section
    carregarPerfil(usuario);
    document.getElementById('btn-edit-profile').addEventListener('click', () => editarProprioPerfil(usuario));

    // Users section
    if (isCliente) {
        document.getElementById('section-users').classList.add('hidden');
    } else {
        if (isAdmin) {
            const btnNew = document.getElementById('btn-new-user');
            btnNew.classList.remove('hidden');
            btnNew.addEventListener('click', abrirModalCriar);
        }
        carregarUsuarios();
    }

    // Modal
    document.getElementById('btn-cancel').addEventListener('click', fecharModal);
    document.getElementById('user-form').addEventListener('submit', salvarUsuario);
    document.getElementById('btn-clear-console').addEventListener('click', limparConsole);
});

function formatDate(isoStr) {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleString('pt-BR');
}

function carregarPerfil(usuario) {
    document.getElementById('profile-info').innerHTML = `
        <p><strong>Nome:</strong> ${usuario.nome}</p>
        <p><strong>E-mail:</strong> ${usuario.email}</p>
        <p><strong>Perfil:</strong> <span class="badge badge-${usuario.perfil}">${usuario.perfil}</span></p>
        <p><strong>Criado em:</strong> ${formatDate(usuario.criado_em)}</p>
    `;
}

async function carregarUsuarios() {
    const { ok, data } = await api.listarUsuarios();
    if (ok && data) {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            document.getElementById('empty-state').classList.remove('hidden');
        } else {
            document.getElementById('empty-state').classList.add('hidden');
            const currentUser = getUsuarioLogado();
            
            data.forEach(u => {
                const tr = document.createElement('tr');
                let actions = `<button class="btn btn-primary btn-sm" onclick="abrirModalEditar(${u.id})">Editar</button>`;
                
                if (currentUser.perfil === 'administrador' && u.id !== currentUser.id) {
                    actions += ` <button class="btn btn-danger btn-sm" onclick="confirmarExclusao(${u.id}, '${u.nome}')">Excluir</button>`;
                }
                
                tr.innerHTML = `
                    <td>${u.id}</td>
                    <td>${u.nome}</td>
                    <td>${u.email}</td>
                    <td><span class="badge badge-${u.perfil}">${u.perfil}</span></td>
                    <td>${formatDate(u.criado_em)}</td>
                    <td>${actions}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    }
}

function abrirModalCriar() {
    document.getElementById('modal-title').textContent = 'Novo Usuário';
    document.getElementById('user-id').value = '';
    document.getElementById('user-nome').value = '';
    document.getElementById('user-email').value = '';
    document.getElementById('user-senha').value = '';
    document.getElementById('user-senha').required = true;
    document.getElementById('group-perfil').classList.remove('hidden');
    
    document.getElementById('modal-alert').classList.add('hidden');
    document.getElementById('modal-form').classList.remove('hidden');
}

async function abrirModalEditar(id) {
    const { ok, data } = await api.consultarUsuario(id);
    if (ok && data) {
        document.getElementById('modal-title').textContent = 'Editar Usuário';
        document.getElementById('user-id').value = data.id;
        document.getElementById('user-nome').value = data.nome;
        document.getElementById('user-email').value = data.email;
        document.getElementById('user-senha').value = '';
        document.getElementById('user-senha').required = false;
        
        const isSelf = data.id === getUsuarioLogado().id;
        const currentUser = getUsuarioLogado();
        
        if (currentUser.perfil === 'cliente' || (isSelf && currentUser.perfil !== 'administrador')) {
            document.getElementById('group-perfil').classList.add('hidden');
        } else {
            document.getElementById('group-perfil').classList.remove('hidden');
            document.getElementById('user-perfil').value = data.perfil;
        }

        document.getElementById('modal-alert').classList.add('hidden');
        document.getElementById('modal-form').classList.remove('hidden');
    }
}

function editarProprioPerfil(usuario) {
    abrirModalEditar(usuario.id);
}

function fecharModal() {
    document.getElementById('modal-form').classList.add('hidden');
}

async function salvarUsuario(e) {
    e.preventDefault();
    const id = document.getElementById('user-id').value;
    const dados = {
        nome: document.getElementById('user-nome').value,
        email: document.getElementById('user-email').value
    };
    
    const senha = document.getElementById('user-senha').value;
    if (senha) dados.senha = senha;
    
    if (!document.getElementById('group-perfil').classList.contains('hidden')) {
        dados.perfil = document.getElementById('user-perfil').value;
    }

    const alertDiv = document.getElementById('modal-alert');
    let res;
    
    if (id) {
        res = await api.atualizarUsuario(id, dados);
    } else {
        res = await api.criarUsuario(dados);
    }

    if (res.ok) {
        fecharModal();
        if (id && id == getUsuarioLogado().id) {
            // Update local user data
            const user = getUsuarioLogado();
            const updated = {...user, ...dados};
            localStorage.setItem('usuario', JSON.stringify(updated));
            carregarPerfil(updated);
            document.getElementById('header-user-info').innerHTML = `
                <span>${updated.nome}</span>
                <span class="badge badge-${updated.perfil}">${updated.perfil}</span>
            `;
        }
        if (getUsuarioLogado().perfil !== 'cliente') {
            carregarUsuarios();
        }
    } else {
        alertDiv.textContent = res.data?.erro || 'Erro ao salvar usuário.';
        alertDiv.className = 'alert alert-error';
        alertDiv.classList.remove('hidden');
    }
}

async function confirmarExclusao(id, nome) {
    if (confirm(`Tem certeza que deseja excluir o usuário ${nome}?`)) {
        const { ok, data } = await api.excluirUsuario(id);
        if (ok) {
            carregarUsuarios();
        } else {
            alert(data?.erro || 'Erro ao excluir usuário');
        }
    }
}

function limparConsole() {
    document.getElementById('api-console').innerHTML = '';
}
