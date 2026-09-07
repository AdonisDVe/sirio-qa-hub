import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { headerImage } from './headerBase64';

type Folder = { id: string; name: string; };
type RequestItem = {
  id: string; folderId: string; name: string; method: string; url: string;
  headers: { key: string; value: string }[]; body: string; response: any | null;
};

const ORANGE = [242, 101, 34] as [number, number, number];
const DARK_BLUE = [44, 62, 80] as [number, number, number];
const GREY = [100, 100, 100] as [number, number, number];
const LIGHT_GREY = [245, 245, 245] as [number, number, number];

const extractFieldsFromObj = (obj: any): string[] => {
  if (!obj || typeof obj !== 'object') return [];
  let fields: string[] = [];
  Object.keys(obj).forEach(k => {
    fields.push(k);
    if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      Object.keys(obj[k]).forEach(subK => fields.push(`${k}.${subK}`));
    }
  });
  return Array.from(new Set(fields));
};

const drawPageHeader = (doc: any, folderName: string) => {
  autoTable(doc, {
    startY: 15,
    margin: { left: 14, right: 14 },
    body: [
      [
        { content: 'NOVUMIDEAS', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', textColor: ORANGE, fontSize: 12 } },
        { content: 'Nombre del Proyecto\n' + folderName, styles: { cellPadding: 2, fontSize: 8 } },
        { content: 'CLIENTE', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', textColor: [0, 100, 0] } }
      ],
      [
        { content: 'Nombre del Cliente\nCliente Genérico', styles: { cellPadding: 2, fontSize: 8 } }
      ]
    ],
    theme: 'grid',
    styles: { lineColor: [220, 220, 220], lineWidth: 0.5, textColor: 0 },
    columnStyles: {
      0: { cellWidth: 40 },
      2: { cellWidth: 40 }
    }
  });
  return (doc as any).lastAutoTable.finalY;
};

export const generateFolderPDF = (folder: Folder, folderReqs: RequestItem[], fieldDatabase: Record<string, any>) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Portada
  if (headerImage) {
    // Agregar la cabecera proporcionada
    doc.addImage(headerImage, 'PNG', 0, 0, pageWidth, 50);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(0, 0, 0);
  doc.text("DICCIONARIO", pageWidth / 2, 120, { align: 'center' });
  doc.text("DE DATOS", pageWidth / 2, 135, { align: 'center' });

  doc.setFontSize(22);
  doc.text(folder.name, pageWidth / 2, 160, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const dateStr = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  doc.text(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), pageWidth / 2, 180, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("Todos los Derechos reservados", pageWidth / 2, pageHeight - 30, { align: 'center' });
  doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
  doc.text("WWW.NOVUMIDEAS.COM", pageWidth / 2, pageHeight - 25, { align: 'center' });
  
  doc.setFontSize(5);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const footerText = "IMPORTANTE: Queda prohibido cualquier tipo de explotación y, en particular, la reproducción, distribución, comunicación pública y/o transformación,\ntotal o parcial, por cualquier medio, de este documento sin el previo consentimiento expreso y por escrito del Proveedor.";
  doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text("CARACAS - VENEZUELA", pageWidth / 2, pageHeight - 5, { align: 'center' });

  // Hoja Control Documento (Pagina 2)
  doc.addPage();
  let startY = drawPageHeader(doc, folder.name);

  doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
  doc.rect(14, startY, pageWidth - 28, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text("TIPO DE SOLICITUD", 16, startY + 4);
  startY += 6;

  autoTable(doc, {
    startY,
    body: [['Requerimiento', `REQ-${Math.floor(Math.random()*1000)}`]],
    theme: 'grid',
    styles: { cellPadding: 2, fontSize: 9, lineColor: [220, 220, 220], lineWidth: 0.1, textColor: 0 }
  });
  startY = (doc as any).lastAutoTable.finalY + 5;

  doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
  doc.rect(14, startY, pageWidth - 28, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text("HOJA CONTROL DEL DOCUMENTO", 16, startY + 4);
  startY += 6;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text("Completa los campos de cada fila con base en la modificación realizada", 14, startY + 4);
  startY += 6;

  autoTable(doc, {
    startY,
    head: [['Versión', 'Fecha', 'Motivo del Cambio']],
    body: [['1', new Date().toLocaleDateString(), 'Elaboración']],
    theme: 'grid',
    headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold' },
    styles: { cellPadding: 2, fontSize: 9, lineColor: [220, 220, 220], lineWidth: 0.1, textColor: 0 }
  });

  // Iterar peticiones (Paginas 3+)
  folderReqs.forEach((req, index) => {
    doc.addPage();
    startY = drawPageHeader(doc, folder.name) + 2;

    // Título Servicio
    doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.rect(14, startY, pageWidth - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. SERVICIO: ${req.name.toUpperCase()}`, 16, startY + 6);
    startY += 12;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const descText = `A continuación se informa los links de los ambientes correspondientes (Desarrollo / Calidad / Producción) y la distribución de los campos de entrada / salida en relación al servicio de:\n${req.name}`;
    doc.text(descText, 14, startY);
    startY += 10;

    // Tabla APIs
    autoTable(doc, {
      startY,
      head: [[{ content: 'APIs:', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: 0 } }]],
      body: [
        [{ content: 'Desarrollo', styles: { fillColor: [220, 220, 220], fontStyle: 'bold' } }, req.url],
        [{ content: 'Calidad', styles: { fillColor: [220, 220, 220], fontStyle: 'bold' } }, ''],
        [{ content: 'Producción', styles: { fillColor: [220, 220, 220], fontStyle: 'bold' } }, '']
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2, lineColor: 0, lineWidth: 0.5, textColor: 0 },
      columnStyles: { 0: { cellWidth: 40 } }
    });
    startY = (doc as any).lastAutoTable.finalY + 5;

    // PARAMETROS DE ENTRADA
    let inFields: string[] = [];
    try { if (req.body) inFields = extractFieldsFromObj(JSON.parse(req.body)); } catch(e){}
    
    // Check if we need to paginate
    if (startY > pageHeight - 60) {
      doc.addPage();
      startY = drawPageHeader(doc, folder.name) + 5;
    }

    const inTableBody = inFields.map((f, i) => {
      const meta = fieldDatabase[f] || fieldDatabase[f.split('.').pop() || ''] || {};
      return [
        i + 1,
        f,
        meta.type || 'alfanumerico',
        meta.desc || 'Sin documentar',
        'Not Null',
        meta.length || 'N/A',
        meta.mandatory !== false ? 'Si' : 'No',
        meta.businessValue || 'N.A'
      ];
    });

    autoTable(doc, {
      startY,
      head: [
        [{ content: 'PARÁMETROS DE ENTRADA', colSpan: 8, styles: { halign: 'center', fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold' } }],
        [{ content: 'Request Body:', colSpan: 2, styles: { fillColor: [220, 220, 220], fontStyle: 'bold' } }, { content: '', colSpan: 6, styles: { fillColor: [255,255,255] } }],
        ['Número de Campos', 'Nombre del Campo', 'Tipo de Dato', 'Descripción', 'Formato', 'Longitud', 'Obligatorio', 'Valores del Negocio']
      ],
      body: inTableBody,
      theme: 'grid',
      headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 8, cellPadding: 2, halign: 'center', lineColor: 0, lineWidth: 0.1, textColor: 0 },
      columnStyles: { 3: { halign: 'center' } }
    });
    startY = (doc as any).lastAutoTable.finalY + 5;

    // PARAMETROS DE SALIDA
    let outFields: string[] = [];
    try { if (req.response?.body && !req.response.error) outFields = extractFieldsFromObj(req.response.body); } catch(e){}
    
    if (startY > pageHeight - 60) {
        doc.addPage();
        startY = drawPageHeader(doc, folder.name) + 5;
    }

    const outTableBody = outFields.map((f, i) => {
      const meta = fieldDatabase[f] || fieldDatabase[f.split('.').pop() || ''] || {};
      return [
        i + 1,
        f,
        meta.type || 'alfanumerico',
        meta.desc || 'Sin documentar',
        'Not Null',
        meta.length || 'N/A',
        'Si',
        meta.businessValue || 'N.A'
      ];
    });

    autoTable(doc, {
      startY,
      head: [
        [{ content: 'PARÁMETROS DE SALIDA', colSpan: 8, styles: { halign: 'center', fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold' } }],
        [{ content: 'Response Body:', colSpan: 2, styles: { fillColor: [220, 220, 220], fontStyle: 'bold' } }, { content: '', colSpan: 6, styles: { fillColor: [255,255,255] } }],
        ['Número de Campos', 'Nombre del Campo', 'Tipo de Dato', 'Descripción', 'Formato', 'Longitud', 'Obligatorio', 'Valores del Negocio']
      ],
      body: outTableBody,
      theme: 'grid',
      headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 8, cellPadding: 2, halign: 'center', lineColor: 0, lineWidth: 0.1, textColor: 0 },
      columnStyles: { 3: { halign: 'center' } }
    });
    startY = (doc as any).lastAutoTable.finalY + 5;

    // EVIDENCIA / FORMATO JSON
    if (startY > pageHeight - 80) {
        doc.addPage();
        startY = drawPageHeader(doc, folder.name) + 5;
    }
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("FORMATO JSON:", 14, startY + 6);
    startY += 15;
    
    if (req.body) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text("REQUEST BODY:", 14, startY);
      startY += 6;
      
      let bodyTxt = req.body;
      try { bodyTxt = JSON.stringify(JSON.parse(req.body), null, 2); } catch(e){}
      const splitReq = doc.splitTextToSize(bodyTxt, pageWidth - 32);
      
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.text(splitReq, 14, startY);
      startY += (splitReq.length * 4) + 6;
    }

    if (req.response && !req.response.error) {
      if (startY > pageHeight - 60) {
          doc.addPage();
          startY = drawPageHeader(doc, folder.name) + 15;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text("RESPONSE BODY:", 14, startY);
      startY += 6;
      
      let respTxt = JSON.stringify(req.response.body, null, 2) || "";
      const splitResp = doc.splitTextToSize(respTxt, pageWidth - 32);
      
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.text(splitResp, 14, startY);
    }
  });

  doc.save(`Diccionario_${folder.name.replace(/\s+/g, '_')}.pdf`);
};
