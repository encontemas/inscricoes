// API Serverless para criar cobrança PIX no PagBank
// A API Orders usa autenticação simples com Bearer token (NÃO usa Connect Challenge)

export default async function handler(req, res) {
    // Apenas aceita POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { nome, email, telefone, cpf } = req.body;

        // Validação básica
        if (!nome || !email || !telefone || !cpf) {
            return res.status(400).json({
                error: 'Dados incompletos. Forneça: nome, email, telefone e CPF'
            });
        }

        // Validar variável de ambiente
        const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;

        if (!PAGBANK_TOKEN) {
            console.error('❌ PAGBANK_TOKEN não configurado nas variáveis de ambiente');
            return res.status(500).json({
                error: 'Erro de configuração',
                message: 'Token de autenticação do PagBank não está configurado.'
            });
        }

        // Determinar ambiente (sandbox ou produção)
        const envValue = (process.env.PAGBANK_ENV || '').trim().toLowerCase();
        const isProduction = envValue === 'production';
        const PAGBANK_API = isProduction
            ? 'https://api.pagseguro.com/orders'
            : 'https://sandbox.api.pagseguro.com/orders';

        console.log('🔍 Ambiente PIX:', isProduction ? 'PRODUCTION' : 'SANDBOX');
        console.log(`💳 Criando cobrança PIX de R$ 1,00 [${isProduction ? 'PRODUCTION' : 'SANDBOX'}]...`);

        // Limpar telefone (apenas números)
        const telefoneLimpo = telefone.replace(/\D/g, '');

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

        // Limpar CPF (apenas números)
        const cpfLimpo = cpf.replace(/\D/g, '');

        // Gerar ID único para a transação
        const referenceId = `teste_${Date.now()}`;

        // Criar payload para PagBank
        const payload = {
            reference_id: referenceId,
            customer: {
                name: nome,
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
                reference_id: "teste_inscricao",
                name: "Teste Inscrição Encontemas",
                quantity: 1,
                unit_amount: 100  // R$ 1,00 em centavos
            }],
            qr_codes: [{
                amount: {
                    value: 100  // R$ 1,00 em centavos
                },
                expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
            }],
            notification_urls: [
                `${req.headers.origin || 'https://inscricoes-sigma.vercel.app'}/api/webhook-pagbank`
            ]
        };

        console.log('📤 Enviando para PagBank:', JSON.stringify(payload, null, 2));

        // Chamar API do PagBank com autenticação Bearer simples
        const response = await fetch(PAGBANK_API, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAGBANK_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('📥 Status da resposta:', response.status, response.statusText);

        // Capturar corpo da resposta (pode ser JSON ou texto)
        const responseText = await response.text();
        console.log('📥 Corpo da resposta:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Erro ao parsear JSON:', parseError);
            console.error('❌ Resposta recebida (texto):', responseText);

            return res.status(500).json({
                error: 'Erro ao processar resposta do PagBank',
                details: {
                    status: response.status,
                    statusText: response.statusText,
                    body: responseText
                }
            });
        }

        console.log('📥 Resposta PagBank (JSON):', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('❌ Erro PagBank:', data);

            // Mensagens de erro específicas
            let errorMessage = 'Erro ao criar cobrança PIX';

            if (data.error_messages) {
                const errors = data.error_messages;
                if (errors.some(e => e.description?.includes('PIX') || e.description?.includes('key'))) {
                    errorMessage = 'Erro: Verifique se há uma chave PIX cadastrada na conta PagBank';
                }
            }

            return res.status(response.status).json({
                error: errorMessage,
                details: data
            });
        }

        // Extrair dados do PIX
        const qrCode = data.qr_codes?.[0];

        // Buscar links do QR Code (imagem PNG e texto)
        const qrCodeImageLink = qrCode?.links?.find(link => link.rel === 'QRCODE.PNG');
        const qrCodeBase64Link = qrCode?.links?.find(link => link.rel === 'QRCODE.BASE64');

        const pixData = {
            id: data.id,
            reference_id: referenceId,
            status: data.status,
            qr_code_texto: qrCode?.text || null, // PIX copia-e-cola direto
            qr_code_imagem: qrCodeImageLink?.href || null, // Link da imagem PNG
            qr_code_base64: qrCodeBase64Link?.href || null, // Link do código base64
            valor: 'R$ 1,00',
            expiracao: qrCode?.expiration_date || null,
            created_at: data.created_at
        };

        console.log('✅ PIX criado:', pixData);

        // Retornar dados do PIX
        return res.status(200).json({
            success: true,
            message: 'Cobrança PIX criada com sucesso!',
            pix: pixData
        });

    } catch (error) {
        console.error('❌ Erro no servidor:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
}
