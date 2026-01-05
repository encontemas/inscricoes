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

            let timeoutId;
            try {
                const controller = new AbortController();
                timeoutId = setTimeout(() => controller.abort(), 10000);

                const response = await fetch(`${baseUrl}/public-keys`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${pagBankToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'User-Agent': 'inscricoes/1.0'
                    },
                    signal: controller.signal,
                    body: JSON.stringify({
                        type: "card"
                    })
                });
                const responseBody = await response.text();
                let data = {};

                if (responseBody) {
                    try {
                        data = JSON.parse(responseBody);
                    } catch (parseError) {
                        data = {
                            error: 'Resposta inválida do PagBank',
                            details: responseBody
                        };
                    }
                } else {
                    data = {
                        error: 'Resposta vazia do PagBank'
                    };
                }

                console.log('📥 Resposta:', JSON.stringify(data, null, 2));

                return {
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    contentType: response.headers?.get?.('content-type') || null,
                    data,
                    environment: environmentLabel
                };
            } catch (requestError) {
                console.error('❌ Falha ao chamar PagBank:', requestError);
                const isAbort = requestError?.name === 'AbortError';
                return {
                    ok: false,
                    status: isAbort ? 504 : 502,
                    statusText: isAbort ? 'FETCH_TIMEOUT' : 'FETCH_FAILED',
                    contentType: null,
                    data: {
                        error: isAbort
                            ? 'Tempo limite ao chamar o PagBank'
                            : 'Falha ao chamar o PagBank',
                        details: requestError?.message || 'Erro desconhecido'
                    },
                    environment: environmentLabel
                };
            } finally {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            }
        };

        const baseUrl = process.env.PAGBANK_API_URL?.trim()
            || (isProduction
                ? 'https://api.pagseguro.com'
                : 'https://sandbox.api.pagseguro.com');
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
        });
    } catch (error) {
        console.error('❌ Erro:', error);
        return res.status(500).json({
            error: error.message
        });
    }
}
