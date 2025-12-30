# 🧪 Teste PIX - Protótipo R$ 1,00

## 📋 O que foi criado:

1. **API Serverless** (`/api/criar-pix.js`)
   - Cria cobrança PIX via PagBank
   - Ambiente Sandbox (teste)
   - Valor: R$ 1,00

2. **Página de Teste** (`teste-pix.html`)
   - Formulário simples
   - Gera QR Code PIX
   - Mostra código copia-e-cola

3. **Variáveis de Ambiente** (`.env.local`)
   - Token PagBank Sandbox
   - **NÃO será commitado** (está no .gitignore)

---

## 🚀 Como Testar Localmente:

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Fazer Login no Vercel
```bash
vercel login
```

### 3. Rodar Local
```bash
vercel dev
```

### 4. Acessar
Abra no navegador:
```
http://localhost:3000/teste-pix.html
```

---

## 🌐 Como Fazer Deploy no Vercel:

### 1. Deploy
```bash
vercel --prod
```

### 2. Configurar Variáveis de Ambiente no Vercel

No dashboard do Vercel:
- Settings → Environment Variables
- Adicione:
  - `PAGBANK_TOKEN` = `seu_token_aqui`

### 3. Acessar
```
https://seu-projeto.vercel.app/teste-pix.html
```

---

## 🧪 Dados de Teste (já preenchidos):

- **Nome:** João Silva
- **Email:** teste@email.com
- **Telefone:** 11999999999
- **CPF:** 12345678909

Clique em "Gerar PIX de R$ 1,00" e aguarde!

---

## ✅ O que o teste vai fazer:

1. Frontend envia dados para `/api/criar-pix`
2. API chama PagBank Sandbox
3. PagBank retorna QR Code PIX
4. Página exibe:
   - QR Code (imagem)
   - Código copia-e-cola
   - ID da transação
   - Status

---

## 📱 Como Pagar o PIX de Teste:

### ⚠️ IMPORTANTE: Limitações do Sandbox

**O QR Code gerado no ambiente Sandbox é SEMPRE INVÁLIDO para apps bancários.**

Isso é esperado e normal! O ambiente Sandbox do PagBank não permite pagamentos reais via PIX. O QR Code serve apenas para:
- ✅ Testar a integração da API
- ✅ Ver se o QR Code é gerado
- ✅ Ver se o webhook está funcionando
- ❌ **NÃO permite** pagamento real via app bancário

### 🔄 Próximos Passos para Ambiente REAL:

**ANTES de mudar para produção, você precisa:**

1. **Cadastrar Chave PIX Aleatória no PagBank**
   - Acesse sua conta PagBank
   - Vá em: Pix → Minhas Chaves → Criar Nova Chave
   - Escolha: **Chave Aleatória**
   - **AGUARDE 30-60 minutos** após cadastrar
   - Sem chave PIX = QR Code inválido mesmo em produção!

2. **Obter Token de PRODUÇÃO**
   - Acesse: https://minhaconta.pagseguro.uol.com.br/
   - Gere novo token de produção (diferente do sandbox)

3. **Atualizar Variáveis de Ambiente**
   ```
   PAGBANK_TOKEN=seu_token_producao_aqui
   ```

4. **Mudar Endpoint na API** (api/criar-pix.js)
   ```javascript
   // Trocar de:
   const PAGBANK_API = 'https://sandbox.api.pagseguro.com/orders';
   // Para:
   const PAGBANK_API = 'https://api.pagseguro.com/orders';
   ```

5. **Fazer Deploy e Testar com R$ 1,00 REAL**

---

## 🔍 Como Verificar se Funcionou:

### Console do Navegador (F12):
```javascript
// Você verá logs como:
📤 Enviando dados: {...}
📥 Resposta: {success: true, pix: {...}}
```

### Logs da API (Vercel Dashboard):
- Acesse: Functions → Logs
- Veja requisições em tempo real

### 🔔 Webhook de Confirmação:

**Criado:** `/api/webhook-pagbank.js`

Este endpoint recebe notificações automáticas do PagBank quando:
- ✅ Pagamento é confirmado
- ❌ Pagamento é cancelado
- ⏰ QR Code expira

**Como verificar:**
1. Após pagamento, PagBank envia notificação para o webhook
2. Verifique logs no Vercel: Functions → webhook-pagbank → Logs
3. Você verá: `🔔 Notificação PagBank recebida` e `✅ Pagamento confirmado!`

**TODO (próxima etapa):**
- [ ] Integrar webhook com Google Sheets
- [ ] Enviar e-mail de confirmação
- [ ] Atualizar status da parcela

---

## 🐛 Troubleshooting:

### Erro: "Método não permitido"
- A API só aceita POST
- Certifique-se de acessar via formulário

### Erro: "Token inválido"
- Verifique se configurou `PAGBANK_TOKEN` no Vercel
- Token deve começar com caracteres alfanuméricos

### Erro: "CPF inválido"
- Use apenas números (sem pontos ou traços)
- Deve ter 11 dígitos

### QR Code não aparece
- Verifique resposta no console (F12)
- PagBank pode estar retornando erro

---

## 📊 Próximos Passos (após testar):

1. ✅ Testar pagamento R$ 1,00 sandbox
2. ✅ Ver se QR Code aparece
3. ✅ Ver logs da API
4. Integrar com Google Sheets
5. Adicionar ao formulário principal
6. Trocar para produção

---

## 🔒 Segurança:

- ✅ Token nunca exposto no frontend
- ✅ API serverless isolada
- ✅ Validação de dados
- ✅ `.env.local` no .gitignore

---

## 📞 Contato para Dúvidas:

Se der erro, me mande:
1. Print do erro no navegador (F12 → Console)
2. Print da resposta da API
3. Descrição do que aconteceu

---

**Status:** ✅ Pronto para testar!
