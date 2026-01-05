// API para dar baixa manual em parcelas (uso administrativo)
import { google } from 'googleapis';

/**
 * Converte índice numérico para letra de coluna do Excel
 * 0 => A, 1 => B, 25 => Z, 26 => AA, 27 => AB, etc.
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

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { cpf, numeroParcela } = req.body;

        // Validações
        if (!cpf || cpf.length !== 11) {
            return res.status(400).json({
                error: 'CPF inválido',
                message: 'CPF deve ter 11 dígitos'
            });
        }

        if (!numeroParcela || numeroParcela < 1 || numeroParcela > 11) {
            return res.status(400).json({
                error: 'Parcela inválida',
                message: 'Número da parcela deve ser entre 1 e 11'
            });
        }

        console.log('🔧 [ADMIN] Dando baixa manual em parcela:', { cpf, numeroParcela });

        // Conectar ao Google Sheets
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

        // Cabeçalhos
        const headers = rows[0];
        const cpfIndex = headers.indexOf('cpf');

        if (cpfIndex === -1) {
            return res.status(500).json({
                error: 'Coluna CPF não encontrada na planilha'
            });
        }

        // Buscar linha do inscrito
        let rowIndex = -1;

        for (let i = 1; i < rows.length; i++) {
            const rowCpf = (rows[i][cpfIndex] || '').replace(/\D/g, '');
            if (rowCpf === cpf) {
                rowIndex = i;
                console.log('✅ Inscrito encontrado na linha:', rowIndex + 1);
                break;
            }
        }

        if (rowIndex === -1) {
            return res.status(404).json({
                error: 'Inscrição não encontrada',
                message: `Nenhuma inscrição encontrada com CPF ${cpf}`
            });
        }

        // Preparar atualização
        const parcelaKey = `parcela_${String(numeroParcela).padStart(2, '0')}_paga`;
        const dataPagaKey = `data_paga_${String(numeroParcela).padStart(2, '0')}`;

        const parcelaIndex = headers.indexOf(parcelaKey);
        const dataPagaIndex = headers.indexOf(dataPagaKey);

        if (parcelaIndex === -1) {
            return res.status(500).json({
                error: `Coluna ${parcelaKey} não encontrada na planilha`
            });
        }

        const updates = [];
        const dataPaga = new Date().toLocaleDateString('pt-BR');

        // Marcar parcela como paga
        const parcelaCol = indexToColumnLetter(parcelaIndex);
        updates.push({
            range: `Inscrições!${parcelaCol}${rowIndex + 1}`,
            values: [[1]]
        });

        // Atualizar data de pagamento
        if (dataPagaIndex !== -1) {
            const dataPagaCol = indexToColumnLetter(dataPagaIndex);
            updates.push({
                range: `Inscrições!${dataPagaCol}${rowIndex + 1}`,
                values: [[dataPaga]]
            });
        }

        // Executar atualizações
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            resource: {
                valueInputOption: 'RAW',
                data: updates
            }
        });

        console.log(`✅ [ADMIN] Parcela ${numeroParcela} marcada como paga para CPF ${cpf}`);

        return res.status(200).json({
            success: true,
            message: `Parcela ${numeroParcela} marcada como paga com sucesso!`,
            cpf: cpf,
            parcela: numeroParcela,
            dataPaga: dataPaga
        });

    } catch (error) {
        console.error('❌ [ADMIN] Erro ao dar baixa em parcela:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
}
