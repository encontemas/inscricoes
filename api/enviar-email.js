// Módulo para envio de emails usando Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envia email de confirmação de pagamento
 */
export async function enviarConfirmacaoPagamento(dadosEmail) {
    try {
        const { email, nome, valor, numeroParcela, totalParcelas } = dadosEmail;

        const data = await resend.emails.send({
            from: 'Encontemas da Diversidade <noreply@inscricoes-sigma.vercel.app>',
            to: [email],
            subject: `✅ Pagamento confirmado - Parcela ${numeroParcela}/${totalParcelas}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 30px;
                            border-radius: 10px 10px 0 0;
                            text-align: center;
                        }
                        .content {
                            background: #f9f9f9;
                            padding: 30px;
                            border-radius: 0 0 10px 10px;
                        }
                        .badge {
                            display: inline-block;
                            background: #10b981;
                            color: white;
                            padding: 5px 15px;
                            border-radius: 20px;
                            font-size: 0.9em;
                            font-weight: bold;
                            margin: 10px 0;
                        }
                        .info-box {
                            background: white;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                            border-left: 4px solid #667eea;
                        }
                        .footer {
                            text-align: center;
                            color: #666;
                            font-size: 0.9em;
                            margin-top: 20px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                        }
                        .btn {
                            display: inline-block;
                            background: #667eea;
                            color: white;
                            padding: 12px 30px;
                            border-radius: 8px;
                            text-decoration: none;
                            margin: 15px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>✅ Pagamento Confirmado!</h1>
                        <div class="badge">Parcela ${numeroParcela}/${totalParcelas}</div>
                    </div>
                    <div class="content">
                        <p>Olá, <strong>${nome}</strong>!</p>

                        <p>Recebemos a confirmação do seu pagamento. Obrigado por escolher o Encontemas da Diversidade!</p>

                        <div class="info-box">
                            <p><strong>Valor pago:</strong> ${valor}</p>
                            <p><strong>Parcela:</strong> ${numeroParcela} de ${totalParcelas}</p>
                            <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</p>
                        </div>

                        ${numeroParcela < totalParcelas ? `
                            <p>⏰ <strong>Próxima parcela:</strong> Acesse sua área do inscrito para gerar o PIX da próxima parcela.</p>
                        ` : `
                            <p>🎉 <strong>Parabéns!</strong> Você completou o pagamento de todas as parcelas!</p>
                        `}

                        <center>
                            <a href="https://inscricoes-sigma.vercel.app/login-inscrito.html" class="btn">
                                Acessar Área do Inscrito
                            </a>
                        </center>

                        <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
                            <strong>Dúvidas?</strong> Entre em contato conosco respondendo este email.
                        </p>
                    </div>
                    <div class="footer">
                        <p>3º Encontemas da Diversidade<br>
                        São Paulo - SP</p>
                    </div>
                </body>
                </html>
            `
        });

        console.log('✅ Email enviado:', data);
        return { success: true, data };

    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Envia email de lembrete de parcela vencendo
 */
export async function enviarLembreteParcela(dadosEmail) {
    try {
        const { email, nome, valor, numeroParcela, totalParcelas, dataVencimento } = dadosEmail;

        const data = await resend.emails.send({
            from: 'Encontemas da Diversidade <noreply@inscricoes-sigma.vercel.app>',
            to: [email],
            subject: `⏰ Lembrete - Parcela ${numeroParcela}/${totalParcelas} vence em breve`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                            color: white;
                            padding: 30px;
                            border-radius: 10px 10px 0 0;
                            text-align: center;
                        }
                        .content {
                            background: #f9f9f9;
                            padding: 30px;
                            border-radius: 0 0 10px 10px;
                        }
                        .info-box {
                            background: white;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                            border-left: 4px solid #f59e0b;
                        }
                        .btn {
                            display: inline-block;
                            background: #667eea;
                            color: white;
                            padding: 12px 30px;
                            border-radius: 8px;
                            text-decoration: none;
                            margin: 15px 0;
                        }
                        .footer {
                            text-align: center;
                            color: #666;
                            font-size: 0.9em;
                            margin-top: 20px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>⏰ Lembrete de Pagamento</h1>
                    </div>
                    <div class="content">
                        <p>Olá, <strong>${nome}</strong>!</p>

                        <p>Este é um lembrete amigável de que uma parcela do seu pagamento está próxima do vencimento.</p>

                        <div class="info-box">
                            <p><strong>Parcela:</strong> ${numeroParcela} de ${totalParcelas}</p>
                            <p><strong>Valor:</strong> ${valor}</p>
                            <p><strong>Vencimento:</strong> ${new Date(dataVencimento).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                            })}</p>
                        </div>

                        <p>Para evitar atrasos, acesse sua área do inscrito e gere o PIX para pagamento:</p>

                        <center>
                            <a href="https://inscricoes-sigma.vercel.app/login-inscrito.html" class="btn">
                                Gerar PIX para Pagamento
                            </a>
                        </center>

                        <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
                            <strong>Dúvidas?</strong> Entre em contato conosco respondendo este email.
                        </p>
                    </div>
                    <div class="footer">
                        <p>3º Encontemas da Diversidade<br>
                        São Paulo - SP</p>
                    </div>
                </body>
                </html>
            `
        });

        console.log('✅ Email de lembrete enviado:', data);
        return { success: true, data };

    } catch (error) {
        console.error('❌ Erro ao enviar email de lembrete:', error);
        return { success: false, error: error.message };
    }
}

// Exportar como handler API se necessário
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { tipo, dados } = req.body;

    try {
        let result;

        if (tipo === 'confirmacao') {
            result = await enviarConfirmacaoPagamento(dados);
        } else if (tipo === 'lembrete') {
            result = await enviarLembreteParcela(dados);
        } else {
            return res.status(400).json({ error: 'Tipo de email inválido' });
        }

        if (result.success) {
            return res.status(200).json({ success: true, message: 'Email enviado com sucesso' });
        } else {
            return res.status(500).json({ success: false, error: result.error });
        }

    } catch (error) {
        console.error('❌ Erro:', error);
        return res.status(500).json({ error: error.message });
    }
}
