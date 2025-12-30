// API Serverless para criar cobrança PIX no PagBank
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

        // Token do PagBank (PRODUÇÃO)
        const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN || '38d30b40-ed80-4a1d-a74a-2d6ff6efb9c080b1cca24b8892bd1d01ab733037fd9005e1-3fb2-4ff3-b160-9ce3d23902df';

        // Endpoint PRODUÇÃO
        const PAGBANK_API = 'https://api.pagseguro.com/orders';

        // Limpar telefone (apenas números)
        const telefoneLimpo = telefone.replace(/\D/g, '');
        const ddd = telefoneLimpo.substring(0, 2);
        const numero = telefoneLimpo.substring(2);

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
                `${req.headers.origin || 'https://inscricoes.vercel.app'}/api/webhook-pagbank`
            ]
        };

        console.log('📤 Enviando para PagBank:', JSON.stringify(payload, null, 2));

        // Chamar API do PagBank
        const response = await fetch(PAGBANK_API, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAGBANK_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log('📥 Resposta PagBank:', JSON.stringify(data, null, 2));

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
