// Função para acesso rápido à área do inscrito
async function acessarAreaInscrito() {
    const cpfInput = document.getElementById('cpf-quick');
    const cpf = cpfInput.value.replace(/\D/g, '');

    if (cpf.length !== 11) {
        alert('Por favor, digite um CPF válido');
        cpfInput.focus();
        return;
    }

    // Desabilitar botão e mostrar loading
    const btn = cpfInput.nextElementSibling;
    const textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = '...';

    try {
        // Verificar se CPF existe via API
        const response = await fetch('/api/inscrito', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cpf: cpf })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || 'CPF não encontrado. Verifique se você já realizou sua inscrição.');
        }

        // Salvar CPF e dados no localStorage
        localStorage.setItem('inscrito_cpf', cpf);
        localStorage.setItem('inscrito_data', JSON.stringify(data));

        // Redirecionar DIRETO para área do inscrito
        window.location.href = '/area-inscrito.html';

    } catch (error) {
        console.error('Erro:', error);
        alert(error.message);
        btn.disabled = false;
        btn.textContent = textoOriginal;
        cpfInput.focus();
    }
}

// Máscara de CPF para o campo rápido
document.addEventListener('DOMContentLoaded', () => {
    const cpfQuick = document.getElementById('cpf-quick');

    if (cpfQuick) {
        // Máscara de CPF
        cpfQuick.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            }
            e.target.value = value;
        });

        // Enter para acessar
        cpfQuick.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                acessarAreaInscrito();
            }
        });
    }
});

// Função para scroll suave até a seção de inscrição
function scrollToInscricao() {
    const inscricaoSection = document.getElementById('inscricao');
    inscricaoSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Funções para galeria de imagens e vídeos
function abrirImagem(src, titulo = '') {
    const modal = document.getElementById('modalGaleria');
    const modalImg = document.getElementById('modalImagem');
    const modalVideo = document.getElementById('modalVideo');
    const modalTitulo = document.getElementById('modalTitulo');

    modalImg.src = src;
    modalImg.style.display = 'block';
    modalVideo.style.display = 'none';
    modalVideo.innerHTML = '';
    modalTitulo.textContent = titulo;
    modalTitulo.style.display = titulo ? 'block' : 'none';
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

// Calcular número máximo de parcelas baseado na data
function calcularMaxParcelas() {
    const hoje = new Date();
    const mesAtual = hoje.getMonth(); // 0-11 (0=Janeiro, 11=Dezembro)
    const anoAtual = hoje.getFullYear();

    // Última parcela pode vencer em novembro/2026 (mês 10)
    const mesLimite = 10; // Novembro (0-indexed)
    const anoLimite = 2026;

    // Calcular quantos meses faltam desde o mês ATUAL até novembro/2026 (INCLUSIVE)
    const mesesAteEvento = (anoLimite - anoAtual) * 12 + (mesLimite - mesAtual) + 1;

    // Máximo de 12 parcelas
    // Em dezembro/2025: 12 meses (dez/2025 até nov/2026 = 12 meses)
    // Em janeiro/2026: 11 meses (jan/2026 até nov/2026 = 11 meses)
    // Em novembro/2026: 1 mês (nov/2026 = 1 mês)
    // Em dezembro/2026: 0 meses (evento já passou)
    return Math.min(12, Math.max(0, mesesAteEvento));
}

// Adicionar evento de máscara no campo telefone
document.addEventListener('DOMContentLoaded', function() {
    // Atualizar opções de parcelas dinamicamente
    const numeroParcelas = document.getElementById('numero_parcelas');
    if (numeroParcelas) {
        // Calcular e popular opções
        const maxParcelas = calcularMaxParcelas();

        // Limpar opções existentes (mantendo apenas o "Selecione...")
        while (numeroParcelas.options.length > 1) {
            numeroParcelas.remove(1);
        }

        // Adicionar opções dinâmicas
        for (let i = 1; i <= maxParcelas; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i === 1 ? 'À vista (1x)' : `${i}x sem juros`;
            numeroParcelas.appendChild(option);
        }

        // Atualizar texto informativo
        const infoBox = document.querySelector('.info-box');
        if (infoBox) {
            infoBox.innerHTML = `<strong>Valor do Evento:</strong> R$ 450,00<br>Você pode parcelar em até ${maxParcelas}x sem juros via PIX`;
        }

        numeroParcelas.addEventListener('change', function() {
            const parcelas = parseInt(this.value);
            if (parcelas) {
                const valorTotal = 450.00;
                const valorParcela = (valorTotal / parcelas).toFixed(2);

                // Obter dia de vencimento selecionado (ou 10 como padrão)
                const diaVencimento = parseInt(document.getElementById('dia_vencimento').value) || 10;

                let html = '<div style="margin-top: 1rem;"><strong>Vencimento de cada parcela:</strong></div>';
                html += '<div style="margin-top: 0.5rem; max-height: 300px; overflow-y: auto;">';

                // Calcular data base da primeira parcela
                const hoje = new Date();
                const diaAtual = hoje.getDate();

                let primeiraParcelaData;
                if (diaAtual >= diaVencimento) {
                    // Já passou o dia escolhido, primeira parcela vence hoje
                    primeiraParcelaData = new Date(hoje);
                } else {
                    // Ainda não passou, primeira parcela vence no dia escolhido deste mês
                    primeiraParcelaData = new Date();
                    primeiraParcelaData.setDate(diaVencimento);
                }

                for (let i = 1; i <= parcelas; i++) {
                    let vencimento;

                    if (i === 1) {
                        vencimento = new Date(primeiraParcelaData);
                    } else {
                        // Demais parcelas: a partir da primeira parcela, adicionar meses
                        vencimento = new Date(primeiraParcelaData);
                        // IMPORTANTE: Ajustar dia para 1 antes de mudar mês (evita overflow)
                        vencimento.setDate(1);
                        vencimento.setMonth(primeiraParcelaData.getMonth() + (i - 1));
                        // Depois ajustar para o dia de vencimento
                        vencimento.setDate(diaVencimento);
                    }

                    // Formatar data no padrão brasileiro dd/mm/aaaa
                    const dataFormatada = vencimento.toLocaleDateString('pt-BR');

                    html += `<div style="padding: 0.5rem; margin: 0.25rem 0; background: #f0f0f0; border-radius: 4px; display: flex; justify-content: space-between;">
                        <span><strong>Parcela ${i}/${parcelas}:</strong> ${dataFormatada}</span>
                        <span style="color: var(--primary-color); font-weight: bold;">R$ ${valorParcela}</span>
                    </div>`;
                }

                html += '</div>';

                document.getElementById('parcela_info').innerHTML = html;
                document.getElementById('parcela_info').style.display = 'block';
            } else {
                document.getElementById('parcela_info').style.display = 'none';
            }
        });

        // Atualizar parcelas quando dia de vencimento mudar
        const diaVencimento = document.getElementById('dia_vencimento');
        if (diaVencimento) {
            diaVencimento.addEventListener('change', function() {
                // Trigger change no número de parcelas para recalcular
                if (numeroParcelas.value) {
                    numeroParcelas.dispatchEvent(new Event('change'));
                }
            });
        }
    }

    // Mostrar/ocultar seções de pagamento baseado no método escolhido
    const metodoPagamento = document.getElementById('metodo_pagamento');
    if (metodoPagamento) {
        metodoPagamento.addEventListener('change', function() {
            const secaoPix = document.getElementById('secao_pix');
            const secaoCartao = document.getElementById('secao_cartao');

            if (this.value === 'pix') {
                secaoPix.style.display = 'block';
                secaoCartao.style.display = 'none';
                // Tornar campos PIX obrigatórios
                document.getElementById('numero_parcelas').required = true;
                // Remover obrigatoriedade dos campos do cartão
                document.getElementById('parcelas_cartao').required = false;
                document.getElementById('cartao_numero').required = false;
                document.getElementById('cartao_titular').required = false;
                document.getElementById('cartao_validade').required = false;
                document.getElementById('cartao_cvv').required = false;
            } else if (this.value === 'cartao') {
                secaoPix.style.display = 'none';
                secaoCartao.style.display = 'block';
                // Tornar campos cartão obrigatórios
                document.getElementById('parcelas_cartao').required = true;
                document.getElementById('cartao_numero').required = true;
                document.getElementById('cartao_titular').required = true;
                document.getElementById('cartao_validade').required = true;
                document.getElementById('cartao_cvv').required = true;
                // Remover obrigatoriedade dos campos PIX
                document.getElementById('numero_parcelas').required = false;
            } else {
                secaoPix.style.display = 'none';
                secaoCartao.style.display = 'none';
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

    // Máscaras para campos de cartão
    const cartaoNumero = document.getElementById('cartao_numero');
    if (cartaoNumero) {
        cartaoNumero.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 16) {
                value = value.replace(/(\d{4})(\d)/, '$1 $2');
                value = value.replace(/(\d{4}) (\d{4})(\d)/, '$1 $2 $3');
                value = value.replace(/(\d{4}) (\d{4}) (\d{4})(\d)/, '$1 $2 $3 $4');
            }
            e.target.value = value;
        });
    }

    const cartaoValidade = document.getElementById('cartao_validade');
    if (cartaoValidade) {
        cartaoValidade.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 4) {
                value = value.replace(/(\d{2})(\d)/, '$1/$2');
            }
            e.target.value = value;
        });
    }

    const cartaoCvv = document.getElementById('cartao_cvv');
    if (cartaoCvv) {
        cartaoCvv.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
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

            // Obter método de pagamento
            const metodoPagamento = document.getElementById('metodo_pagamento').value;

            // Validar método de pagamento
            if (!metodoPagamento) {
                alert('Por favor, selecione um método de pagamento (PIX ou Cartão).');
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
                grupo_pessoas: document.getElementById('grupo_pessoas').value || null,
                possui_deficiencia: document.getElementById('possui_deficiencia').checked,
                descricao_necessidades: document.getElementById('descricao_necessidades').value || null,
                interesse_transfer: document.getElementById('interesse_transfer').checked,
                metodo_pagamento: metodoPagamento,
                numero_parcelas: metodoPagamento === 'pix' ? parseInt(document.getElementById('numero_parcelas').value) : 1,
                dia_vencimento: document.getElementById('dia_vencimento').value || null,
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

                // Capturar ID da inscrição retornado pela API
                const idInscricao = data.inscricao.id_inscricao;
                console.log('🆔 ID da inscrição recebido:', idInscricao);

                // Se escolheu cartão, processar pagamento com cartão agora
                if (metodoPagamento === 'cartao') {
                    // Coletar dados do cartão
                    const cartaoNumero = document.getElementById('cartao_numero').value.replace(/\s/g, '');
                    const cartaoTitular = document.getElementById('cartao_titular').value;
                    const cartaoValidade = document.getElementById('cartao_validade').value;
                    const cartaoCvv = document.getElementById('cartao_cvv').value;
                    const parcelasCartao = parseInt(document.getElementById('parcelas_cartao').value);

                    // Validar campos do cartão
                    if (!cartaoNumero || cartaoNumero.length < 13) {
                        alert('Número do cartão inválido');
                        btnSubmit.disabled = false;
                        btnText.textContent = 'Finalizar Inscrição';
                        btnSpinner.style.display = 'none';
                        return;
                    }

                    // Validar validade MM/AA
                    if (!cartaoValidade || !/^\d{2}\/\d{2}$/.test(cartaoValidade)) {
                        alert('Validade do cartão inválida (use MM/AA)');
                        btnSubmit.disabled = false;
                        btnText.textContent = 'Finalizar Inscrição';
                        btnSpinner.style.display = 'none';
                        return;
                    }

                    // Validar CVV
                    if (!cartaoCvv || cartaoCvv.length < 3) {
                        alert('CVV inválido');
                        btnSubmit.disabled = false;
                        btnText.textContent = 'Finalizar Inscrição';
                        btnSpinner.style.display = 'none';
                        return;
                    }

                    btnText.textContent = 'Processando pagamento...';

                    // Criptografar dados do cartão usando PagBank SDK
                    let cartaoEncrypted;
                    try {
                        // Buscar chave pública do PagBank baseada no ambiente
                        const keyResponse = await fetch('/api/pagbank-public-key');
                        const keyData = await keyResponse.json();

                        if (!keyResponse.ok) {
                            throw new Error('Não foi possível obter chave de criptografia');
                        }

                        console.log(`🔑 Usando chave pública PagBank (${keyData.environment})`);

                        // Separar mês e ano da validade
                        const [mes, ano] = cartaoValidade.split('/');
                        const anoCompleto = '20' + ano; // Converter AA para AAAA

                        // Usar a biblioteca PagBank para criptografar
                        const card = window.PagSeguro.encryptCard({
                            publicKey: keyData.publicKey,
                            holder: cartaoTitular,
                            number: cartaoNumero,
                            expMonth: mes,
                            expYear: anoCompleto,
                            securityCode: cartaoCvv
                        });

                        cartaoEncrypted = card.encryptedCard;

                    } catch (encryptError) {
                        console.error('Erro ao criptografar cartão:', encryptError);
                        alert('Erro ao processar dados do cartão. Verifique os dados e tente novamente.');
                        btnSubmit.disabled = false;
                        btnText.textContent = 'Finalizar Inscrição';
                        btnSpinner.style.display = 'none';
                        return;
                    }

                    // Processar pagamento com cartão
                    try {
                        const pagamentoResponse = await fetch('/api/pagamento-cartao', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                id_inscricao: idInscricao, // Usar ID da inscrição
                                nome_completo: formData.nome_completo,
                                email: formData.email,
                                cpf: formData.cpf,
                                telefone: formData.telefone,
                                valor_total: 450.00,
                                cartao_encrypted: cartaoEncrypted,
                                cartao_titular: cartaoTitular,
                                cartao_numero_final: cartaoNumero.slice(-4),
                                cartao_bandeira: 'UNKNOWN', // TODO: Detectar bandeira
                                numero_parcelas_cartao: parcelasCartao
                            })
                        });

                        const pagamentoData = await pagamentoResponse.json();

                        if (!pagamentoResponse.ok) {
                            throw new Error(pagamentoData.message || 'Erro ao processar pagamento com cartão');
                        }

                        if (pagamentoData.approved) {
                            alert(`✅ Pagamento aprovado com sucesso!\n\nPara acessar sua área do inscrito:\n1. Vá para a página inicial\n2. Digite seu CPF no campo "Pagar Parcelas"\n3. Clique em "→" para acessar`);
                            window.location.href = '/';
                        } else {
                            alert('Pagamento em processamento. Aguarde a confirmação.');
                            window.location.href = '/';
                        }

                    } catch (pagamentoError) {
                        console.error('Erro ao processar pagamento:', pagamentoError);
                        alert('Erro ao processar pagamento: ' + pagamentoError.message);
                        btnSubmit.disabled = false;
                        btnText.textContent = 'Finalizar Inscrição';
                        btnSpinner.style.display = 'none';
                        return;
                    }

                } else {
                    // Pagamento PIX - redirecionar para página de pagamento
                    localStorage.setItem('inscricao_nome', data.inscricao.nome);
                    localStorage.setItem('inscricao_email', data.inscricao.email);
                    localStorage.setItem('inscricao_parcelas', data.inscricao.numero_parcelas);
                    localStorage.setItem('inscricao_valor_parcela', data.inscricao.valor_parcela);
                    localStorage.setItem('inscricao_valor_total', data.inscricao.valor_total);
                    localStorage.setItem('inscricao_telefone', formData.telefone);
                    localStorage.setItem('inscricao_cpf', formData.cpf || '');

                    // Redirecionar para página de pagamento PIX
                    window.location.href = `/pagamento.html?nome=${encodeURIComponent(data.inscricao.nome)}&email=${encodeURIComponent(data.inscricao.email)}&parcelas=${data.inscricao.numero_parcelas}&valor_parcela=${encodeURIComponent(data.inscricao.valor_parcela)}&valor_total=${encodeURIComponent(data.inscricao.valor_total)}`;
                }

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