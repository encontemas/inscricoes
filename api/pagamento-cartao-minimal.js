// TESTE MINIMALISTA - Payload mínimo possível para PagBank
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { cartao_encrypted } = req.body;

        const pagBankToken = process.env.PAGBANK_TOKEN;
        const timestamp = Date.now();

        // PAYLOAD ABSOLUTAMENTE MÍNIMO
        const minimalPayload = {
            reference_id: `REF_${timestamp}`,
            customer: {
                name: "Jose da Silva",
                email: "jose@test.com",
                tax_id: "11895008689",
                phones: [{
                    country: "55",
                    area: "11",
                    number: "123456789",
                    type: "MOBILE"
                }]
            },
            items: [{
                reference_id: "ITEM001",
                name: "Produto Teste",
                quantity: 1,
                unit_amount: 1000
            }],
            charges: [{
                reference_id: "1",
                amount: {
                    value: 1000,
                    currency: "BRL"
                },
                payment_method: {
                    type: "CREDIT_CARD",
                    installments: 1,
                    capture: true,
                    card: {
                        encrypted: cartao_encrypted
                    }
                }
            }]
        };

        console.log('🧪 TESTE MINIMAL - Payload:', JSON.stringify(minimalPayload, null, 2));

        const response = await fetch('https://sandbox.api.pagseguro.com/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pagBankToken}`
            },
            body: JSON.stringify(minimalPayload)
        });

        const responseData = await response.json();

        console.log('📥 Resposta:', JSON.stringify(responseData, null, 2));

        return res.status(response.status).json(responseData);

    } catch (error) {
        console.error('❌ Erro:', error);
        return res.status(500).json({
            error: error.message
        });
    }
}
