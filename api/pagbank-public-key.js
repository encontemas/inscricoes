// API para retornar a chave pública do PagBank baseada no ambiente
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // Determinar ambiente baseado em variável de ambiente
        const isProduction = process.env.PAGBANK_ENV === 'production';

        // Buscar chaves públicas das variáveis de ambiente
        const publicKeySandbox = process.env.PAGBANK_PUBLIC_KEY_SANDBOX;
        const publicKeyProduction = process.env.PAGBANK_PUBLIC_KEY_PROD;

        // Validar que as chaves existem
        if (!publicKeySandbox) {
            console.error('❌ PAGBANK_PUBLIC_KEY_SANDBOX não configurada');
            return res.status(500).json({
                error: 'Configuração incompleta',
                message: 'Chave pública sandbox não configurada'
            });
        }

        if (isProduction && !publicKeyProduction) {
            console.error('❌ PAGBANK_PUBLIC_KEY_PROD não configurada');
            return res.status(500).json({
                error: 'Configuração incompleta',
                message: 'Chave pública produção não configurada'
            });
        }

        const publicKey = isProduction ? publicKeyProduction : publicKeySandbox;
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
