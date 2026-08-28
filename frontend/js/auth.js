function getToken() {
    return localStorage.getItem('token');
}

function getUsuarioLogado() {
    const userStr = localStorage.getItem('usuario');
    return userStr ? JSON.parse(userStr) : null;
}

function isAutenticado() {
    return !!getToken();
}

async function fazerLogin(email, senha) {
    const errorDiv = document.getElementById('login-error');
    const submitBtn = document.querySelector('#login-form button[type="submit"]');
    
    if (errorDiv) errorDiv.classList.add('hidden');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Aguarde...';
    }

    const { status, data, ok } = await api.login(email, senha);
    
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Entrar';
    }

    if (ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        window.location.href = 'dashboard.html';
    } else {
        if (errorDiv) {
            errorDiv.textContent = data.erro || 'Falha no login.';
            errorDiv.classList.remove('hidden');
        }
    }
}

function fazerLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const isLogin = path === '/' || path.endsWith('index.html');
    
    if (isLogin) {
        if (isAutenticado()) {
            window.location.href = 'dashboard.html';
        }
        
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                fazerLogin(
                    document.getElementById('email').value,
                    document.getElementById('senha').value
                );
            });
        }
    }
});
