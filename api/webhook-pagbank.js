// Webhook para receber notificações de pagamento do PagBank
export default async function handler(req, res) {
    // Apenas aceita POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const notification = req.body;

        console.log('🔔 Notificação PagBank recebida:', JSON.stringify(notification, null, 2));

        // PagBank envia notificações com este formato:
        // {
        //   "id": "ORDE_XXX",
        //   "reference_id": "ex-00001",
        //   "created_at": "2021-08-29T20:15:59-03:00",
        //   "charges": [...],
        //   ...
        // }

        // Extrair informações importantes
        const orderId = notification.id;
        const referenceId = notification.reference_id;
        const charges = notification.charges || [];

        // Verificar status do pagamento
        const paidCharge = charges.find(charge => charge.status === 'PAID');

        if (paidCharge) {
            console.log('✅ Pagamento confirmado!', {
                orderId,
                referenceId,
                chargeId: paidCharge.id,
                amount: paidCharge.amount?.value,
                paidAt: paidCharge.paid_at
            });

            // TODO: Aqui você deve:
            // 1. Atualizar status no Google Sheets
            // 2. Enviar e-mail de confirmação
            // 3. Liberar acesso ao evento
            // 4. Marcar parcela como paga

            // Por enquanto, apenas logamos
            console.log('📊 Ação necessária: Atualizar registro de pagamento');
        }

        // Verificar se foi cancelado ou expirou
        if (charges.some(charge => charge.status === 'CANCELED' || charge.status === 'DECLINED')) {
            console.log('❌ Pagamento cancelado/recusado:', {
                orderId,
                referenceId
            });
        }

        // Sempre retornar 200 OK para o PagBank
        // Se não retornar 200, ele continuará reenviando a notificação
        return res.status(200).json({
            received: true,
            orderId,
            referenceId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao processar webhook:', error);

        // Mesmo com erro, retornar 200 para evitar reenvios
        return res.status(200).json({
            received: true,
            error: error.message
        });
    }
}
