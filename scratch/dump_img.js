const fs = require('fs');

const content = fs.readFileSync("./src/utils/logosBase64.ts", "utf8");
const novumMatch = content.match(/export const logoNovumideasBase64 = "(.*?)";/);
if (novumMatch) {
  const raw = novumMatch[1].replace(/^data:image\/\w+;base64,/, '').replace(/\s+/g, '');
  const buffer = Buffer.from(raw, 'base64');
  fs.writeFileSync('scratch/test.png', buffer);
  console.log("Wrote test.png, bytes:", buffer.length);
}
