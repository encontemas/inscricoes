// API para processar pagamento e retornar logs completos de request/response
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const logs = {
        timestamp: new Date().toISOString(),
        request: {},
        response: {}
    };

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
            numero_parcelas_cartao = 1
        } = req.body;

        // Validações
        if (!inscricao_id || !nome_completo || !email || !cpf || !telefone || !valor_total || !cartao_encrypted) {
            return res.status(400).json({
                error: 'Dados incompletos',
                message: 'Todos os campos são obrigatórios'
            });
        }

        const parcelasCartao = parseInt(numero_parcelas_cartao);
        if (parcelasCartao < 1 || parcelasCartao > 11) {
            return res.status(400).json({
                error: 'Número de parcelas inválido',
                message: 'Escolha entre 1 e 11 parcelas no cartão'
            });
        }

        const pagBankToken = process.env.PAGBANK_TOKEN;

        if (!pagBankToken) {
            return res.status(500).json({
                error: 'Configuração incompleta',
                message: 'Token do PagBank não configurado'
            });
        }

        // Limpar CPF e telefone
        const cpfLimpo = cpf.replace(/\D/g, '');
        const telefoneLimpo = telefone.replace(/\D/g, '');

        // Validar CPF
        if (cpfLimpo.length !== 11) {
            return res.status(400).json({
                error: 'CPF inválido',
                message: 'CPF deve conter 11 dígitos'
            });
        }

        // Extrair DDD e número do telefone
        const ddd = telefoneLimpo.substring(0, 2);
        const numeroTelefone = telefoneLimpo.substring(2);

        // Validar telefone
        if (ddd.length !== 2 || (numeroTelefone.length !== 8 && numeroTelefone.length !== 9)) {
            return res.status(400).json({
                error: 'Telefone inválido',
                message: 'Telefone deve estar no formato: DDD + 8 ou 9 dígitos'
            });
        }

        // Converter valor para centavos
        const valorCentavos = Math.round(parseFloat(valor_total) * 100);

        const timestamp = new Date().getTime();
        // Reference ID com no máximo 64 caracteres
        const referenceId = `ACMP_${timestamp}`;

        // Preparar payload para PagBank
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
            charges: [
                {
                    reference_id: timestamp.toString(),
                    description: "Inscricao Acampamento",
                    amount: {
                        value: valorCentavos,
                        currency: "BRL"
                    },
                    payment_method: {
                        type: "CREDIT_CARD",
                        installments: parcelasCartao,
                        capture: true,
                        soft_descriptor: "ACAMPAMENTO",
                        card: {
                            encrypted: cartao_encrypted,
                            store: false
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

        // Determinar ambiente
        const isProduction = process.env.PAGBANK_ENV === 'production';
        const pagBankUrl = isProduction
            ? 'https://api.pagbank.com/orders'
            : 'https://sandbox.api.pagseguro.com/orders';

        // SALVAR LOG DO REQUEST
        logs.request = {
            url: pagBankUrl,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pagBankToken.substring(0, 20)}...` // Parcial por segurança
            },
            payload: pagBankPayload
        };

        // Fazer requisição para PagBank
        const response = await fetch(pagBankUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pagBankToken}`
            },
            body: JSON.stringify(pagBankPayload)
        });

        const responseData = await response.json();

        // SALVAR LOG DO RESPONSE
        logs.response = {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseData
        };

        if (!response.ok) {
            return res.status(200).json({
                success: false,
                error: 'Erro ao processar pagamento',
                message: responseData.error_messages?.[0]?.description || 'Erro desconhecido',
                logs: logs
            });
        }

        const charge = responseData.charges?.[0];
        const paymentStatus = charge?.status;

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
            logs: logs
        });

    } catch (error) {
        logs.error = {
            message: error.message,
            stack: error.stack,
            name: error.name
        };

        return res.status(200).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message,
            logs: logs
        });
    }
}
