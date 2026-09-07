const fs = require('fs');

const content = fs.readFileSync("./src/utils/logosBase64.ts", "utf8");
const novumMatch = content.match(/export const logoNovumideasBase64 = "(.*?)";/);
const clienteMatch = content.match(/export const logoClienteBase64 = "(.*?)";/);

if (novumMatch) {
  const c1 = novumMatch[1].replace(/^data:image\/\w+;base64,/, '').replace(/\s+/g, '');
  console.log('PNG len:', c1.length, c1.length % 4);
}

if (clienteMatch) {
  const c2 = clienteMatch[1].replace(/^data:image\/\w+;base64,/, '').replace(/\s+/g, '');
  console.log('JPEG len:', c2.length, c2.length % 4);
}
