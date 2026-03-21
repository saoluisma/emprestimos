// Configuração do Firebase
const firebaseConfig = {
    databaseURL: "https://anticassino-2f086-default-rtdb.firebaseio.com/"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Elementos do DOM
const cpfInput = document.getElementById('cpf');
const telefoneInput = document.getElementById('telefone');
const form = document.getElementById('lead-form');
const pacoteSelect = document.getElementById('pacote');
const precoDisplay = document.getElementById('preco-display');
const submitBtn = document.getElementById('submit-btn');

// Rolagem suave para âncoras
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.querySelector('.site-header').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Seleção de pacote pelos botões
document.querySelectorAll('[data-pacote]').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const pacote = this.getAttribute('data-pacote');
        pacoteSelect.value = pacote;
        
        // Atualizar preço
        let preco = 'R$ 139,99';
        if (pacote === 'intermediario') preco = 'R$ 220';
        if (pacote === 'completo') preco = 'R$ 500';
        precoDisplay.textContent = preco;
        
        // Rolagem suave para o formulário
        const formTitle = document.getElementById('form-title');
        const headerHeight = document.querySelector('.site-header').offsetHeight;
        const formPosition = formTitle.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
        
        window.scrollTo({
            top: formPosition,
            behavior: 'smooth'
        });
        
        // Foco no formulário
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
});

// Funções de formatação
function apenasDigitos(valor) {
    return valor.replace(/\D+/g, '');
}

function formatarCPF(valor) {
    const digitos = apenasDigitos(valor).slice(0, 11);
    if (digitos.length <= 3) return digitos;
    if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
    if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9, 11)}`;
}

function formatarTelefone(valor) {
    const digitos = apenasDigitos(valor).slice(0, 11);
    if (digitos.length <= 10) {
        return digitos
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digitos
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
}

// Validação de CPF
function validarCPF(cpf) {
    const digitos = apenasDigitos(cpf);
    if (!digitos || digitos.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digitos)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(digitos.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(digitos.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(digitos.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(digitos.charAt(10))) return false;
    
    return true;
}

// Funções de UI
function mostrarErro(input, mensagem) {
    input.setCustomValidity(mensagem);
    input.reportValidity();
}

function mostrarLoading(mostrar) {
    if (mostrar) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
    } else {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

function mostrarSucesso(mensagem) {
    alert(mensagem);
}

// Event Listeners para formatação
if (cpfInput) {
    cpfInput.addEventListener('input', (evento) => {
        const cursor = evento.target.selectionStart;
        evento.target.value = formatarCPF(evento.target.value);
        evento.target.setSelectionRange(cursor, cursor);
        evento.target.setCustomValidity('');
    });
    
    cpfInput.addEventListener('blur', (evento) => {
        if (evento.target.value && !validarCPF(evento.target.value)) {
            mostrarErro(evento.target, 'CPF inválido');
        }
    });
}

if (telefoneInput) {
    telefoneInput.addEventListener('input', (evento) => {
        const cursor = evento.target.selectionStart;
        evento.target.value = formatarTelefone(evento.target.value);
        evento.target.setSelectionRange(cursor, cursor);
    });
}

if (pacoteSelect) {
    pacoteSelect.addEventListener('change', (evento) => {
        let preco = 'R$ 139,99';
        if (evento.target.value === 'intermediario') preco = 'R$ 220';
        if (evento.target.value === 'completo') preco = 'R$ 500';
        precoDisplay.textContent = preco;
    });
}

// Envio para Firebase
async function enviarParaFirebase(dados) {
    try {
        const timestamp = new Date().toISOString();
        const leadRef = database.ref('leads/' + timestamp.replace(/[^a-zA-Z0-9]/g, '_'));
        
        await leadRef.set({
            ...dados,
            timestamp: timestamp,
            ip: await obterIP()
        });
        
        return true;
    } catch (error) {
        console.error('Erro ao enviar para Firebase:', error);
        return false;
    }
}

// Função para obter IP (simplificada)
async function obterIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'Não disponível';
    }
}

// Submit do formulário
if (form) {
    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        
        // Validações
        const nome = document.getElementById('nome');
        const email = document.getElementById('email');
        const cpfValido = validarCPF(cpfInput.value);
        
        if (!cpfValido) {
            mostrarErro(cpfInput, 'Informe um CPF válido para continuar');
            return;
        }
        
        if (!nome.value.trim()) { 
            mostrarErro(nome, 'Informe seu nome completo'); 
            return; 
        }
        
        if (!email.validity.valid) { 
            mostrarErro(email, 'Informe um e‑mail válido'); 
            return; 
        }
        
        if (!pacoteSelect.value) { 
            mostrarErro(pacoteSelect, 'Selecione um pacote'); 
            return; 
        }

        // Preparar dados
        const dados = {
            nome: nome.value.trim(),
            cpf: apenasDigitos(cpfInput.value),
            email: email.value.trim(),
            telefone: apenasDigitos(telefoneInput.value || ''),
            pacote: pacoteSelect.value,
            preco: precoDisplay.textContent,
            userAgent: navigator.userAgent,
            pagina: window.location.href
        };

        // Mostrar loading
        mostrarLoading(true);

        try {
            // Enviar para Firebase
            const sucesso = await enviarParaFirebase(dados);
            
            if (sucesso) {
                // Salvar no localStorage também
                localStorage.setItem('lead', JSON.stringify(dados));
                
                // Mostrar sucesso
                mostrarSucesso(`✅ Dados enviados com sucesso! Pacote ${pacoteSelect.value} selecionado. Em breve entraremos em contato.`);
                
                // Redirecionar suavemente
                setTimeout(() => {
                    const assinarSection = document.getElementById('assinar');
                    const headerHeight = document.querySelector('.site-header').offsetHeight;
                    const sectionPosition = assinarSection.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                    
                    window.scrollTo({
                        top: sectionPosition,
                        behavior: 'smooth'
                    });
                }, 1000);
                
                // Limpar formulário (opcional)
                // form.reset();
                
            } else {
                throw new Error('Falha ao enviar dados');
            }
            
        } catch (error) {
            console.error('Erro no envio:', error);
            alert('❌ Ocorreu um erro ao enviar seus dados. Por favor, tente novamente.');
        } finally {
            mostrarLoading(false);
        }
    });
}

// Efeitos de scroll no header
let ultimoScroll = 0;
window.addEventListener('scroll', () => {
    const header = document.querySelector('.site-header');
    const scrollAtual = window.pageYOffset;
    
    if (scrollAtual > 100) {
        header.style.background = 'rgba(15, 23, 42, 0.98)';
        header.style.backdropFilter = 'blur(20px)';
    } else {
        header.style.background = 'rgba(15, 23, 42, 0.95)';
        header.style.backdropFilter = 'blur(20px)';
    }
    
    if (scrollAtual > ultimoScroll && scrollAtual > 100) {
        header.style.transform = 'translateY(-100%)';
    } else {
        header.style.transform = 'translateY(0)';
    }
    
    ultimoScroll = scrollAtual;
});

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Site Anti Cassinos carregado com sucesso!');
    
    // Adicionar classe loaded para animações
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});