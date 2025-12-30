// API para buscar dados do inscrito pelo CPF
import { google } from 'googleapis';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { cpf } = req.body;

        if (!cpf) {
            return res.status(400).json({
                error: 'CPF obrigatório'
            });
        }

        // Limpar CPF (apenas números)
        const cpfLimpo = cpf.replace(/\D/g, '');

        if (cpfLimpo.length !== 11) {
            return res.status(400).json({
                error: 'CPF inválido'
            });
        }

        console.log('🔍 Buscando inscrito com CPF:', cpfLimpo);

        // Configurar Google Sheets
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        // Buscar dados na planilha
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Inscrições!A:AZ',
        });

        const rows = response.data.values;

        if (!rows || rows.length <= 1) {
            return res.status(404).json({
                error: 'Nenhuma inscrição encontrada'
            });
        }

        // Cabeçalhos (primeira linha)
        const headers = rows[0];
        const cpfIndex = headers.indexOf('cpf');

        if (cpfIndex === -1) {
            return res.status(500).json({
                error: 'Estrutura da planilha inválida'
            });
        }

        // Buscar inscrito pelo CPF
        const inscritoRow = rows.slice(1).find(row => {
            const rowCPF = (row[cpfIndex] || '').replace(/\D/g, '');
            return rowCPF === cpfLimpo;
        });

        if (!inscritoRow) {
            return res.status(404).json({
                error: 'CPF não encontrado',
                message: 'Verifique se você já realizou sua inscrição'
            });
        }

        // Montar objeto com dados do inscrito
        const inscrito = {};
        headers.forEach((header, index) => {
            inscrito[header] = inscritoRow[index] || '';
        });

        // Gerar informações das parcelas
        const numeroParcelas = parseInt(inscrito.numero_parcelas) || 1;
        const valorTotal = 450.00;
        const valorParcela = (valorTotal / numeroParcelas).toFixed(2);

        // Data base: 15 de cada mês a partir de hoje
        const dataBase = new Date();
        dataBase.setDate(15);
        if (dataBase < new Date()) {
            dataBase.setMonth(dataBase.getMonth() + 1);
        }

        const parcelas = [];
        for (let i = 1; i <= numeroParcelas; i++) {
            const vencimento = new Date(dataBase);
            vencimento.setMonth(vencimento.getMonth() + (i - 1));

            parcelas.push({
                numero: i,
                valor: parseFloat(valorParcela),
                vencimento: vencimento.toISOString().split('T')[0],
                status: 'pending', // TODO: Buscar status real de pagamentos
                pix_id: null,
                data_pagamento: null
            });
        }

        console.log('✅ Inscrito encontrado:', inscrito.nome_completo);

        return res.status(200).json({
            success: true,
            inscrito: {
                id_inscricao: inscrito.id_inscricao,
                nome: inscrito.nome_completo,
                email: inscrito.email,
                telefone: inscrito.telefone,
                cpf: inscrito.cpf,
                numero_parcelas: numeroParcelas,
                valor_parcela: parseFloat(valorParcela),
                valor_total: valorTotal,
                data_inscricao: inscrito.data_hora
            },
            parcelas: parcelas
        });

    } catch (error) {
        console.error('❌ Erro ao buscar inscrito:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
}
