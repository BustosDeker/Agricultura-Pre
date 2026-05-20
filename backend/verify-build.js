const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando estructura de directorios...');
console.log('Directorio actual:', process.cwd());
console.log('Contenido del directorio actual:', fs.readdirSync('.'));

const distPath = path.join(process.cwd(), 'dist');
console.log('\n📁 Verificando dist/...');
if (fs.existsSync(distPath)) {
  console.log('✅ dist/ existe');
  console.log('Contenido de dist/:', fs.readdirSync(distPath));
  
  const mainPath = path.join(distPath, 'main.js');
  if (fs.existsSync(mainPath)) {
    console.log('✅ dist/main.js existe');
  } else {
    console.log('❌ dist/main.js NO existe');
  }
} else {
  console.log('❌ dist/ NO existe');
}

const srcPath = path.join(process.cwd(), 'src');
console.log('\n📁 Verificando src/...');
if (fs.existsSync(srcPath)) {
  console.log('✅ src/ existe');
  console.log('Contenido de src/:', fs.readdirSync(srcPath));
}
