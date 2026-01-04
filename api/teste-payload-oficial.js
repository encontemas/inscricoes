// TESTE: Payload EXATO da documentação oficial
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { cartao_encrypted } = req.body;

        const pagBankToken = process.env.PAGBANK_TOKEN;

        // PAYLOAD EXATAMENTE IGUAL AO EXEMPLO OFICIAL
        // https://developer.pagbank.com.br/reference/criar-pagar-pedido-com-cartao
        const payloadOficial = {
            "reference_id": "ex-00001",
            "customer": {
                "name": "Jose da Silva",
                "email": "customer@example.com",
                "tax_id": "12345678909",
                "phones": [
                    {
                        "country": "55",
                        "area": "11",
                        "number": "999999999",
                        "type": "MOBILE"
                    }
                ]
            },
            "items": [
                {
                    "reference_id": "referencia do item",
                    "name": "nome do item",
                    "quantity": 1,
                    "unit_amount": 500
                }
            ],
            "shipping": {
                "address": {
                    "street": "Avenida Brigadeiro Faria Lima",
                    "number": "1384",
                    "complement": "apto 12",
                    "locality": "Pinheiros",
                    "city": "São Paulo",
                    "region_code": "SP",
                    "country": "BRA",
                    "postal_code": "01452002"
                }
            },
            "notification_urls": [
                "https://meusite.com/notificacoes"
            ],
            "charges": [
                {
                    "reference_id": "referencia da cobranca",
                    "description": "descricao da cobranca",
                    "amount": {
                        "value": 500,
                        "currency": "BRL"
                    },
                    "payment_method": {
                        "type": "CREDIT_CARD",
                        "installments": 1,
                        "capture": true,
                        "card": {
                            "encrypted": cartao_encrypted, // ÚNICO campo que mudamos
                            "store": false
                        },
                        "holder": {
                            "name": "Jose da Silva",
                            "tax_id": "65544332211"
                        }
                    }
                }
            ]
        };

        console.log('🧪 TESTE COM PAYLOAD OFICIAL');
        console.log('Payload:', JSON.stringify(payloadOficial, null, 2));

        const response = await fetch('https://sandbox.api.pagseguro.com/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pagBankToken}`
            },
            body: JSON.stringify(payloadOficial)
        });

        const responseData = await response.json();

        console.log('📥 Status:', response.status);
        console.log('📥 Response:', JSON.stringify(responseData, null, 2));

        return res.status(response.status).json({
            status: response.status,
            payload_usado: payloadOficial,
            resposta_pagbank: responseData
        });

    } catch (error) {
        console.error('❌ Erro:', error);
        return res.status(500).json({
            error: error.message
        });
    }
}
