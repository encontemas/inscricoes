// Sistema de logs persistente - salva no Google Sheets
import { google } from 'googleapis';

// Cache para evitar verificar sempre se aba existe
let abaLogsExiste = false;

/**
 * Garante que a aba "Logs" existe, criando se necessário
 */
async function garantirAbaLogs(sheets, spreadsheetId) {
    if (abaLogsExiste) return; // Já verificado anteriormente

    try {
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        const abaLogs = spreadsheet.data.sheets.find(sheet => sheet.properties.title === 'Logs');

        if (!abaLogs) {
            console.log('📋 Criando aba "Logs" na planilha...');

            // Criar aba
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: 'Logs',
                                gridProperties: {
                                    frozenRowCount: 1
                                }
                            }
                        }
                    }]
                }
            });

            // Adicionar cabeçalho
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Logs!A1:E1',
                valueInputOption: 'RAW',
                resource: {
                    values: [['Timestamp', 'Tipo', 'Nível', 'Mensagem', 'Dados JSON']]
                }
            });

            // Formatar cabeçalho (negrito + cor de fundo)
            const logsSheetId = (await sheets.spreadsheets.get({ spreadsheetId }))
                .data.sheets.find(s => s.properties.title === 'Logs').properties.sheetId;

            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests: [{
                        repeatCell: {
                            range: {
                                sheetId: logsSheetId,
                                startRowIndex: 0,
                                endRowIndex: 1
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.4, green: 0.5, blue: 0.9 },
                                    textFormat: {
                                        foregroundColor: { red: 1, green: 1, blue: 1 },
                                        fontSize: 11,
                                        bold: true
                                    }
                                }
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat)'
                        }
                    }]
                }
            });

            console.log('✅ Aba "Logs" criada com sucesso!');
        }

        abaLogsExiste = true;

    } catch (error) {
        console.error('❌ Erro ao criar aba Logs:', error.message);
    }
}

/**
 * Salva log no Google Sheets na aba "Logs"
 * @param {string} tipo - Tipo do log (webhook, pagamento, erro, etc)
 * @param {string} nivel - Nível (info, warning, error, success)
 * @param {string} mensagem - Mensagem descritiva
 * @param {object} dados - Dados adicionais (opcional)
 */
export async function salvarLog(tipo, nivel, mensagem, dados = null) {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        // Garantir que aba Logs existe
        await garantirAbaLogs(sheets, spreadsheetId);

        const timestamp = new Date().toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const dadosJson = dados ? JSON.stringify(dados) : '';

        const valores = [
            timestamp,
            tipo,
            nivel,
            mensagem,
            dadosJson
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Logs!A:E',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [valores]
            }
        });

        console.log(`📝 Log salvo: [${nivel}] ${tipo} - ${mensagem}`);
        return true;

    } catch (error) {
        // Não quebrar a aplicação se o log falhar
        console.error('❌ Erro ao salvar log no Sheets:', error.message);
        return false;
    }
}

/**
 * Salva log de webhook do PagBank
 */
export async function logWebhook(acao, dados) {
    const mensagem = `Webhook PagBank: ${acao}`;
    await salvarLog('webhook', 'info', mensagem, dados);
}

/**
 * Salva log de pagamento confirmado
 */
export async function logPagamento(cpf, parcela, valor, metodo) {
    const mensagem = `Pagamento confirmado: CPF ${cpf}, Parcela ${parcela}, R$ ${valor}`;
    await salvarLog('pagamento', 'success', mensagem, { cpf, parcela, valor, metodo });
}

/**
 * Salva log de erro
 */
export async function logErro(contexto, erro, dadosAdicionais = null) {
    const mensagem = `Erro em ${contexto}: ${erro.message}`;
    const dados = {
        erro: erro.message,
        stack: erro.stack,
        ...dadosAdicionais
    };
    await salvarLog('erro', 'error', mensagem, dados);
}

/**
 * Salva log de inscrição criada
 */
export async function logInscricao(idInscricao, nome, cpf) {
    const mensagem = `Nova inscrição: ${nome} (CPF: ${cpf})`;
    await salvarLog('inscricao', 'success', mensagem, { idInscricao, nome, cpf });
}
