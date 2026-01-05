// API para GERAR uma nova chave pública do PagBank
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const pagBankToken = process.env.PAGBANK_TOKEN;
        const envValue = (process.env.PAGBANK_ENV || '').trim().toLowerCase();
        const isProduction = envValue === 'production';

        if (!pagBankToken) {
            return res.status(500).json({
                error: 'Token não configurado'
            });
        }

        console.log('📡 Gerando nova chave pública do PagBank...');
        console.log('🌐 Ambiente PagBank:', isProduction ? 'production' : 'sandbox');

        const baseUrl = isProduction
            ? 'https://api.pagseguro.com'
            : 'https://sandbox.api.pagseguro.com';

        // Endpoint para CRIAR/GERAR chave pública
        const response = await fetch(`${baseUrl}/public-keys`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pagBankToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                type: "card"
            })
        });

        const responseText = await response.text();
        let data = {};

        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                data = {
                    error: 'Resposta inválida do PagBank',
                    details: responseText
                };
            }
        } else {
            data = {
                error: 'Resposta vazia do PagBank'
            };
        }

        console.log('📥 Resposta:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Erro ao gerar chave',
                details: data,
                status: response.status,
                statusText: response.statusText
            });
        }

        if (!data.public_key) {
            return res.status(502).json({
                error: 'Resposta inesperada do PagBank',
                details: data
            });
        }

        // Retornar a chave pública gerada
        return res.status(200).json({
            success: true,
            public_key: data.public_key,
            created_at: data.created_at,
            instrucoes: 'Copie esta chave e atualize a variável PAGBANK_PUBLIC_KEY no Vercel'
        });

    } catch (error) {
        console.error('❌ Erro:', error);
        return res.status(500).json({
            error: error.message
        });
    }
}
