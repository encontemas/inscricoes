# Configuração do PagBank para PRODUÇÃO

## ⚠️ IMPORTANTE
Este guia explica como configurar o sistema para usar o ambiente de **PRODUÇÃO** do PagBank, onde as transações são REAIS e o dinheiro é cobrado de verdade.

## Diferença entre Ambientes

### 🧪 SANDBOX (Testes)
- Transações **SEM valor monetário**
- Usa cartões de teste fictícios
- URL: `https://sandbox.api.pagseguro.com/orders`
- Ideal para desenvolvimento e testes

### 💰 PRODUÇÃO (Real)
- Transações **COM valor monetário real**
- Usa cartões reais e cobra dinheiro de verdade
- URL: `https://api.pagbank.com/orders`
- Usado para vendas reais aos clientes

## Como Configurar PRODUÇÃO no Vercel

### 1. Acessar o Painel do PagBank
1. Acesse: https://minhaconta.pagseguro.uol.com.br
2. Entre com suas credenciais
3. Vá em: **Vendas > Integrações > Credenciais de produção**

### 2. Obter as Credenciais de PRODUÇÃO
Você precisará de 3 valores:

#### a) Token de Produção
- No painel do PagBank, copie o **Token de Produção**
- Formato: `7A8BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxA1B2C3D4`

#### b) Chave Pública de Produção
- No mesmo painel, copie a **Chave Pública (Public Key) de Produção**
- Formato: `MIIBIjANBgkqhkiG9w0BAQEFA...` (chave longa)

#### c) Variável de Ambiente
- Defina: `production` (literalmente essa palavra)

### 3. Configurar no Vercel

1. Acesse: https://vercel.com/
2. Vá no projeto: **inscricoes-sigma**
3. Clique em: **Settings** → **Environment Variables**
4. Adicione/Atualize as seguintes variáveis:

| Nome da Variável | Valor | Descrição |
|-----------------|-------|-----------|
| `PAGBANK_ENV` | `production` | Define que vai usar ambiente de produção |
| `PAGBANK_TOKEN` | `SEU_TOKEN_DE_PRODUCAO` | Token obtido do PagBank (produção) |
| `PAGBANK_PUBLIC_KEY` | `SUA_CHAVE_PUBLICA_PRODUCAO` | Chave pública obtida do PagBank (produção) |

### 4. Fazer Redeploy
Após configurar as variáveis:
1. Vá em **Deployments**
2. Clique nos 3 pontinhos do último deployment
3. Clique em **Redeploy**
4. Aguarde o deploy terminar

## Como Fazer Testes em PRODUÇÃO

### ⚠️ ATENÇÃO: VOCÊ SERÁ COBRADO DE VERDADE!

Para testar se tudo está funcionando corretamente em produção:

1. **Acesse a página de testes**:
   ```
   https://inscricoes-sigma.vercel.app/teste-logs-cartao.html
   ```

2. **Configure o teste**:
   - Preencha seus dados reais (nome, CPF, email, telefone)
   - Configure o valor: **R$ 1,00** (valor mínimo para teste)
   - Use seu cartão de crédito REAL
   - Escolha 1x (à vista)

3. **Execute o teste**:
   - Clique em "Testar Fluxo Completo"
   - O sistema vai:
     - Criar uma inscrição real
     - Processar pagamento real com PagBank
     - Atualizar a planilha do Google Sheets
     - Mostrar todos os logs detalhados

4. **Verificar o resultado**:
   - ✅ Pagamento aprovado → Sistema funcionando!
   - ❌ Erro → Os logs vão mostrar exatamente onde está o problema
   - Verifique também na planilha do Google Sheets

## Como Voltar para SANDBOX (se necessário)

Se precisar voltar para o ambiente de testes:

1. No Vercel, altere as variáveis de ambiente:
   - `PAGBANK_ENV` = `sandbox` (ou remova a variável)
   - `PAGBANK_TOKEN` = Token de sandbox
   - `PAGBANK_PUBLIC_KEY` = Chave pública de sandbox

2. Faça redeploy

## Cartões de Teste do PagBank (APENAS SANDBOX)

⚠️ **NÃO use estes cartões em PRODUÇÃO!**

Estes cartões funcionam APENAS no ambiente SANDBOX:

### Cartão que APROVA o pagamento:
- **Número**: 4539 6206 5992 2097
- **Titular**: Jose da Silva
- **Validade**: Qualquer data futura (ex: 12/30)
- **CVV**: 123

### Cartão que NEGA o pagamento:
- **Número**: 4929 2900 1234 0766
- **Titular**: Jose da Silva
- **Validade**: Qualquer data futura (ex: 12/30)
- **CVV**: 123

## Perguntas Frequentes

### 1. Posso usar cartões de teste em produção?
**NÃO!** Cartões de teste só funcionam no ambiente SANDBOX. Em produção, você deve usar cartões reais.

### 2. Como sei se estou em produção ou sandbox?
Veja os logs na página de testes. Ela mostra: `📍 Ambiente PagBank: PRODUCTION` ou `SANDBOX`

### 3. Por que tive erro "Unexpected end of JSON input"?
Provavelmente porque estava usando token/chave de SANDBOX mas tentando acessar em PRODUÇÃO (ou vice-versa). Certifique-se que as credenciais correspondem ao ambiente configurado.

### 4. Quanto tempo demora para aprovar em produção?
Normalmente é instantâneo (1-3 segundos). Se demorar mais, verifique os logs.

### 5. Posso cancelar o teste de R$ 1,00 depois?
Sim! Você pode solicitar estorno/cancelamento diretamente no painel do PagBank.

## Referências Oficiais

- [Documentação PagBank - Testar Integração](https://developer.pagbank.com.br/docs/testar-integracao)
- [Cartões de Teste](https://developer.pagbank.com.br/docs/cartoes-de-teste)
- [Criar Pedido com Cartão](https://developer.pagbank.com.br/reference/criar-pagar-pedido-com-cartao)
- [APIs PagBank](https://developer.pagbank.com.br/docs/apis-pagbank)

## Suporte

Se tiver problemas:
1. Verifique os logs detalhados na página de teste
2. Confirme que as variáveis de ambiente estão corretas
3. Verifique se a conta foi aprovada para produção no PagBank
4. Entre em contato com o suporte do PagBank: https://pagseguro.uol.com.br/atendimento

---

📝 **Última atualização**: 2026-01-05
