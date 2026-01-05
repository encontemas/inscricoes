// API para GERAR uma nova chave pública do PagBank
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const pagBankToken = process.env.PAGBANK_TOKEN;
        const envValue = (process.env.PAGBANK_ENV || '').trim().toLowerCase();
        const isProduction = envValue === '' || envValue.startsWith('prod');

        if (!pagBankToken) {
            return res.status(500).json({
                error: 'Token não configurado'
            });
        }

        const requestPublicKey = async (baseUrl, environmentLabel) => {
            console.log('📡 Gerando nova chave pública do PagBank...');
            console.log('🌐 Ambiente PagBank:', environmentLabel);

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
        }

            console.log('📥 Resposta:', JSON.stringify(data, null, 2));

            return {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                contentType: response.headers.get('content-type'),
                data,
                environment: environmentLabel
            };
        };

        const baseUrl = isProduction
            ? 'https://api.pagseguro.com'
            : 'https://sandbox.api.pagseguro.com';
        const environment = isProduction ? 'production' : 'sandbox';
        const attempt = await requestPublicKey(baseUrl, environment);

        if (attempt.ok && attempt.data?.public_key) {
            return res.status(200).json({
                success: true,
                public_key: attempt.data.public_key,
                created_at: attempt.data.created_at,
                environment: attempt.environment,
                instrucoes: 'Copie esta chave e atualize a variável PAGBANK_PUBLIC_KEY no Vercel'
            });
        }

        return res.status(attempt.status || 502).json({
            error: 'Erro ao gerar chave',
            details: attempt
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
