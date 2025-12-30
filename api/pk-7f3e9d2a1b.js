/**
 * Endpoint público para servir a chave pública do PagBank Connect Challenge
 *
 * URL: https://inscricoes-sigma.vercel.app/api/pk-7f3e9d2a1b
 *
 * Esta URL deve ser cadastrada no PagBank:
 * - Login em: https://minhaconta.pagseguro.uol.com.br/
 * - Vendas → Integrações → Chave Pública
 */

export default async function handler(req, res) {
    // Apenas GET é permitido
    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Método não permitido. Use GET.'
        });
    }

    // Buscar chave pública das variáveis de ambiente
    const publicKey = process.env.PAGBANK_PUBLIC_KEY;

    if (!publicKey) {
        console.error('❌ PAGBANK_PUBLIC_KEY não configurada no Vercel');
        return res.status(500).json({
            error: 'Chave pública não configurada'
        });
    }

    // Timestamp de quando a chave foi criada
    const createdAt = process.env.PAGBANK_KEY_CREATED_AT
        ? parseInt(process.env.PAGBANK_KEY_CREATED_AT)
        : Date.now();

    console.log('✅ Chave pública servida com sucesso');

    // Retornar no formato esperado pelo PagBank
    return res.status(200).json({
        public_key: publicKey,
        created_at: createdAt
    });
}
