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
            cartao_titular,
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

        // Validar CPF (deve ter 11 dígitos)
        if (cpfLimpo.length !== 11) {
            console.error('❌ CPF inválido:', cpfLimpo);
            return res.status(400).json({
                error: 'CPF inválido',
                message: 'CPF deve conter 11 dígitos'
            });
        }

        // Extrair DDD e número do telefone
        const ddd = telefoneLimpo.substring(0, 2);
        const numeroTelefone = telefoneLimpo.substring(2);

        // Validar telefone (DDD + 8 ou 9 dígitos)
        if (ddd.length !== 2 || (numeroTelefone.length !== 8 && numeroTelefone.length !== 9)) {
            console.error('❌ Telefone inválido. DDD:', ddd, 'Número:', numeroTelefone);
            return res.status(400).json({
                error: 'Telefone inválido',
                message: 'Telefone deve estar no formato: DDD + 8 ou 9 dígitos'
            });
        }

        // Converter valor para centavos
        const valorCentavos = Math.round(parseFloat(valor_total) * 100);

        console.log('📋 Dados processados:');
        console.log('  CPF:', cpfLimpo);
        console.log('  Telefone - DDD:', ddd, 'Número:', numeroTelefone);
        console.log('  Valor (centavos):', valorCentavos);
        console.log('  Parcelas:', numero_parcelas_cartao);

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
                    name: "Inscricao Acampamento Terra do Saber 2026",
                    quantity: 1,
                    unit_amount: valorCentavos
                }
            ],
            shipping: {
                address: {
                    street: "Avenida Brigadeiro Faria Lima",
                    number: "1384",
                    locality: "Pinheiros",
                    city: "Sao Paulo",
                    region_code: "SP",
                    country: "BRA",
                    postal_code: "01452002"
                }
            },
            charges: [
                {
                    reference_id: `CHARGE_${timestamp}`,
                    description: "Pagamento inscricao via Cartao de Credito",
                    amount: {
                        value: valorCentavos,
                        currency: "BRL"
                    },
                    payment_method: {
                        type: "CREDIT_CARD",
                        installments: parcelasCartao,
                        capture: true,
                        soft_descriptor: "ACAMPAMENTO TDS",
                        card: {
                            encrypted: cartao_encrypted
                        },
                        holder: {
                            name: cartao_titular || nome_completo,
                            tax_id: cpfLimpo
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
        console.log('🔐 Encrypted card length:', cartao_encrypted.length);
        console.log('🔐 Encrypted card (first 50 chars):', cartao_encrypted.substring(0, 50));
        console.log('🔐 Encrypted card (last 50 chars):', cartao_encrypted.substring(cartao_encrypted.length - 50));

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

        console.log('📥 Resposta PagBank (Status:', response.status, ')');
        console.log('Response completo:', JSON.stringify(responseData, null, 2));

        if (!response.ok) {
            console.error('❌ Erro na API PagBank');
            console.error('Status:', response.status);
            console.error('Response:', JSON.stringify(responseData, null, 2));

            // Tentar extrair detalhes específicos do erro
            if (responseData.error_messages && Array.isArray(responseData.error_messages)) {
                responseData.error_messages.forEach((err, index) => {
                    console.error(`Erro ${index + 1}:`, {
                        code: err.code,
                        description: err.description,
                        parameter_name: err.parameter_name || 'não especificado'
                    });
                });
            }

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
