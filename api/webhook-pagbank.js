// Webhook para receber notificações de pagamento do PagBank
import { google } from 'googleapis';

export default async function handler(req, res) {
    // Apenas aceita POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const notification = req.body;

        console.log('🔔 Notificação PagBank recebida:', JSON.stringify(notification, null, 2));

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

            // Registrar pagamento no Google Sheets
            await registrarPagamento({
                orderId,
                referenceId,
                chargeId: paidCharge.id,
                amount: paidCharge.amount?.value,
                paidAt: paidCharge.paid_at,
                customerEmail: notification.customer?.email
            });
        }

        // Verificar se foi cancelado ou expirou
        if (charges.some(charge => charge.status === 'CANCELED' || charge.status === 'DECLINED')) {
            console.log('❌ Pagamento cancelado/recusado:', {
                orderId,
                referenceId
            });
        }

        // Sempre retornar 200 OK para o PagBank
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

// Função para registrar pagamento no Google Sheets
async function registrarPagamento(dadosPagamento) {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        // Verificar se aba Pagamentos existe, senão criar
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        let pagamentosExists = spreadsheet.data.sheets.some(
            sheet => sheet.properties.title === 'Pagamentos'
        );

        if (!pagamentosExists) {
            console.log('📝 Criando aba Pagamentos...');

            // Criar aba
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: 'Pagamentos',
                                gridProperties: {
                                    frozenRowCount: 1
                                }
                            }
                        }
                    }]
                }
            });

            // Adicionar cabeçalhos
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Pagamentos!A1:H1',
                valueInputOption: 'RAW',
                resource: {
                    values: [[
                        'Data/Hora',
                        'Reference ID',
                        'Order ID',
                        'Charge ID',
                        'Email',
                        'Valor (centavos)',
                        'Valor (R$)',
                        'Status'
                    ]]
                }
            });

            // Formatar cabeçalho
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests: [{
                        repeatCell: {
                            range: {
                                sheetId: spreadsheet.data.sheets.find(s => s.properties.title === 'Pagamentos').properties.sheetId,
                                startRowIndex: 0,
                                endRowIndex: 1
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.4, green: 0.4, blue: 0.8 },
                                    textFormat: {
                                        foregroundColor: { red: 1, green: 1, blue: 1 },
                                        bold: true
                                    }
                                }
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat)'
                        }
                    }]
                }
            });
        }

        // Registrar pagamento
        const valorReais = ((dadosPagamento.amount || 0) / 100).toFixed(2);
        const dataPagamento = dadosPagamento.paidAt || new Date().toISOString();

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Pagamentos!A:H',
            valueInputOption: 'RAW',
            resource: {
                values: [[
                    new Date(dataPagamento).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
                    dadosPagamento.referenceId,
                    dadosPagamento.orderId,
                    dadosPagamento.chargeId,
                    dadosPagamento.customerEmail || '',
                    dadosPagamento.amount,
                    `R$ ${valorReais}`,
                    'PAID'
                ]]
            }
        });

        console.log('✅ Pagamento registrado na planilha Pagamentos!');

        // Enviar email de confirmação ao inscrito
        try {
            const { enviarConfirmacaoPagamento } = await import('./enviar-email.js');

            // Extrair info da referência (inscricao_timestamp_email)
            const refParts = dadosPagamento.referenceId.split('_');

            await enviarConfirmacaoPagamento({
                email: dadosPagamento.customerEmail,
                nome: 'Inscrito', // TODO: Buscar nome da planilha
                valor: `R$ ${valorReais}`,
                numeroParcela: 1, // TODO: Identificar número da parcela
                totalParcelas: 1 // TODO: Buscar total de parcelas
            });

            console.log('✅ Email de confirmação enviado!');
        } catch (emailError) {
            console.error('⚠️ Erro ao enviar email (não crítico):', emailError);
            // Não falhar o processo se o email falhar
        }

    } catch (error) {
        console.error('❌ Erro ao registrar pagamento:', error);
        throw error;
    }
}
