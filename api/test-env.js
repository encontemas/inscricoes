// Endpoint de teste para verificar variáveis de ambiente
export default async function handler(req, res) {
    const envCheck = {
        GOOGLE_SERVICE_ACCOUNT_JSON: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
        GOOGLE_SHEETS_SPREADSHEET_ID: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
        PAGBANK_PRIVATE_KEY: !!process.env.PAGBANK_PRIVATE_KEY,
        PAGBANK_TOKEN: !!process.env.PAGBANK_TOKEN,

        // Tentar parsear o JSON para verificar se está válido
        googleCredentialsValid: false,
        googleCredentialsError: null,
        spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || 'NOT_SET'
    };

    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        try {
            const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
            envCheck.googleCredentialsValid = true;
            envCheck.googleCredentialsType = parsed.type;
            envCheck.googleProjectId = parsed.project_id;
            envCheck.googleClientEmail = parsed.client_email;
        } catch (error) {
            envCheck.googleCredentialsError = error.message;
        }
    }

    return res.status(200).json(envCheck);
}
