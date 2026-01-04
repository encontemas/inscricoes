// API para processar pagamento por cartão de crédito via PagBank
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const {
            inscricao_id,
            nome_completo,
            email,
            cpf,
            telefone,
            valor_total,
            cartao_encrypted,
            cartao_numero_final,
            cartao_bandeira,
            numero_parcelas_cartao = 1 // Número de parcelas no cartão (1-11x)
        } = req.body;

        // Validações
        if (!inscricao_id || !nome_completo || !email || !cpf || !telefone || !valor_total || !cartao_encrypted) {
            return res.status(400).json({
                error: 'Dados incompletos',
                message: 'Todos os campos são obrigatórios'
            });
        }

        // Validar número de parcelas no cartão
        const parcelasCartao = parseInt(numero_parcelas_cartao);
        if (parcelasCartao < 1 || parcelasCartao > 11) {
            return res.status(400).json({
                error: 'Número de parcelas inválido',
                message: 'Escolha entre 1 e 11 parcelas no cartão'
            });
        }

        console.log('💳 Processando pagamento com cartão de crédito...');
        console.log('Inscrição ID:', inscricao_id);
        console.log('Email:', email);
        console.log('Valor Total:', valor_total);

        // Preparar dados do pagamento PagBank
        const pagBankToken = process.env.PAGBANK_TOKEN;

        if (!pagBankToken) {
            console.error('❌ PAGBANK_TOKEN não configurado');
            return res.status(500).json({
                error: 'Configuração incompleta',
                message: 'Token do PagBank não configurado'
            });
        }

        // Limpar CPF e telefone
        const cpfLimpo = cpf.replace(/\D/g, '');
        const telefoneLimpo = telefone.replace(/\D/g, '');

        // Extrair DDD e número do telefone
        const ddd = telefoneLimpo.substring(0, 2);
        const numeroTelefone = telefoneLimpo.substring(2);

        // Converter valor para centavos
        const valorCentavos = Math.round(parseFloat(valor_total) * 100);

        // Reference ID único: inscricao_timestamp_email
        const timestamp = new Date().getTime();
        const referenceId = `${inscricao_id}_${timestamp}_${email}`;

        // Preparar payload para PagBank - Pagamento com Cartão
        const pagBankPayload = {
            reference_id: referenceId,
            customer: {
                name: nome_completo,
                email: email,
                tax_id: cpfLimpo,
                phones: [
                    {
                        country: "55",
                        area: ddd,
                        number: numeroTelefone,
                        type: "MOBILE"
                    }
                ]
            },
            items: [
                {
                    reference_id: "INSCRICAO_ACAMPAMENTO",
                    name: "Inscrição Acampamento Terra do Saber 2026",
                    quantity: 1,
                    unit_amount: valorCentavos
                }
            ],
            charges: [
                {
                    reference_id: `CHARGE_${timestamp}`,
                    description: "Pagamento inscrição via Cartão de Crédito",
                    amount: {
                        value: valorCentavos,
                        currency: "BRL"
                    },
                    payment_method: {
                        type: "CREDIT_CARD",
                        installments: parcelasCartao,
                        capture: true,
                        card: {
                            encrypted: cartao_encrypted
                        }
                    }
                }
            ],
            notification_urls: [
                `https://inscricoes-sigma.vercel.app/api/webhook-pagbank`
            ]
        };

        console.log('📤 Enviando requisição para PagBank (Cartão)...');
        console.log('Payload:', JSON.stringify(pagBankPayload, null, 2));

        // Fazer requisição para PagBank
        // Determinar ambiente (sandbox ou produção)
        const isProduction = process.env.PAGBANK_ENV === 'production';
        const pagBankUrl = isProduction
            ? 'https://api.pagbank.com/orders'
            : 'https://sandbox.api.pagseguro.com/orders';

        console.log('🌐 URL PagBank:', pagBankUrl);
        console.log('🔑 Token (primeiros 10 chars):', pagBankToken.substring(0, 10) + '...');

        const response = await fetch(pagBankUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pagBankToken}`
            },
            body: JSON.stringify(pagBankPayload)
        });

        const responseData = await response.json();

        console.log('📥 Resposta PagBank:', JSON.stringify(responseData, null, 2));

        if (!response.ok) {
            console.error('❌ Erro na API PagBank:', responseData);
            return res.status(response.status).json({
                error: 'Erro ao processar pagamento',
                message: responseData.error_messages?.[0]?.description || 'Erro desconhecido',
                details: responseData
            });
        }

        // Verificar se o pagamento foi aprovado imediatamente
        const charge = responseData.charges?.[0];
        const paymentStatus = charge?.status;

        console.log('✅ Pedido criado com sucesso!');
        console.log('Order ID:', responseData.id);
        console.log('Status do pagamento:', paymentStatus);

        // Retornar resposta
        return res.status(200).json({
            success: true,
            order_id: responseData.id,
            reference_id: referenceId,
            status: paymentStatus,
            charge_id: charge?.id,
            approved: paymentStatus === 'PAID',
            message: paymentStatus === 'PAID'
                ? 'Pagamento aprovado com sucesso!'
                : 'Aguardando confirmação do pagamento',
            pagbank_response: responseData
        });

    } catch (error) {
        console.error('❌ Erro ao processar pagamento:', error);
        console.error('Stack trace:', error.stack);
        console.error('Tipo do erro:', error.name);

        return res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message,
            errorType: error.name,
            details: error.cause || 'Sem detalhes adicionais'
        });
    }
}
