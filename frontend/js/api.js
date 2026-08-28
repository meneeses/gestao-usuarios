// Cliente HTTP para comunicação com a API
const API_BASE = '/api';

// Referência ao console da API (será inicializado no dashboard)
let apiConsole = null;

function setApiConsole(element) {
  apiConsole = element;
}

// Log de requisições no console visual
function logApiCall(method, url, status, responseBody) {
  if (!apiConsole) return;
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  const statusColor = status >= 200 && status < 300 ? '#4ade80' : '#f87171';
  const entry = document.createElement('div');
  entry.style.marginBottom = '8px';
  entry.innerHTML = `
    <span style="color: #94a3b8">[${timestamp}]</span>
    <span style="color: #60a5fa; font-weight: bold">${method}</span>
    <span style="color: #e2e8f0">${url}</span>
    <span style="color: ${statusColor}">→ ${status}</span>
    <pre style="color: #cbd5e1; margin: 4px 0 0 0; font-size: 0.85em; white-space: pre-wrap;">${JSON.stringify(responseBody, null, 2)}</pre>
  `;
  apiConsole.prepend(entry);
}

// Função genérica para requisições
async function apiRequest(method, endpoint, body = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  const token = localStorage.getItem('token');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }
    
    logApiCall(method, url, response.status, data);
    
    if (response.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      if (window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
      }
    }
    
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    logApiCall(method, url, 'ERRO', { erro: error.message });
    return { status: 0, data: { erro: 'Erro de conexão com o servidor' }, ok: false };
  }
}

// Funções específicas da API
const api = {
  login: (email, senha) => apiRequest('POST', '/auth/login', { email, senha }),
  listarUsuarios: () => apiRequest('GET', '/usuarios'),
  consultarUsuario: (id) => apiRequest('GET', `/usuarios/${id}`),
  criarUsuario: (dados) => apiRequest('POST', '/usuarios', dados),
  atualizarUsuario: (id, dados) => apiRequest('PUT', `/usuarios/${id}`, dados),
  excluirUsuario: (id) => apiRequest('DELETE', `/usuarios/${id}`)
};
