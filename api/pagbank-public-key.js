// API para retornar a chave pública do PagBank baseada no ambiente
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // Determinar ambiente baseado em variável de ambiente
        const isProduction = process.env.PAGBANK_ENV === 'production';

        // Chaves públicas do PagBank
        const publicKeys = {
            sandbox: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr+ZqgD892U9/HXsa7XqBZUayPquAfh9xx4iwUbTSUAvTlmiXFQNTp0Bvt/5vK2FhMj39qSv1zi2OuBjvW38q1E3LhJdFQTKvURCiYwb6y2JmJMIK4OxXxg0TaVrKoBEJJ7f4p6dzPZZ8HNJwAUAj3u8mPcUNbfwmQmUmzCkkRjhZ7VcKGdjC1rNAqnl56xPbP/+Ou2fU3qvgJWxwQWCYMALDU3LNJJ7sXgZqJv8rBF8P1/hDUfDYYBxJ3kRFKyKVIzqG6mMRCNqpDvWj9Xy8HTa6Ug0iL2vWJNFwUXSfGvCfMdmQKpXVVVUBjbPPhXdNDwHsD4F0TxjJXfPhQUQPVQIDAQAB',
            production: process.env.PAGBANK_PUBLIC_KEY_PROD || 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr+ZqgD892U9/HXsa7XqBZUayPquAfh9xx4iwUbTSUAvTlmiXFQNTp0Bvt/5vK2FhMj39qSv1zi2OuBjvW38q1E3LhJdFQTKvURCiYwb6y2JmJMIK4OxXxg0TaVrKoBEJJ7f4p6dzPZZ8HNJwAUAj3u8mPcUNbfwmQmUmzCkkRjhZ7VcKGdjC1rNAqnl56xPbP/+Ou2fU3qvgJWxwQWCYMALDU3LNJJ7sXgZqJv8rBF8P1/hDUfDYYBxJ3kRFKyKVIzqG6mMRCNqpDvWj9Xy8HTa6Ug0iL2vWJNFwUXSfGvCfMdmQKpXVVVUBjbPPhXdNDwHsD4F0TxjJXfPhQUQPVQIDAQAB'
        };

        const publicKey = isProduction ? publicKeys.production : publicKeys.sandbox;
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
