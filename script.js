// Função para scroll suave até a seção de inscrição
function scrollToInscricao() {
    const inscricaoSection = document.getElementById('inscricao');
    inscricaoSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Funções para galeria de imagens e vídeos
function abrirImagem(src) {
    const modal = document.getElementById('modalGaleria');
    const modalImg = document.getElementById('modalImagem');
    const modalVideo = document.getElementById('modalVideo');

    modalImg.src = src;
    modalImg.style.display = 'block';
    modalVideo.style.display = 'none';
    modalVideo.innerHTML = '';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function abrirVideo(videoId) {
    const modal = document.getElementById('modalGaleria');
    const modalImg = document.getElementById('modalImagem');
    const modalVideo = document.getElementById('modalVideo');

    modalImg.style.display = 'none';
    modalVideo.style.display = 'block';
    modalVideo.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allowfullscreen allow="autoplay"></iframe>`;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharModal() {
    const modal = document.getElementById('modalGaleria');
    const modalVideo = document.getElementById('modalVideo');

    modal.classList.remove('active');
    modalVideo.innerHTML = '';
    document.body.style.overflow = 'auto';
}

// Fechar modal com tecla ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fecharModal();
    }
});

// Variável global para armazenar o código PIX
let pixCopiaCola = '';

// Funções de modal para LGPD e Sucesso
function abrirModalLGPD() {
    const modal = document.getElementById('modalLGPD');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function fecharModalLGPD() {
    const modal = document.getElementById('modalLGPD');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function abrirModalSucesso() {
    const modal = document.getElementById('modalSucesso');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function fecharModalSucesso() {
    const modal = document.getElementById('modalSucesso');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Copiar código PIX
function copiarPixCopia() {
    navigator.clipboard.writeText(pixCopiaCola).then(() => {
        const btn = event.target;
        const textoOriginal = btn.textContent;
        btn.textContent = 'Copiado!';
        btn.style.background = 'var(--secondary-color)';
        setTimeout(() => {
            btn.textContent = textoOriginal;
            btn.style.background = '';
        }, 2000);
    }).catch(err => {
        alert('Erro ao copiar código PIX. Por favor, copie manualmente.');
        console.error('Erro ao copiar:', err);
    });
}

// Adicionar evento de máscara no campo telefone
document.addEventListener('DOMContentLoaded', function() {
    // Calcular valor da parcela
    const numeroParcelas = document.getElementById('numero_parcelas');
    if (numeroParcelas) {
        numeroParcelas.addEventListener('change', function() {
            const parcelas = parseInt(this.value);
            if (parcelas) {
                const valorTotal = 450.00;
                const valorParcela = (valorTotal / parcelas).toFixed(2);
                document.getElementById('valor_parcela').textContent = `R$ ${valorParcela}`;
                document.getElementById('parcela_info').style.display = 'block';
            } else {
                document.getElementById('parcela_info').style.display = 'none';
            }
        });
    }

    // Mostrar/ocultar campo de descrição de necessidades
    const possuiDeficiencia = document.getElementById('possui_deficiencia');
    if (possuiDeficiencia) {
        possuiDeficiencia.addEventListener('change', function() {
            const container = document.getElementById('descricao_necessidades_container');
            container.style.display = this.checked ? 'block' : 'none';
            if (!this.checked) {
                document.getElementById('descricao_necessidades').value = '';
            }
        });
    }

    // Máscaras de formatação
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                value = value.replace(/(\d)(\d{4})$/, '$1-$2');
            }
            e.target.value = value;
        });
    }

    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            }
            e.target.value = value;
        });
    }

    // Fechar modais ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                if (this.id === 'modalLGPD') {
                    fecharModalLGPD();
                } else if (this.id === 'modalSucesso') {
                    fecharModalSucesso();
                }
            }
        });
    });

    // Enviar formulário
    const form = document.getElementById('formInscricao');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Validações básicas
            const maiorIdade = document.getElementById('maior_idade').checked;
            const aceiteLGPD = document.getElementById('aceite_termo_lgpd').checked;
            const aceiteDesistencia = document.getElementById('aceite_termo_desistencia').checked;

            if (!maiorIdade) {
                alert('É necessário ser maior de 18 anos para participar do evento.');
                return;
            }

            if (!aceiteLGPD) {
                alert('É necessário aceitar o Termo de Consentimento LGPD.');
                return;
            }

            if (!aceiteDesistencia) {
                alert('É necessário estar ciente das condições de desistência.');
                return;
            }

            // Coletar dados do formulário
            const formData = {
                nome_completo: document.getElementById('nome_completo').value,
                email: document.getElementById('email').value,
                telefone: document.getElementById('telefone').value,
                cpf: document.getElementById('cpf').value || null,
                cidade_pais: document.getElementById('cidade_pais').value,
                grupo_escolha: document.getElementById('grupo_escolha').value || null,
                csa: document.getElementById('csa').value || null,
                possui_deficiencia: document.getElementById('possui_deficiencia').checked,
                descricao_necessidades: document.getElementById('descricao_necessidades').value || null,
                interesse_hospedagem: document.getElementById('interesse_hospedagem').checked,
                numero_parcelas: parseInt(document.getElementById('numero_parcelas').value),
                dia_vencimento: document.getElementById('dia_vencimento').value || null,
                observacoes: document.getElementById('observacoes').value || null,
                maior_idade: true,
                aceite_termo_lgpd: true,
                aceite_termo_desistencia: true
            };

            // Mostrar loading
            const btnSubmit = document.getElementById('btnSubmit');
            const btnText = document.getElementById('btnText');
            const btnSpinner = document.getElementById('btnSpinner');

            btnSubmit.disabled = true;
            btnText.textContent = 'Processando...';
            btnSpinner.style.display = 'inline-block';

            try {
                // Enviar para API
                const response = await fetch('/api/inscricao', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || data.error || 'Erro ao processar inscrição');
                }

                // Salvar dados no localStorage para a página de pagamento
                localStorage.setItem('inscricao_nome', data.inscricao.nome);
                localStorage.setItem('inscricao_email', data.inscricao.email);
                localStorage.setItem('inscricao_parcelas', data.inscricao.numero_parcelas);
                localStorage.setItem('inscricao_valor_parcela', data.inscricao.valor_parcela);
                localStorage.setItem('inscricao_valor_total', data.inscricao.valor_total);
                localStorage.setItem('inscricao_telefone', formData.telefone);
                localStorage.setItem('inscricao_cpf', formData.cpf || '');

                // Redirecionar para página de pagamento
                window.location.href = `/pagamento.html?nome=${encodeURIComponent(data.inscricao.nome)}&email=${encodeURIComponent(data.inscricao.email)}&parcelas=${data.inscricao.numero_parcelas}&valor_parcela=${encodeURIComponent(data.inscricao.valor_parcela)}&valor_total=${encodeURIComponent(data.inscricao.valor_total)}`;

            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao processar inscrição: ' + error.message);
            } finally {
                // Restaurar botão
                btnSubmit.disabled = false;
                btnText.textContent = 'Finalizar Inscrição';
                btnSpinner.style.display = 'none';
            }
        });
    }

    // Smooth scroll para links de navegação
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Adicionar classe ao header no scroll
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }
    });

    // Animação de entrada dos cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar cards
    const cards = document.querySelectorAll('.feature-card, .detalhe-card, .contato-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// Adicionar estilo do spinner dinamicamente
const style = document.createElement('style');
style.textContent = `
    .spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Debug: Função para visualizar inscrições no console
window.verInscricoes = function() {
    const inscricoes = JSON.parse(localStorage.getItem('inscricoes') || '[]');
    console.log('📊 Inscrições registradas:', inscricoes.length);
    console.table(inscricoes);
    return inscricoes;
};

window.limparInscricoes = function() {
    localStorage.removeItem('inscricoes');
    console.log('🗑️ Inscrições limpas!');
};

console.log('🎉 Landing page do Encontemas carregada!');
console.log('💡 Use verInscricoes() no console para ver as inscrições');
console.log('💡 Use limparInscricoes() para limpar os dados de teste');