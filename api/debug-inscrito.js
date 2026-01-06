// Endpoint de debug para verificar dados brutos do inscrito
import { google } from 'googleapis';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { cpf } = req.body;

        if (!cpf) {
            return res.status(400).json({ error: 'CPF obrigatório' });
        }

        const cpfLimpo = cpf.replace(/\D/g, '');

        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Inscrições!A:AZ',
        });

        const rows = response.data.values;
        const headers = rows[0];
        const cpfIndex = headers.indexOf('cpf');

        const inscritosComCPF = rows.slice(1).filter(row => {
            const rowCPF = (row[cpfIndex] || '').replace(/\D/g, '');
            return rowCPF === cpfLimpo;
        });

        if (inscritosComCPF.length === 0) {
            return res.status(404).json({ error: 'CPF não encontrado' });
        }

        const inscritoRow = inscritosComCPF[inscritosComCPF.length - 1];
        const inscrito = {};
        headers.forEach((header, index) => {
            inscrito[header] = inscritoRow[index] || '';
        });

        // Dados de debug das parcelas
        const parcelasDebug = [];
        for (let i = 1; i <= 11; i++) {
            const parcelaKey = `parcela_${String(i).padStart(2, '0')}_paga`;
            const dataVencimentoKey = `data_pagamento_${String(i).padStart(2, '0')}`;
            const dataPagaKey = `data_paga_${String(i).padStart(2, '0')}`;

            parcelasDebug.push({
                numero: i,
                [parcelaKey]: inscrito[parcelaKey],
                [dataVencimentoKey]: inscrito[dataVencimentoKey],
                [dataPagaKey]: inscrito[dataPagaKey]
            });
        }

        return res.status(200).json({
            nome: inscrito.nome_completo,
            cpf: inscrito.cpf,
            numero_parcelas: inscrito.numero_parcelas,
            dia_vencimento: inscrito.dia_vencimento,
            parcelas: parcelasDebug,
            headers: headers,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro:', error);
        return res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
}
