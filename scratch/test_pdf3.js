const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;
const fs = require("fs");

const content = fs.readFileSync("./src/utils/logosBase64.ts", "utf8");
let logoNovumideasBase64 = "";
let logoClienteBase64 = "";

const novumMatch = content.match(/export const logoNovumideasBase64 = "(.*?)";/);
if (novumMatch) logoNovumideasBase64 = novumMatch[1];

const clienteMatch = content.match(/export const logoClienteBase64 = "(.*?)";/);
if (clienteMatch) logoClienteBase64 = clienteMatch[1];

const doc = new jsPDF();
autoTable(doc, {
  startY: 15,
  head: [['A', 'B', 'C']],
  body: [['1', '2', '3']],
  didDrawCell: (data) => {
    if (data.section === 'head' && data.row.index === 0) {
      if (data.column.index === 0) {
        try {
          const raw = logoNovumideasBase64.replace(/^data:image\/\w+;base64,/, '').replace(/\s+/g, '');
          doc.addImage(raw, 'PNG', data.cell.x, data.cell.y, 10, 10);
          console.log("PNG worked");
        } catch(e) { console.error("PNG error", e.message); }
      }
      if (data.column.index === 2) {
        try {
          const raw = logoClienteBase64.replace(/^data:image\/\w+;base64,/, '').replace(/\s+/g, '');
          const format = raw.startsWith('/9j/') ? 'JPEG' : 'PNG';
          doc.addImage(raw, format, data.cell.x, data.cell.y, 10, 10);
          console.log("JPEG worked");
        } catch(e) { console.error("JPEG error", e.message); }
      }
    }
  }
});
doc.save("scratch/output3.pdf");
