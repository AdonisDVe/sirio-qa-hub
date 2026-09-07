const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;
const fs = require("fs");

// Simulating the logos (just small 1x1 pixel base64 for testing, or reading from the file)
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
  margin: { left: 14, right: 14 },
  head: [['', { content: 'Test', styles: { halign: 'center', fontStyle: 'bold' } }, { content: 'Client', styles: { halign: 'center', fontStyle: 'bold' } }]],
  body: [['', '', '']],
  theme: 'grid',
  headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold' },
  styles: { cellPadding: 4, fontSize: 10, lineColor: [200, 200, 200], lineWidth: 0.1, textColor: 0, minCellHeight: 18 },
  columnStyles: {
    0: { cellWidth: 50 },
    1: { cellWidth: 'auto' },
    2: { cellWidth: 50 }
  },
  didDrawCell: (data) => {
    if (data.section === 'head' && data.row.index === 0) {
      if (data.column.index === 0 && logoNovumideasBase64) {
        try {
          const raw = logoNovumideasBase64.replace(/^data:image\/\w+;base64,/, '').replace(/\s+/g, '');
          console.log("Drawing PNG, raw length:", raw.length, "cell W:", data.cell.width, "cell H:", data.cell.height);
          doc.addImage(raw, 'PNG', data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, data.cell.height - 4);
        } catch(e) { 
          console.error("Error drawing logoNovumideas", e); 
        }
      }
      if (data.column.index === 2 && logoClienteBase64) {
        try {
          const raw = logoClienteBase64.replace(/^data:image\/\w+;base64,/, '').replace(/\s+/g, '');
          const format = raw.startsWith('/9j/') ? 'JPEG' : 'PNG';
          console.log("Drawing", format, ", raw length:", raw.length, "cell W:", data.cell.width, "cell H:", data.cell.height);
          doc.addImage(raw, format, data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, data.cell.height - 4);
        } catch(e) { 
          console.error("Error drawing logoCliente", e); 
        }
      }
    }
  }
});

doc.save("scratch/output.pdf");
console.log("Generated successfully");
