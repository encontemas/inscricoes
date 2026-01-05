// API para gerar PIX da primeira parcela após inscrição
// A API Orders usa autenticação simples com Bearer token (NÃO usa Connect Challenge)

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { email, numero_parcelas, nome_completo, telefone, cpf, id_inscricao } = req.body;

        // Validações
        if (!email) {
            return res.status(400).json({
                error: 'Email obrigatório',
                message: 'Informe o email do inscrito'
            });
        }

        if (!numero_parcelas || numero_parcelas < 1 || numero_parcelas > 11) {
            return res.status(400).json({
                error: 'Número de parcelas inválido',
                message: 'Escolha entre 1 e 11 parcelas'
            });
        }

        // Determinar ambiente (sandbox ou produção)
        const envValue = (process.env.PAGBANK_ENV || '').trim().toLowerCase();
        const isProduction = envValue === 'production';
        const pagBankUrl = isProduction
            ? 'https://api.pagseguro.com/orders'
            : 'https://sandbox.api.pagseguro.com/orders';

        console.log('🔍 Ambiente PIX:', isProduction ? 'PRODUCTION' : 'SANDBOX');
        console.log(`💳 Gerando PIX da primeira parcela para: ${email} [${isProduction ? 'PRODUCTION' : 'SANDBOX'}]`);

        const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;

        if (!PAGBANK_TOKEN) {
            throw new Error('Token de autenticação do PagBank não configurado');
        }

        const valorParcela = (450.00 / numero_parcelas).toFixed(2);

        // Preparar dados do cliente
        let telefoneLimpo = telefone ? telefone.replace(/\D/g, '') : '11999999999';

        // Remover código do país (55) se presente
        if (telefoneLimpo.startsWith('55') && (telefoneLimpo.length === 12 || telefoneLimpo.length === 13)) {
            console.log('🔧 Removendo código do país do telefone:', telefoneLimpo);
            telefoneLimpo = telefoneLimpo.substring(2);
            console.log('🔧 Telefone após remoção:', telefoneLimpo);
        }

        // Validar telefone
        if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
            console.error('❌ Telefone inválido:', telefoneLimpo, '(length:', telefoneLimpo.length, ')');
            return res.status(400).json({
                error: 'Telefone inválido',
                message: `O telefone deve ter 10 ou 11 dígitos (DDD + número). Telefone informado tem ${telefoneLimpo.length} dígitos.`
            });
        }

        const ddd = telefoneLimpo.substring(0, 2);
        const numero = telefoneLimpo.substring(2);

        // Validar que o número (sem DDD) tem 8 ou 9 dígitos
        if (numero.length < 8 || numero.length > 9) {
            console.error('❌ Número de telefone inválido:', numero, '(length:', numero.length, ')');
            return res.status(400).json({
                error: 'Telefone inválido',
                message: `O número de telefone (sem DDD) deve ter 8 ou 9 dígitos. Número informado: ${numero} (${numero.length} dígitos)`
            });
        }

        const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : '00000000000';

        // Usar id_inscricao se fornecido, caso contrário gerar um ID temporário
        const referenceId = id_inscricao || `inscricao_${Date.now()}_${email.split('@')[0]}`;
        console.log('🆔 Reference ID:', referenceId);

        const payload = {
            reference_id: referenceId,
            customer: {
                name: nome_completo || 'Inscrito Encontemas',
                email: email,
                tax_id: cpfLimpo,
                phones: [{
                    country: "55",
                    area: ddd,
                    number: numero,
                    type: "MOBILE"
                }]
            },
            items: [{
                reference_id: "parcela_01_encontemas",
                name: `Parcela 1/${numero_parcelas} - Encontemas Diversidade`,
                quantity: 1,
                unit_amount: Math.round(parseFloat(valorParcela) * 100) // em centavos
            }],
            qr_codes: [{
                amount: {
                    value: Math.round(parseFloat(valorParcela) * 100)
                },
                expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
            }],
            notification_urls: [
                `${req.headers.origin || 'https://inscricoes-sigma.vercel.app'}/api/webhook-pagbank`
            ]
        };

        console.log('📤 Enviando requisição para PagBank:', pagBankUrl);

        const response = await fetch(pagBankUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAGBANK_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error('❌ Erro PagBank:', responseText);
            let errorMessage = 'Erro ao gerar PIX';

            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.error_messages?.[0]?.description || errorMessage;
            } catch (e) {
                // Manter mensagem padrão se não conseguir parsear
            }

            return res.status(response.status).json({
                error: 'Erro ao gerar PIX',
                message: errorMessage,
                details: responseText
            });
        }

        const data = JSON.parse(responseText);
        const qrCode = data.qr_codes?.[0];
        const qrCodeImageLink = qrCode?.links?.find(link => link.rel === 'QRCODE.PNG');

        console.log('✅ PIX gerado com sucesso!');

        return res.status(200).json({
            success: true,
            message: 'PIX gerado com sucesso!',
            pix: {
                id: data.id,
                qr_code_texto: qrCode?.text,
                qr_code_imagem: qrCodeImageLink?.href,
                valor: `R$ ${valorParcela}`,
                expiracao: qrCode?.expiration_date
            }
        });

    } catch (error) {
        console.error('❌ Erro ao gerar PIX:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
}
