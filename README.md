# 3º Encontemas da Diversidade 2026

Sistema completo de inscrições e gestão de pagamentos para o evento **3º Encontemas da Diversidade**.

## 🎯 Sobre o Evento

- **Tema:** "Nós Realmente Nos Recuperamos"
- **Data:** 27, 28 e 29 de Novembro de 2026
- **Local:** Terra do Saber, Cajamar - SP
- **Vagas:** 150 participantes
- **Valor:** R$ 450,00 (parcelável em até 11x)

---

## 📋 Índice

1. [Funcionalidades](#-funcionalidades)
2. [Tecnologias](#-tecnologias)
3. [Estrutura do Projeto](#-estrutura-do-projeto)
4. [Banco de Dados](#-banco-de-dados)
5. [APIs e Integrações](#-apis-e-integrações)
6. [Fluxo de Pagamento](#-fluxo-de-pagamento)
7. [Configuração](#-configuração)
8. [Deploy](#-deploy)
9. [Contatos](#-contatos)

---

## ✨ Funcionalidades

### Para Participantes
- ✅ **Inscrição Online** com formulário completo
- ✅ **Parcelamento** em até 11x via PIX
- ✅ **Área do Inscrito** para acompanhar parcelas
- ✅ **Geração de PIX** automática para cada parcela
- ✅ **Confirmação automática** de pagamentos via webhook
- ✅ **Galeria de fotos** do local do evento
- ✅ **Mapa interativo** da localização

### Para Administradores
- ✅ **Planilha Google Sheets** com todas as inscrições
- ✅ **Controle de pagamentos** automático
- ✅ **Logs de transações** PIX
- ✅ **Notificações por email** automáticas

---

## 🚀 Tecnologias

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Design responsivo com gradientes e animações
- **JavaScript (Vanilla)** - Interatividade sem frameworks

### Backend (Serverless)
- **Vercel Serverless Functions** - APIs em Node.js
- **Google Sheets API** - Banco de dados
- **PagBank API** - Pagamentos PIX
- **Resend API** - Envio de emails

### Integrações
- **PagBank Sandbox/Production** - Geração de PIX e webhooks
- **Google Service Account** - Autenticação com Sheets
- **Resend** - Emails transacionais

---

## 📁 Estrutura do Projeto

```
inscricao/
├── index.html                    # Landing page principal
├── inscricao.html               # Formulário de inscrição
├── area-inscrito.html           # Área do inscrito (parcelas)
├── login-inscrito.html          # Login por CPF
├── pagamento.html               # Página de pagamento (legado)
├── teste-pix.html               # Página de teste PIX
├── teste-logs-pagbank.html      # Captura de logs para PagBank
├── style.css                    # Estilos principais
├── script.js                    # JavaScript principal
│
├── api/                         # Serverless Functions
│   ├── inscricao.js            # Salvar inscrição na planilha
│   ├── inscrito.js             # Buscar dados do inscrito
│   ├── criar-pix.js            # Criar cobrança PIX (teste)
│   ├── gerar-pix.js            # Gerar PIX primeira parcela
│   ├── webhook-pagbank.js      # Receber notificações PagBank
│   ├── enviar-email.js         # Enviar emails transacionais
│   └── pk-7f3e9d2a1b.js        # Endpoint chave pública RSA
│
├── lib/
│   └── pagbank-auth.js         # Autenticação PagBank Connect
│
├── scripts/
│   └── setup-keys.js           # Gerar chaves RSA
│
├── fotos_terra_do_saber/       # Galeria local (8 fotos)
└── README.md                    # Este arquivo
```

---

## 🗄️ Banco de Dados

### Google Sheets - Aba "Inscrições"

A planilha principal contém todos os dados dos inscritos e controle de pagamentos.

#### Campos de Identificação
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id_inscricao` | String | ID único da inscrição |
| `data_inscricao` | Data | Data/hora da inscrição |
| `data_atualizacao` | Data | Última atualização |

#### Dados Pessoais
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `nome_completo` | String | Nome completo do inscrito |
| `nome_social` | String | Nome social (opcional) |
| `cpf` | String | CPF (11 dígitos) |
| `maior_idade` | Boolean | Confirmação de maioridade |
| `email` | String | Email para contato |
| `telefone` | String | Telefone com DDD |
| `cidade_pais` | String | Cidade e país |

#### Dados do Evento
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `grupo_escolha` | String | Grupo de origem |
| `grupo_pessoas` | String | Pessoas do grupo |
| `csa` | String | CSA de origem |
| `interesse_hospedagem` | String | Sim/Não |
| `interesse_transfer` | String | Sim/Não |

#### Acessibilidade
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `possui_deficiencia` | String | Sim/Não |
| `descricao_necessidades` | Text | Detalhes de acessibilidade |

#### Termos e Observações
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `aceite_termo_lgpd` | Boolean | Aceite LGPD |
| `aceite_termo_desistencia` | Boolean | Aceite termo desistência |
| `observacoes` | Text | Observações gerais |

#### Dados de Pagamento
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `valor_total` | Number | R$ 450,00 |
| `numero_parcelas` | Number | 1 a 11 |
| `valor_parcela` | Number | Valor dividido |
| `dia_vencimento` | String | Dia escolhido (15 padrão) |
| `forma_pagamento` | String | "PIX" |

#### Status da Inscrição
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `inscricao_confirmada` | Boolean | Confirmação final |
| `data_confirmacao` | Data | Data da confirmação |

#### Controle de Parcelas (1 a 11)
Para cada parcela de 01 a 11:

| Campo | Tipo | Descrição | Valores |
|-------|------|-----------|---------|
| `parcela_01_paga` | Number | Status do pagamento | `0` = Pendente, `1` = Pago |
| `data_pagamento_01` | String | Data do pagamento | Formato: dd/mm/aaaa |
| `data_vencimento_01` | String | Data de vencimento | Formato: dd/mm/aaaa |

**Padrão:** Campos repetidos de `parcela_01_paga` até `parcela_11_paga`

#### Resumo Financeiro
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `total_parcelas_pagas` | Number | Quantidade de parcelas pagas |
| `valor_total_pago` | Number | Soma dos valores pagos |
| `saldo_devedor` | Number | Valor ainda pendente |
| `percentual_pago` | Number | % do total pago |

---

### Google Sheets - Aba "Pagamentos"

Registro de todas as transações PIX confirmadas pelo PagBank.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `Data/Hora` | DateTime | Timestamp do pagamento |
| `Reference ID` | String | ID de referência da transação |
| `Order ID` | String | ID do pedido PagBank |
| `Charge ID` | String | ID da cobrança |
| `Email` | String | Email do pagador |
| `Valor (centavos)` | Number | Valor em centavos |
| `Valor (R$)` | String | Valor formatado |
| `Status` | String | PAID, CANCELED, etc. |

---

## 🔌 APIs e Integrações

### 1. API de Inscrição
**Endpoint:** `/api/inscricao`
**Método:** POST
**Descrição:** Salva nova inscrição na planilha

**Payload:**
```json
{
  "nome_completo": "João Silva",
  "cpf": "12345678900",
  "email": "joao@email.com",
  "telefone": "(11) 98765-4321",
  "numero_parcelas": 11,
  // ... outros campos
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Inscrição realizada com sucesso!",
  "id_inscricao": "INS_1234567890"
}
```

---

### 2. API de Consulta de Inscrito
**Endpoint:** `/api/inscrito`
**Método:** POST
**Descrição:** Busca dados do inscrito por CPF

**Payload:**
```json
{
  "cpf": "12345678900"
}
```

**Resposta:**
```json
{
  "nome_completo": "João Silva",
  "email": "joao@email.com",
  "cpf": "12345678900",
  "numero_parcelas": 11,
  "valor_parcela": 40.91,
  "valor_total": 450.00,
  "parcela_01_paga": 1,
  "data_pagamento_01": "03/01/2026",
  "parcela_02_paga": 0,
  // ... todos os campos da planilha
}
```

---

### 3. API de Geração de PIX
**Endpoint:** `/api/gerar-pix`
**Método:** POST
**Descrição:** Gera PIX da primeira parcela via PagBank

**Payload:**
```json
{
  "email": "joao@email.com",
  "nome_completo": "João Silva",
  "telefone": "(11) 98765-4321",
  "cpf": "12345678900",
  "numero_parcelas": 11
}
```

**Resposta:**
```json
{
  "success": true,
  "pix": {
    "id": "ORDE_12345",
    "reference_id": "inscricao_1234567890",
    "qr_code_texto": "00020126580014br.gov.bcb.pix...",
    "qr_code_imagem": "https://...",
    "valor": "R$ 40,91",
    "expiracao": "2026-01-03T14:30:00Z"
  }
}
```

---

### 4. Webhook PagBank
**Endpoint:** `/api/webhook-pagbank`
**Método:** POST
**Descrição:** Recebe notificações de pagamento do PagBank

**Ações Automáticas:**
1. ✅ Registra pagamento na aba "Pagamentos"
2. ✅ Atualiza `parcela_XX_paga = 1` na aba "Inscrições"
3. ✅ Atualiza `data_pagamento_XX` com a data
4. ✅ Envia email de confirmação ao inscrito

**Payload (PagBank):**
```json
{
  "id": "ORDE_12345",
  "reference_id": "inscricao_1234567890",
  "charges": [{
    "id": "CHAR_12345",
    "status": "PAID",
    "amount": { "value": 4091 },
    "paid_at": "2026-01-03T12:30:00Z"
  }],
  "customer": {
    "email": "joao@email.com"
  }
}
```

---

### 5. API de Email
**Endpoint:** `/api/enviar-email`
**Método:** POST
**Descrição:** Envia emails transacionais via Resend

**Tipos de Email:**
- Confirmação de inscrição
- Confirmação de pagamento
- Lembrete de parcela

---

## 💳 Fluxo de Pagamento

### Passo a Passo

```mermaid
graph TD
    A[Usuário preenche inscrição] --> B[Escolhe número de parcelas]
    B --> C[Salva na planilha Google Sheets]
    C --> D[Redireciona para Área do Inscrito]
    D --> E[Usuário clica em 'Gerar PIX']
    E --> F[API chama PagBank Sandbox/Production]
    F --> G[PagBank retorna QR Code PIX]
    G --> H[Usuário paga pelo PIX]
    H --> I[PagBank envia webhook]
    I --> J[Sistema atualiza parcela_XX_paga = 1]
    J --> K[Sistema atualiza data_pagamento_XX]
    K --> L[Sistema envia email de confirmação]
    L --> M[Parcela exibida como PAGA]
```

### Estados de Parcela

| Status | Descrição | Cor | Badge |
|--------|-----------|-----|-------|
| **PENDENTE** | Parcela não paga dentro do prazo | Amarelo | 🟡 PENDENTE |
| **PAGO** | Parcela confirmada pelo PagBank | Verde | 🟢 PAGO |
| **VENCIDO** | Parcela não paga após vencimento | Vermelho | 🔴 VENCIDO |

### Lógica de Status

```javascript
// Verifica se está paga
const isPaga = parcela_XX_paga === 1 ||
               parcela_XX_paga === '1' ||
               parcela_XX_paga === true;

// Determina status
if (isPaga) {
    status = 'PAGO';
} else if (data_vencimento < hoje) {
    status = 'VENCIDO';
} else {
    status = 'PENDENTE';
}
```

---

## ⚙️ Configuração

### Variáveis de Ambiente (Vercel)

```env
# Google Sheets
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account"...}
GOOGLE_SHEETS_SPREADSHEET_ID=1abc123...
GOOGLE_SHEET_ID=1abc123...

# PagBank
PAGBANK_TOKEN=seu_token_aqui
PAGBANK_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
PAGBANK_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
PAGBANK_KEY_CREATED_AT=2025-01-02T12:00:00Z

# Resend (Email)
RESEND_API_KEY=re_123456789
```

### Como Configurar

1. **Google Sheets:**
   - Criar Service Account no Google Cloud Console
   - Baixar JSON de credenciais
   - Compartilhar planilha com email da Service Account

2. **PagBank:**
   - Criar conta no PagBank
   - Gerar Token de autenticação
   - Executar `node scripts/setup-keys.js` para gerar chaves RSA
   - Cadastrar URL do webhook no PagBank

3. **Resend:**
   - Criar conta em resend.com
   - Gerar API Key
   - Verificar domínio de email

---

## 🚀 Deploy

### Vercel (Recomendado)

1. **Fazer push no GitHub:**
```bash
git add .
git commit -m "Update"
git push
```

2. **Deploy automático** é acionado automaticamente

3. **Ou deploy manual:**
```bash
vercel --prod
```

### Configuração do Webhook PagBank

Cadastrar no PagBank:
```
https://seu-dominio.vercel.app/api/webhook-pagbank
```

---

## 📊 Logs e Debugging

### Página de Logs para PagBank

Acesse: `https://seu-dominio.vercel.app/teste-logs-pagbank.html`

Esta página captura automaticamente:
- ✅ REQUEST completo (payload enviado ao PagBank)
- ✅ RESPONSE completo (resposta do PagBank)
- ✅ Formato copiável para enviar ao suporte

**Uso:**
1. Preencher formulário com dados reais
2. Clicar em "Gerar PIX e Capturar Logs"
3. Copiar logs completos
4. Enviar ao time de integração PagBank

---

## 🎨 Recursos Visuais

### Galeria de Fotos

**Local:**
- 8 fotos locais em `/fotos_terra_do_saber/`
- 17 fotos externas via CDN (https://acampamentoterradosaber.com.br)

**Funcionalidades:**
- Modal de visualização ampliada
- Títulos personalizados em cada foto
- Vídeo do YouTube integrado
- Responsivo para mobile

### Hero Section

**Background:**
- Imagem: "Área Externa" (URL externa)
- Overlay com gradiente roxo
- Cartaz: `ultimo_cartaz.jpg`

---

## 🔒 Segurança

### LGPD
- ✅ Termo de consentimento obrigatório
- ✅ Dados armazenados apenas com autorização
- ✅ Email de confirmação com link de política

### Autenticação
- ✅ Login por CPF (área do inscrito)
- ✅ Dados armazenados em localStorage
- ✅ Validação server-side em todas APIs

### PagBank
- ✅ Ambiente Sandbox para testes
- ✅ Connect Challenge com chaves RSA
- ✅ Webhooks com validação de origem

---

## 📱 Contatos GT

- **Agatha M.:** (13) 99642-1985
- **Gustavo N.:** (11) 95970-0094

---

## 📄 Licença

Este projeto é de código proprietário do evento **3º Encontemas da Diversidade**.

---

## 🤝 Contribuindo

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adicionar nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

---

## 🐛 Problemas Conhecidos

### ✅ Resolvidos
- ✅ Parcelas pagas não apareciam na área do inscrito → **Corrigido**
- ✅ Webhook não atualizava status na planilha → **Corrigido**
- ✅ Verificação de `parcela_XX_paga` não aceitava múltiplos formatos → **Corrigido**

### 🔄 Em Desenvolvimento
- Identificação automática de qual parcela foi paga (atualmente marca sempre parcela 01)
- Dashboard administrativo completo
- Exportação de relatórios

---

## 📚 Documentação Adicional

### Para Desenvolvedores
- [API Reference](docs/API.md) (a criar)
- [Guia de Deploy](docs/DEPLOY.md) (a criar)
- [Troubleshooting](docs/TROUBLESHOOTING.md) (a criar)

### Para Usuários
- [FAQ](docs/FAQ.md) (a criar)
- [Como Fazer Inscrição](docs/INSCRICAO.md) (a criar)
- [Política de Privacidade](docs/PRIVACY.md) (a criar)

---

**Narcóticos Anônimos** - Recuperação, Diversidade e Inclusão

---

*Última atualização: Janeiro 2026*
