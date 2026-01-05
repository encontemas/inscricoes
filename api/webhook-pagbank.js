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
            // Detectar método de pagamento
            const paymentMethod = paidCharge.payment_method?.type || 'UNKNOWN';
            const isCardPayment = paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD';

            console.log('✅ Pagamento confirmado!', {
                orderId,
                referenceId,
                chargeId: paidCharge.id,
                amount: paidCharge.amount?.value,
                paidAt: paidCharge.paid_at,
                paymentMethod: paymentMethod,
                isCardPayment: isCardPayment
            });

            // Registrar pagamento no Google Sheets
            await registrarPagamento({
                orderId,
                referenceId,
                chargeId: paidCharge.id,
                amount: paidCharge.amount?.value,
                paidAt: paidCharge.paid_at,
                customerEmail: notification.customer?.email,
                paymentMethod: paymentMethod,
                isCardPayment: isCardPayment,
                installments: paidCharge.payment_method?.installments || 1
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
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

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

        // Atualizar status de pagamento na aba Inscrições
        // Se for cartão, marcar todas as parcelas como pagas
        await atualizarStatusPagamentoInscricao(dadosPagamento, dadosPagamento.isCardPayment);

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

// Função auxiliar exportada para uso direto em pagamento-cartao.js
export async function atualizarStatusPagamentoCartao(dadosPagamento) {
    return atualizarStatusPagamentoInscricao(dadosPagamento, true); // true = é cartão
}

// Função para atualizar status de pagamento na aba Inscrições
async function atualizarStatusPagamentoInscricao(dadosPagamento, isCardPayment = false) {
    try {
        console.log('📝 Atualizando status de pagamento na aba Inscrições...');
        console.log('💳 Tipo de pagamento:', isCardPayment ? 'CARTÃO (marcar todas)' : 'PIX (marcar primeira)');

        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        // Tentar usar id_inscricao primeiro, senão usar email (fallback)
        const idInscricao = dadosPagamento.id_inscricao;
        const email = dadosPagamento.customerEmail;

        if (!idInscricao && !email) {
            console.warn('⚠️ Nem id_inscricao nem email encontrados - não é possível atualizar');
            return;
        }

        if (idInscricao) {
            console.log('🔍 Buscando inscrição com id_inscricao:', idInscricao);
        } else {
            console.log('🔍 Fallback: Buscando inscrição com email:', email);
        }

        // Buscar dados na planilha Inscrições
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Inscrições!A:AZ',
        });

        const rows = response.data.values;

        if (!rows || rows.length <= 1) {
            console.warn('⚠️ Nenhuma inscrição encontrada na planilha');
            return;
        }

        // Cabeçalhos (primeira linha)
        const headers = rows[0];
        const idInscricaoIndex = headers.indexOf('id_inscricao');
        const emailIndex = headers.indexOf('email');
        const numeroParcelasIndex = headers.indexOf('numero_parcelas');

        // Buscar linha do inscrito (por ID ou email)
        let rowIndex = -1;

        if (idInscricao && idInscricaoIndex !== -1) {
            // Tentar buscar por ID primeiro
            for (let i = 1; i < rows.length; i++) {
                const rowId = (rows[i][idInscricaoIndex] || '').trim();
                if (rowId === idInscricao) {
                    rowIndex = i;
                    console.log('✅ Encontrado por ID na linha:', rowIndex + 1);
                    break;
                }
            }
        }

        if (rowIndex === -1 && email && emailIndex !== -1) {
            // Fallback: buscar por email
            for (let i = 1; i < rows.length; i++) {
                const rowEmail = (rows[i][emailIndex] || '').toLowerCase().trim();
                if (rowEmail === email.toLowerCase().trim()) {
                    rowIndex = i;
                    console.log('✅ Encontrado por email na linha:', rowIndex + 1);
                    break;
                }
            }
        }

        if (rowIndex === -1) {
            console.warn('⚠️ Inscrição não encontrada (tentou ID e email)');
            return;
        }

        // Buscar número de parcelas da inscrição
        const totalParcelas = parseInt(rows[rowIndex][numeroParcelasIndex]) || 1;
        console.log(`📊 Total de parcelas: ${totalParcelas}`);

        // Preparar atualizações
        const updates = [];
        const dataPaga = new Date(dadosPagamento.paidAt || new Date()).toLocaleDateString('pt-BR');

        if (isCardPayment) {
            // CARTÃO: Marcar TODAS as parcelas como pagas
            console.log(`💳 Cartão confirmado - Marcando TODAS as ${totalParcelas} parcelas como pagas`);

            for (let i = 1; i <= totalParcelas; i++) {
                const parcelaKey = `parcela_${String(i).padStart(2, '0')}_paga`;
                const dataPagaKey = `data_paga_${String(i).padStart(2, '0')}`;

                const parcelaIndex = headers.indexOf(parcelaKey);
                const dataPagaIndex = headers.indexOf(dataPagaKey);

                if (parcelaIndex !== -1) {
                    const parcelaCol = String.fromCharCode(65 + parcelaIndex);
                    updates.push({
                        range: `Inscrições!${parcelaCol}${rowIndex + 1}`,
                        values: [[1]]
                    });
                    console.log(`  ✓ ${parcelaKey} = 1`);
                }

                if (dataPagaIndex !== -1) {
                    const dataPagaCol = String.fromCharCode(65 + dataPagaIndex);
                    updates.push({
                        range: `Inscrições!${dataPagaCol}${rowIndex + 1}`,
                        values: [[dataPaga]]
                    });
                    console.log(`  ✓ ${dataPagaKey} = ${dataPaga}`);
                }
            }
        } else {
            // PIX: Marcar apenas a primeira parcela como paga
            console.log('💰 PIX confirmado - Marcando primeira parcela como paga');

            const numeroParcela = 1;
            const parcelaKey = `parcela_${String(numeroParcela).padStart(2, '0')}_paga`;
            const dataPagaKey = `data_paga_${String(numeroParcela).padStart(2, '0')}`;

            const parcelaIndex = headers.indexOf(parcelaKey);
            const dataPagaIndex = headers.indexOf(dataPagaKey);

            if (parcelaIndex === -1) {
                console.error(`❌ Coluna "${parcelaKey}" não encontrada na planilha`);
                return;
            }

            // Marcar parcela como paga (valor = 1)
            const parcelaCol = String.fromCharCode(65 + parcelaIndex);
            updates.push({
                range: `Inscrições!${parcelaCol}${rowIndex + 1}`,
                values: [[1]]
            });

            // Atualizar data efetiva do pagamento se a coluna existir
            if (dataPagaIndex !== -1) {
                const dataPagaCol = String.fromCharCode(65 + dataPagaIndex);
                updates.push({
                    range: `Inscrições!${dataPagaCol}${rowIndex + 1}`,
                    values: [[dataPaga]]
                });
                console.log(`📅 Atualizando ${dataPagaKey} = ${dataPaga}`);
            } else {
                console.warn(`⚠️ Coluna "${dataPagaKey}" não encontrada.`);
            }
        }

        // Atualizar campos adicionais de pagamento (parcelas_cartao, transacao_id, status_pagamento)
        const parcelasCartaoIndex = headers.indexOf('parcelas_cartao');
        const transacaoIdIndex = headers.indexOf('transacao_id');
        const statusPagamentoIndex = headers.indexOf('status_pagamento');

        if (isCardPayment && parcelasCartaoIndex !== -1) {
            const parcelasCartaoCol = String.fromCharCode(65 + parcelasCartaoIndex);
            const parcelasCartao = dadosPagamento.installments || 1;
            updates.push({
                range: `Inscrições!${parcelasCartaoCol}${rowIndex + 1}`,
                values: [[parcelasCartao]]
            });
            console.log(`💳 Atualizando parcelas_cartao = ${parcelasCartao}`);
        }

        if (transacaoIdIndex !== -1) {
            const transacaoIdCol = String.fromCharCode(65 + transacaoIdIndex);
            const transacaoId = dadosPagamento.orderId || dadosPagamento.chargeId || '';
            updates.push({
                range: `Inscrições!${transacaoIdCol}${rowIndex + 1}`,
                values: [[transacaoId]]
            });
            console.log(`🔑 Atualizando transacao_id = ${transacaoId}`);
        }

        if (statusPagamentoIndex !== -1) {
            const statusPagamentoCol = String.fromCharCode(65 + statusPagamentoIndex);
            updates.push({
                range: `Inscrições!${statusPagamentoCol}${rowIndex + 1}`,
                values: [['APROVADO']]
            });
            console.log(`✅ Atualizando status_pagamento = APROVADO`);
        }

        // Executar todas as atualizações
        if (updates.length > 0) {
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                resource: {
                    valueInputOption: 'RAW',
                    data: updates
                }
            });

            console.log(`✅ Status de pagamento atualizado com sucesso para ${email}`);
            console.log(`📊 Total de campos atualizados: ${updates.length}`);
        } else {
            console.warn('⚠️ Nenhuma atualização foi preparada');
        }

    } catch (error) {
        console.error('❌ Erro ao atualizar status de pagamento na inscrição:', error);
        // Não lançar erro para não quebrar o webhook
    }
}
