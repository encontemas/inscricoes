// Script para recalcular status_pagamento de todos os inscritos
import { google } from 'googleapis';

/**
 * Converte índice numérico para letra de coluna do Excel
 */
function indexToColumnLetter(index) {
    let column = '';
    let num = index;

    while (num >= 0) {
        column = String.fromCharCode((num % 26) + 65) + column;
        num = Math.floor(num / 26) - 1;
    }

    return column;
}

/**
 * Recalcula status_pagamento e campos derivados para todos os inscritos
 */
export default async function handler(req, res) {
    try {
        console.log('🔄 Iniciando recálculo de status de pagamento...');

        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        // Buscar dados da planilha
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Inscrições!A:BQ',
        });

        const rows = response.data.values;

        if (!rows || rows.length <= 1) {
            return res.status(200).json({
                success: false,
                message: 'Nenhuma inscrição encontrada'
            });
        }

        // Cabeçalhos
        const headers = rows[0];
        const idInscricaoIndex = headers.indexOf('id_inscricao');
        const numeroParcelasIndex = headers.indexOf('numero_parcelas');
        const valorParcelaIndex = headers.indexOf('valor_parcela');
        const valorTotalIndex = headers.indexOf('valor_total');
        const statusPagamentoIndex = headers.indexOf('status_pagamento');
        const totalParcelasPagasIndex = headers.indexOf('total_parcelas_pagas');
        const valorTotalPagoIndex = headers.indexOf('valor_total_pago');
        const saldoDevedorIndex = headers.indexOf('saldo_devedor');
        const percentualPagoIndex = headers.indexOf('percentual_pago');

        console.log(`📊 Encontradas ${rows.length - 1} inscrições para processar`);

        const updates = [];
        let processados = 0;
        let comPagamento = 0;

        // Processar cada inscrição (começando da linha 2, índice 1)
        for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            const idInscricao = row[idInscricaoIndex] || `Linha ${rowIndex + 1}`;
            const totalParcelas = parseInt(row[numeroParcelasIndex]) || 0;
            const valorParcela = parseFloat(row[valorParcelaIndex]) || 0;
            const valorTotal = parseFloat(row[valorTotalIndex]) || 0;

            if (totalParcelas === 0) {
                console.log(`⚠️ ${idInscricao}: Sem parcelas definidas, pulando...`);
                continue;
            }

            // Contar parcelas pagas
            let parcelasPagas = 0;

            for (let i = 1; i <= 11; i++) { // Verificar todas as 11 possíveis parcelas
                const parcelaKey = `parcela_${String(i).padStart(2, '0')}_paga`;
                const parcelaIndex = headers.indexOf(parcelaKey);

                if (parcelaIndex !== -1) {
                    const valorParcela = row[parcelaIndex];
                    if (valorParcela === '1' || valorParcela === 1 || valorParcela === true) {
                        parcelasPagas++;
                    }
                }
            }

            // Calcular valores
            const valorPago = parcelasPagas * valorParcela;
            const saldoDevedor = valorTotal - valorPago;
            const percentualPago = valorTotal > 0 ? Math.round((valorPago / valorTotal) * 100) : 0;

            // Determinar status
            let status = 'PENDENTE';
            if (parcelasPagas >= totalParcelas) {
                status = 'PAGO';
            } else if (parcelasPagas > 0) {
                status = 'PARCIAL';
            }

            // Atualizar status_pagamento
            if (statusPagamentoIndex !== -1) {
                const statusCol = indexToColumnLetter(statusPagamentoIndex);
                updates.push({
                    range: `Inscrições!${statusCol}${rowIndex + 1}`,
                    values: [[status]]
                });
            }

            // Atualizar total_parcelas_pagas
            if (totalParcelasPagasIndex !== -1) {
                const totalPagasCol = indexToColumnLetter(totalParcelasPagasIndex);
                updates.push({
                    range: `Inscrições!${totalPagasCol}${rowIndex + 1}`,
                    values: [[parcelasPagas]]
                });
            }

            // Atualizar valor_total_pago
            if (valorTotalPagoIndex !== -1) {
                const valorPagoCol = indexToColumnLetter(valorTotalPagoIndex);
                updates.push({
                    range: `Inscrições!${valorPagoCol}${rowIndex + 1}`,
                    values: [[valorPago]]
                });
            }

            // Atualizar saldo_devedor
            if (saldoDevedorIndex !== -1) {
                const saldoCol = indexToColumnLetter(saldoDevedorIndex);
                updates.push({
                    range: `Inscrições!${saldoCol}${rowIndex + 1}`,
                    values: [[saldoDevedor]]
                });
            }

            // Atualizar percentual_pago
            if (percentualPagoIndex !== -1) {
                const percentualCol = indexToColumnLetter(percentualPagoIndex);
                updates.push({
                    range: `Inscrições!${percentualCol}${rowIndex + 1}`,
                    values: [[percentualPago]]
                });
            }

            processados++;
            if (parcelasPagas > 0) {
                comPagamento++;
                console.log(`✅ ${idInscricao}: ${status} (${parcelasPagas}/${totalParcelas} parcelas = ${percentualPago}%)`);
            } else {
                console.log(`📝 ${idInscricao}: ${status} (0/${totalParcelas} parcelas)`);
            }
        }

        // Executar atualizações em lote
        if (updates.length > 0) {
            console.log(`\n🔄 Aplicando ${updates.length} atualizações na planilha...`);

            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                resource: {
                    valueInputOption: 'RAW',
                    data: updates
                }
            });

            console.log('✅ Recálculo concluído com sucesso!');

            return res.status(200).json({
                success: true,
                message: 'Status recalculado com sucesso',
                stats: {
                    total: processados,
                    comPagamento: comPagamento,
                    semPagamento: processados - comPagamento,
                    camposAtualizados: updates.length
                }
            });
        } else {
            console.log('⚠️ Nenhuma atualização necessária');

            return res.status(200).json({
                success: true,
                message: 'Nenhuma atualização necessária',
                stats: {
                    total: processados,
                    comPagamento: 0,
                    semPagamento: processados
                }
            });
        }

    } catch (error) {
        console.error('❌ Erro ao recalcular status:', error);

        return res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}
