// API para retornar a chave pública do PagBank baseada no ambiente
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // DIAGNÓSTICO: Ver exatamente o que está nas variáveis de ambiente
        console.log('🔍 DIAGNÓSTICO DE VARIÁVEIS DE AMBIENTE:');
        console.log('PAGBANK_ENV (raw):', JSON.stringify(process.env.PAGBANK_ENV));
        console.log('PAGBANK_ENV (value):', process.env.PAGBANK_ENV);
        console.log('PAGBANK_ENV (type):', typeof process.env.PAGBANK_ENV);
        console.log('PAGBANK_ENV (length):', process.env.PAGBANK_ENV?.length);
        console.log('PAGBANK_TOKEN (primeiros 20 chars):', process.env.PAGBANK_TOKEN?.substring(0, 20));
        console.log('PAGBANK_PUBLIC_KEY (primeiros 50 chars):', process.env.PAGBANK_PUBLIC_KEY?.substring(0, 50));

        // Determinar ambiente baseado em variável de ambiente
        const envValue = (process.env.PAGBANK_ENV || '').trim().toLowerCase();
        const isProduction = envValue === 'production';

        console.log('🔍 Comparação:', {
            envValueTrimmed: envValue,
            isProduction: isProduction,
            comparisonResult: envValue === 'production'
        });

        // Buscar chave pública da variável de ambiente
        const publicKey = process.env.PAGBANK_PUBLIC_KEY;

        // Validar que a chave existe
        if (!publicKey) {
            console.error('❌ PAGBANK_PUBLIC_KEY não configurada');
            return res.status(500).json({
                error: 'Configuração incompleta',
                message: 'Chave pública do PagBank não configurada'
            });
        }
        const environment = isProduction ? 'production' : 'sandbox';

        console.log(`📌 Retornando chave pública do PagBank para ambiente: ${environment}`);

        return res.status(200).json({
            publicKey,
            environment
        });

    } catch (error) {
        console.error('❌ Erro ao obter chave pública:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
}
