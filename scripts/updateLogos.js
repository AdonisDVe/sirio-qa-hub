const fs = require('fs');
const path = require('path');

const LOGO_NOVUM_PATH = path.join(__dirname, '../public/logo_novum.png');
const LOGO_CLIENTE_PATH = path.join(__dirname, '../public/logo_cliente.jpg');
const OUTPUT_PATH = path.join(__dirname, '../src/utils/logosBase64.ts');

let novumBase64 = "";
let clienteBase64 = "";

try {
  if (fs.existsSync(LOGO_NOVUM_PATH)) {
    const data = fs.readFileSync(LOGO_NOVUM_PATH);
    novumBase64 = data.toString('base64');
    console.log("✅ Logo Novumideas cargado correctamente.");
  } else {
    console.log("⚠️ No se encontró public/logo_novum.png. Dejando vacío.");
  }

  if (fs.existsSync(LOGO_CLIENTE_PATH)) {
    const data = fs.readFileSync(LOGO_CLIENTE_PATH);
    clienteBase64 = data.toString('base64');
    console.log("✅ Logo Cliente cargado correctamente.");
  } else {
    console.log("⚠️ No se encontró public/logo_cliente.jpg. Dejando vacío.");
  }

  const tsContent = `// Archivo generado automáticamente. No editar manualmente.
export const logoNovumideasBase64 = "${novumBase64}";
export const logoClienteBase64 = "${clienteBase64}";
`;

  fs.writeFileSync(OUTPUT_PATH, tsContent, 'utf8');
  console.log("🎉 logosBase64.ts actualizado exitosamente!");

} catch (error) {
  console.error("❌ Error actualizando los logos:", error);
}
