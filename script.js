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

// Máscara para telefone
function mascaraTelefone(event) {
    let input = event.target;
    let valor = input.value.replace(/\D/g, '');

    if (valor.length <= 11) {
        valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
        valor = valor.replace(/(\d)(\d{4})$/, '$1-$2');
    }

    input.value = valor;
}

// Adicionar evento de máscara no campo telefone
document.addEventListener('DOMContentLoaded', function() {
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', mascaraTelefone);
    }

    // Manipulação do formulário de inscrição
    const form = document.getElementById('formInscricao');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // Coletar dados do formulário
            const formData = {
                nome: document.getElementById('nome').value,
                telefone: document.getElementById('telefone').value,
                email: document.getElementById('email').value,
                cidade: document.getElementById('cidade').value,
                grupo: document.getElementById('grupo').value,
                necessidades: document.getElementById('necessidades').value,
                termos: document.getElementById('termos').checked,
                dataInscricao: new Date().toISOString()
            };

            // Simulação de envio (MOCKUP)
            console.log('📋 Dados da inscrição:', formData);

            // Salvar no localStorage para demonstração
            let inscricoes = JSON.parse(localStorage.getItem('inscricoes') || '[]');
            inscricoes.push(formData);
            localStorage.setItem('inscricoes', JSON.stringify(inscricoes));

            // Animação de carregamento
            const btnSubmit = form.querySelector('.btn-submit');
            const textoOriginal = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<div class="spinner"></div> Enviando...';
            btnSubmit.disabled = true;

            // Simular delay de envio
            setTimeout(() => {
                // Esconder formulário
                form.style.display = 'none';

                // Mostrar mensagem de sucesso
                const mensagemSucesso = document.getElementById('mensagemSucesso');
                mensagemSucesso.style.display = 'block';

                // Scroll suave para a mensagem de sucesso
                mensagemSucesso.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                // Log para demonstração
                console.log('✅ Inscrição enviada com sucesso!');
                console.log('📊 Total de inscrições no localStorage:', inscricoes.length);

                // Resetar botão
                btnSubmit.innerHTML = textoOriginal;
                btnSubmit.disabled = false;
            }, 2000);
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