// API Serverless para criar cobrança PIX no PagBank com Connect Challenge
// Versão inline - sem imports de módulos customizados
import crypto from 'crypto';

// Função inline para descriptografar challenge
function decryptChallenge(encryptedChallengeBase64, privateKeyPem) {
    try {
        const encryptedBuffer = Buffer.from(encryptedChallengeBase64, 'base64');
        const decrypted = crypto.privateDecrypt(
            {
                key: privateKeyPem,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            encryptedBuffer
        );
        return decrypted.toString('utf8');
    } catch (error) {
        console.error('❌ Erro ao descriptografar challenge:', error);
        throw new Error('Falha ao descriptografar challenge: ' + error.message);
    }
}

// Função inline para obter autenticação
async function getAuthHeaders(privateKey) {
    try {
        // 1. Obter token e challenge criptografado
        const response = await fetch('https://api.pagseguro.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'challenge',
                scope: 'certificate.create'
            })
        });

        console.log('📥 Status token response:', response.status, response.statusText);

        const responseText = await response.text();
        console.log('📥 Token response body:', responseText);

        if (!response.ok) {
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch {
                errorData = { message: responseText || 'Resposta vazia do PagBank' };
            }
            console.error('❌ Erro ao obter token PagBank:', errorData);
            throw new Error(`Erro ao obter token (${response.status}): ${JSON.stringify(errorData)}`);
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Erro ao parsear resposta do token:', parseError);
            throw new Error(`Token response vazio ou inválido: ${responseText}`);
        }
        console.log('✅ Token obtido do PagBank');

        // 2. Descriptografar o challenge
        const decryptedChallenge = decryptChallenge(data.challenge, privateKey);
        console.log('✅ Challenge descriptografado com sucesso');

        return {
            'Authorization': `Bearer ${data.access_token}`,
            'X-PagBank-Challenge': decryptedChallenge,
            'Content-Type': 'application/json'
        };
    } catch (error) {
        console.error('❌ Erro na autenticação PagBank:', error);
        throw error;
    }
}

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

        // Validar variáveis de ambiente
        const PAGBANK_PRIVATE_KEY = process.env.PAGBANK_PRIVATE_KEY;

        if (!PAGBANK_PRIVATE_KEY) {
            console.error('❌ PAGBANK_PRIVATE_KEY não configurada nas variáveis de ambiente');
            return res.status(500).json({
                error: 'Erro de configuração',
                message: 'Chave privada do PagBank não está configurada. Execute o script de setup e configure as variáveis no Vercel.'
            });
        }

        // Endpoint PRODUÇÃO
        const PAGBANK_API = 'https://api.pagseguro.com/orders';

        console.log('🔐 Obtendo autenticação Connect Challenge...');

        // Obter autenticação com Connect Challenge
        const authHeaders = await getAuthHeaders(PAGBANK_PRIVATE_KEY);

        console.log('✅ Autenticação obtida com sucesso');

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

        // Chamar API do PagBank com autenticação Connect Challenge
        const response = await fetch(PAGBANK_API, {
            method: 'POST',
            headers: authHeaders, // Usa headers com token e challenge
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
