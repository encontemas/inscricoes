// Script standalone para gerar par de chaves RSA para PagBank Connect Challenge
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Gerando par de chaves RSA para PagBank Connect Challenge...\n');

try {
    // Gerar par de chaves diretamente (código inline)
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    // Timestamp de criação
    const createdAt = Date.now();

    console.log('✅ Chaves geradas com sucesso!\n');

    // Salvar chaves localmente (opcional, apenas para backup)
    const keysDir = path.join(__dirname, '../keys');
    if (!fs.existsSync(keysDir)) {
        fs.mkdirSync(keysDir, { recursive: true });
    }

    fs.writeFileSync(path.join(keysDir, 'public-key.pem'), publicKey);
    fs.writeFileSync(path.join(keysDir, 'private-key.pem'), privateKey);
    fs.writeFileSync(path.join(keysDir, 'created-at.txt'), createdAt.toString());

    console.log('💾 Chaves salvas localmente em: ./keys/\n');
    console.log('⚠️  IMPORTANTE: Adicione as chaves nas variáveis de ambiente do Vercel!\n');

    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('📋 COPIE ESTAS INFORMAÇÕES PARA AS VARIÁVEIS DE AMBIENTE DO VERCEL:');
    console.log('═══════════════════════════════════════════════════════════════════════════\n');

    console.log('1️⃣  PAGBANK_PUBLIC_KEY');
    console.log('───────────────────────────────────────────────────────────────────────────');
    console.log(publicKey);
    console.log('───────────────────────────────────────────────────────────────────────────\n');

    console.log('2️⃣  PAGBANK_PRIVATE_KEY');
    console.log('───────────────────────────────────────────────────────────────────────────');
    console.log(privateKey);
    console.log('───────────────────────────────────────────────────────────────────────────\n');

    console.log('3️⃣  PAGBANK_KEY_CREATED_AT');
    console.log('───────────────────────────────────────────────────────────────────────────');
    console.log(createdAt);
    console.log('───────────────────────────────────────────────────────────────────────────\n');

    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('📌 PRÓXIMOS PASSOS:');
    console.log('═══════════════════════════════════════════════════════════════════════════\n');

    console.log('1. Acesse: https://vercel.com/dashboard');
    console.log('2. Vá em: Settings → Environment Variables');
    console.log('3. Adicione as 3 variáveis acima (COPIE E COLE exatamente como mostrado)');
    console.log('4. Peça ao Gustavo para cadastrar esta URL no PagBank:');
    console.log('   https://inscricoes-sigma.vercel.app/api/pk-7f3e9d2a1b');
    console.log('5. Faça deploy: vercel --prod (ou aguarde deploy automático)');
    console.log('6. Teste em: https://inscricoes-sigma.vercel.app/teste-pix.html\n');

    console.log('⚠️  SEGURANÇA:');
    console.log('   - A chave PRIVADA nunca deve ser compartilhada');
    console.log('   - A pasta ./keys/ está no .gitignore');
    console.log('   - Mantenha o arquivo private-key.pem seguro\n');

} catch (error) {
    console.error('❌ Erro ao gerar chaves:', error);
    process.exit(1);
}
