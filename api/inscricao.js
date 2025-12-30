// API para processar inscrição na planilha
import { salvarInscricao } from '../lib/google-sheets.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const dados = req.body;

        // Validações obrigatórias
        if (!dados.nome_completo || !dados.email || !dados.telefone || !dados.cidade_pais) {
            return res.status(400).json({
                error: 'Campos obrigatórios faltando',
                message: 'Preencha: nome completo, email, telefone e cidade/país'
            });
        }

        if (!dados.maior_idade) {
            return res.status(400).json({
                error: 'Idade insuficiente',
                message: 'É necessário ser maior de 18 anos para participar do evento'
            });
        }

        if (!dados.aceite_termo_lgpd) {
            return res.status(400).json({
                error: 'Termo LGPD não aceito',
                message: 'É necessário aceitar o termo de consentimento LGPD'
            });
        }

        if (!dados.aceite_termo_desistencia) {
            return res.status(400).json({
                error: 'Termo de desistência não aceito',
                message: 'É necessário estar ciente das condições de desistência'
            });
        }

        if (!dados.numero_parcelas || dados.numero_parcelas < 1 || dados.numero_parcelas > 11) {
            return res.status(400).json({
                error: 'Número de parcelas inválido',
                message: 'Escolha entre 1 e 11 parcelas'
            });
        }

        console.log('📝 Salvando inscrição na planilha...');

        // Salvar inscrição na planilha
        await salvarInscricao(dados);

        console.log('✅ Inscrição salva com sucesso!');

        // Calcular valor da parcela para retornar
        const valorParcela = (450.00 / dados.numero_parcelas).toFixed(2);

        return res.status(200).json({
            success: true,
            message: 'Inscrição realizada com sucesso!',
            inscricao: {
                nome: dados.nome_completo,
                email: dados.email,
                numero_parcelas: dados.numero_parcelas,
                valor_parcela: `R$ ${valorParcela}`,
                valor_total: 'R$ 450,00'
            }
        });

    } catch (error) {
        console.error('❌ Erro ao processar inscrição:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
}
