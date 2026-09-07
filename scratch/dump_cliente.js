const fs = require('fs');
const content = fs.readFileSync("./src/utils/logosBase64.ts", "utf8");
const clienteMatch = content.match(/export const logoClienteBase64 = "(.*?)";/);
if (clienteMatch) {
  const raw = clienteMatch[1].replace(/^data:image\/\w+;base64,/, '').replace(/\s+/g, '');
  const buffer = Buffer.from(raw, 'base64');
  fs.writeFileSync('scratch/test.jpeg', buffer);
  console.log("Wrote test.jpeg, bytes:", buffer.length);
}
