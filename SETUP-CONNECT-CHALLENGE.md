# 🔐 Setup PagBank Connect Challenge

Este guia explica como configurar o sistema de autenticação Connect Challenge do PagBank para permitir a criação de cobranças PIX.

---

## ⚠️ O que é Connect Challenge?

É um sistema de autenticação em 2 fatores que o PagBank exige para APIs sensíveis (como PIX). Funciona com criptografia RSA de chaves públicas/privadas.

**Por que precisamos disso?**
O erro `ACCESS_DENIED - whitelist access required` significa que o PagBank exige esta autenticação adicional para criar cobranças PIX.

---

## 📋 Pré-requisitos

1. ✅ Conta PagBank com chave PIX cadastrada
2. ✅ Acesso ao painel do Vercel
3. ✅ Node.js instalado localmente (para gerar as chaves)

---

## 🚀 Passo a Passo

### **Passo 1: Gerar as Chaves RSA**

No seu computador local, execute:

```bash
node scripts/setup-keys.js
```

Este script vai:
- Gerar um par de chaves RSA (pública + privada)
- Salvar localmente em `./keys/` (pasta protegida pelo .gitignore)
- Mostrar as 3 variáveis de ambiente que você precisa copiar

**IMPORTANTE**: Copie as 3 variáveis que aparecem no terminal:
- `PAGBANK_PUBLIC_KEY`
- `PAGBANK_PRIVATE_KEY`
- `PAGBANK_KEY_CREATED_AT`

---

### **Passo 2: Adicionar Variáveis no Vercel**

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto: `inscricoes-sigma`
3. Vá em: **Settings → Environment Variables**
4. Adicione as **3 variáveis** (copie exatamente como o script mostrou):

```
Nome: PAGBANK_PUBLIC_KEY
Valor: -----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----

Nome: PAGBANK_PRIVATE_KEY
Valor: -----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
-----END PRIVATE KEY-----

Nome: PAGBANK_KEY_CREATED_AT
Valor: 1735678901234
```

5. Marque as 3 variáveis para **todos os ambientes** (Production, Preview, Development)
6. Clique em **Save**

---

### **Passo 3: Cadastrar URL no PagBank (Gustavo)**

**Esta etapa precisa ser feita por quem tem acesso à conta PagBank (Gustavo).**

Peça para o Gustavo fazer:

1. Acessar: https://minhaconta.pagseguro.uol.com.br/
2. Fazer login na conta PagBank
3. Menu: **Vendas → Integrações**
4. Procurar por "Chave Pública" ou "Connect Challenge"
5. Cadastrar esta URL:
   ```
   https://inscricoes-sigma.vercel.app/api/public-key
   ```
6. Salvar

**Resultado**: Instantâneo! A URL fica cadastrada imediatamente.

---

### **Passo 4: Deploy**

Faça o deploy para aplicar as mudanças:

```bash
vercel --prod
```

---

### **Passo 5: Testar**

Acesse:
```
https://inscricoes-sigma.vercel.app/teste-pix.html
```

Preencha o formulário e clique em "Gerar PIX de R$ 1,00".

**O que vai acontecer:**
1. Sistema obtém token do PagBank (30 segundos de validade)
2. Descriptografa o challenge usando a chave privada
3. Usa ambos para criar a cobrança PIX
4. Retorna QR Code válido

---

## 🔍 Como Funciona (Técnico)

### Fluxo de Autenticação:

```
1. Cliente solicita PIX
   ↓
2. API obtém token + challenge criptografado do PagBank
   POST /oauth2/token
   ↓
3. API descriptografa challenge com chave privada
   (usa RSA-OAEP com SHA-256)
   ↓
4. API cria PIX enviando:
   - Authorization: Bearer {token}
   - X-PagBank-Challenge: {challenge descriptografado}
   ↓
5. PagBank valida e retorna QR Code
```

### Arquivos Criados:

```
lib/
  ├── crypto-utils.js      # Funções de criptografia RSA
  └── pagbank-auth.js      # Gerenciador de autenticação
api/
  ├── public-key.js        # Endpoint que serve a chave pública
  └── criar-pix.js         # Atualizado para usar Connect Challenge
scripts/
  └── setup-keys.js        # Script para gerar chaves
keys/                      # Chaves salvas localmente (gitignored)
  ├── public-key.pem
  ├── private-key.pem
  └── created-at.txt
```

---

## 🔒 Segurança

### ✅ Boas Práticas Implementadas:

1. **Chave privada nunca no código**:
   - Armazenada apenas em variáveis de ambiente do Vercel
   - Pasta `keys/` protegida pelo `.gitignore`

2. **Chave pública acessível**:
   - Disponível via endpoint público (necessário para o PagBank)
   - Não representa risco de segurança

3. **Token de curta duração**:
   - Expira em 30 segundos
   - Renovado automaticamente a cada requisição

4. **Criptografia forte**:
   - RSA 2048 bits
   - Algoritmo OAEP com SHA-256

---

## 🐛 Troubleshooting

### Erro: "PAGBANK_PRIVATE_KEY não configurada"

**Solução**: Você esqueceu de adicionar as variáveis no Vercel.
1. Rode `node scripts/setup-keys.js` novamente
2. Copie as variáveis e adicione no Vercel
3. Faça deploy: `vercel --prod`

---

### Erro: "Invalid credential" ou "UNAUTHORIZED"

**Possíveis causas**:
1. **URL não cadastrada no PagBank**: Peça ao Gustavo para cadastrar a URL
2. **Chaves incorretas**: Gere novas chaves e atualize no Vercel
3. **Token expirado**: Sistema renova automaticamente, não deve acontecer

---

### Erro: "Falha ao descriptografar challenge"

**Causas**:
1. Chave privada corrompida (copiar/colar errado)
2. Chave privada diferente da pública cadastrada

**Solução**:
1. Gere novo par de chaves: `node scripts/setup-keys.js`
2. Atualize TODAS as 3 variáveis no Vercel
3. Peça ao Gustavo para atualizar a URL no PagBank (se necessário)
4. Deploy: `vercel --prod`

---

### QR Code ainda dá inválido

**Checklist**:
- [ ] Chave PIX cadastrada na conta PagBank? (aguardar 30-60 min após cadastro)
- [ ] URL cadastrada no PagBank?
- [ ] Variáveis corretas no Vercel?
- [ ] Deploy feito após configurar variáveis?
- [ ] Testando em produção (não localhost)?

---

## 📞 Contato para Dúvidas

Se der erro, compartilhe:
1. Print do erro no navegador (F12 → Console)
2. Logs do Vercel (Functions → criar-pix → Logs)
3. Qual passo do setup você está

---

## 🎯 Checklist Completo

- [ ] Executei `node scripts/setup-keys.js`
- [ ] Copiei as 3 variáveis de ambiente
- [ ] Adicionei as variáveis no Vercel
- [ ] Pedi ao Gustavo para cadastrar a URL no PagBank
- [ ] Fiz deploy: `vercel --prod`
- [ ] Testei em: https://inscricoes-sigma.vercel.app/teste-pix.html
- [ ] QR Code gerado com sucesso!

---

**Status**: ✅ Pronto para uso em produção!
