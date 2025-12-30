// API para gerar PIX da primeira parcela após inscrição
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
        const response = await fetch('https://api.pagseguro.com/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'challenge',
                scope: 'certificate.create'
            })
        });

        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(`Erro ao obter token (${response.status}): ${responseText}`);
        }

        const data = JSON.parse(responseText);
        const decryptedChallenge = decryptChallenge(data.challenge, privateKey);

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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { email, numero_parcelas, nome_completo, telefone, cpf } = req.body;

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

        console.log('💰 Gerando PIX da primeira parcela para:', email);

        const PAGBANK_PRIVATE_KEY = process.env.PAGBANK_PRIVATE_KEY;

        if (!PAGBANK_PRIVATE_KEY) {
            throw new Error('Chave privada do PagBank não configurada');
        }

        const authHeaders = await getAuthHeaders(PAGBANK_PRIVATE_KEY);

        const valorParcela = (450.00 / numero_parcelas).toFixed(2);

        // Preparar dados do cliente
        const telefoneLimpo = telefone ? telefone.replace(/\D/g, '') : '11999999999';
        const ddd = telefoneLimpo.substring(0, 2);
        const numero = telefoneLimpo.substring(2);
        const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : '00000000000';

        const payload = {
            reference_id: `inscricao_${Date.now()}_${email.split('@')[0]}`,
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

        console.log('📤 Enviando requisição para PagBank...');

        const response = await fetch('https://api.pagseguro.com/orders', {
            method: 'POST',
            headers: authHeaders,
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
