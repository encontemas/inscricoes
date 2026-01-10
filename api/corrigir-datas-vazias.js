// Script para corrigir datas de vencimento vazias
import { google } from 'googleapis';

function indexToColumnLetter(index) {
    let column = '';
    let num = index;
    while (num >= 0) {
        column = String.fromCharCode((num % 26) + 65) + column;
        num = Math.floor(num / 26) - 1;
    }
    return column;
}

export default async function handler(req, res) {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Inscrições!A:BQ',
        });

        const rows = response.data.values;
        const headers = rows[0];

        // Índices importantes
        const idIndex = headers.indexOf('id_inscricao');
        const nomeIndex = headers.indexOf('nome_completo');
        const numeroParcelasIndex = headers.indexOf('numero_parcelas');
        const diaVencimentoIndex = headers.indexOf('dia_vencimento');

        const updates = [];
        const correcoes = [];

        // Processar cada inscrição
        for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
            const row = rows[rowIdx];
            const idInscricao = row[idIndex];
            const nome = row[nomeIndex];
            const numParcelas = parseInt(row[numeroParcelasIndex]) || 0;
            const diaVencimento = parseInt(row[diaVencimentoIndex]) || 10;

            // Data base: primeira parcela vence no mês corrente
            const dataBase = new Date();
            dataBase.setDate(diaVencimento);
            dataBase.setHours(12, 0, 0, 0);

            // Verificar e corrigir cada parcela
            for (let i = 1; i <= numParcelas; i++) {
                const dataVencKey = `data_pagamento_${String(i).padStart(2, '0')}`;
                const dataVencIndex = headers.indexOf(dataVencKey);

                if (dataVencIndex === -1) continue;

                const dataAtual = row[dataVencIndex];

                // Se está vazio, calcular data correta
                if (!dataAtual || dataAtual.trim() === '') {
                    // Calcular data de vencimento
                    let ano = dataBase.getFullYear();
                    let mes = dataBase.getMonth() + (i - 1);
                    let dia = diaVencimento;

                    // Ajustar ano se necessário
                    while (mes > 11) {
                        mes -= 12;
                        ano += 1;
                    }

                    const vencimento = new Date(ano, mes, dia, 12, 0, 0);
                    const diaStr = String(vencimento.getDate()).padStart(2, '0');
                    const mesStr = String(vencimento.getMonth() + 1).padStart(2, '0');
                    const anoStr = vencimento.getFullYear();
                    const dataCorreta = `${diaStr}/${mesStr}/${anoStr}`;

                    // Adicionar atualização
                    const colLetter = indexToColumnLetter(dataVencIndex);
                    updates.push({
                        range: `Inscrições!${colLetter}${rowIdx + 1}`,
                        values: [[dataCorreta]]
                    });

                    correcoes.push({
                        linha: rowIdx + 1,
                        id: idInscricao,
                        nome: nome,
                        parcela: i,
                        dataCalculada: dataCorreta
                    });
                }
            }
        }

        // Executar atualizações
        if (updates.length > 0) {
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                resource: {
                    valueInputOption: 'RAW',
                    data: updates
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Correção concluída',
            totalCorrecoes: correcoes.length,
            correcoes: correcoes
        });

    } catch (error) {
        console.error('Erro:', error);
        return res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
}
