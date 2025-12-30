// API para processar inscrição + pagamento primeira parcela
import crypto from 'crypto';
import { salvarInscricao } from '../lib/google-sheets.js';

// Função inline para descriptografar challenge (mesma do criar-pix.js)
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
        const dados = req.body;

        // Validações obrigatórias
        if (!dados.nome_completo || !dados.email || !dados.telefone || !dados.cidade_pais) {
            return res.status(400).json({
                error: 'Campos obrigatórios faltando',
                message: 'Preencha: nome completo, email, telefone e cidade/país'
            });
        }

        if (!dados.maior_idade) {
            return res.status(400).json({
                error: 'Idade insuficiente',
                message: 'É necessário ser maior de 18 anos para participar do evento'
            });
        }

        if (!dados.aceite_termo_lgpd) {
            return res.status(400).json({
                error: 'Termo LGPD não aceito',
                message: 'É necessário aceitar o termo de consentimento LGPD'
            });
        }

        if (!dados.aceite_termo_desistencia) {
            return res.status(400).json({
                error: 'Termo de desistência não aceito',
                message: 'É necessário estar ciente das condições de desistência'
            });
        }

        if (!dados.numero_parcelas || dados.numero_parcelas < 1 || dados.numero_parcelas > 11) {
            return res.status(400).json({
                error: 'Número de parcelas inválido',
                message: 'Escolha entre 1 e 11 parcelas'
            });
        }

        console.log('📝 Salvando inscrição na planilha...');

        // 1. Salvar inscrição na planilha
        await salvarInscricao(dados);

        console.log('✅ Inscrição salva com sucesso!');

        // 2. Gerar PIX da primeira parcela
        console.log('💰 Gerando PIX da primeira parcela...');

        const PAGBANK_PRIVATE_KEY = process.env.PAGBANK_PRIVATE_KEY;

        if (!PAGBANK_PRIVATE_KEY) {
            throw new Error('Chave privada do PagBank não configurada');
        }

        const authHeaders = await getAuthHeaders(PAGBANK_PRIVATE_KEY);

        const valorParcela = (450.00 / dados.numero_parcelas).toFixed(2);
        const telefoneLimpo = dados.telefone.replace(/\D/g, '');
        const ddd = telefoneLimpo.substring(0, 2);
        const numero = telefoneLimpo.substring(2);
        const cpfLimpo = dados.cpf ? dados.cpf.replace(/\D/g, '') : '00000000000';

        const payload = {
            reference_id: `inscricao_${Date.now()}`,
            customer: {
                name: dados.nome_completo,
                email: dados.email,
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
                name: `Parcela 1/${dados.numero_parcelas} - Encontemas Diversidade`,
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

        const response = await fetch('https://api.pagseguro.com/orders', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        const data = JSON.parse(responseText);

        if (!response.ok) {
            console.error('❌ Erro PagBank:', data);
            return res.status(response.status).json({
                error: 'Erro ao gerar PIX',
                details: data
            });
        }

        const qrCode = data.qr_codes?.[0];
        const qrCodeImageLink = qrCode?.links?.find(link => link.rel === 'QRCODE.PNG');

        console.log('✅ PIX gerado com sucesso!');

        return res.status(200).json({
            success: true,
            message: 'Inscrição realizada com sucesso!',
            inscricao: {
                nome: dados.nome_completo,
                email: dados.email,
                numero_parcelas: dados.numero_parcelas,
                valor_parcela: `R$ ${valorParcela}`
            },
            pix: {
                id: data.id,
                qr_code_texto: qrCode?.text,
                qr_code_imagem: qrCodeImageLink?.href,
                valor: `R$ ${valorParcela}`,
                expiracao: qrCode?.expiration_date
            }
        });

    } catch (error) {
        console.error('❌ Erro ao processar inscrição:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
}
