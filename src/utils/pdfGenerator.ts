import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { headerImage } from './headerBase64';
import { logoNovumideasBase64, logoClienteBase64 } from './logosBase64';

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

const getReplacedUrl = (devUrl: string, newBaseUrl: string) => {
  if (!newBaseUrl) return '';
  try {
    const url = new URL(devUrl);
    // ensure newBaseUrl doesn't end with slash if pathname starts with slash
    const base = newBaseUrl.endsWith('/') ? newBaseUrl.slice(0, -1) : newBaseUrl;
    const path = url.pathname.startsWith('/') ? url.pathname : '/' + url.pathname;
    return base + path + url.search;
  } catch(e) {
    return newBaseUrl;
  }
};

const drawPageHeader = (doc: any, folderName: string, clientName: string) => {
  autoTable(doc, {
    startY: 15,
    margin: { left: 14, right: 14 },
    head: [['', { content: folderName, styles: { halign: 'center', fontStyle: 'bold' } }, { content: clientName, styles: { halign: 'center', fontStyle: 'bold' } }]],
    body: [['', '', '']],
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold' },
    styles: { cellPadding: 4, fontSize: 10, lineColor: [200, 200, 200], lineWidth: 0.1, textColor: 0, minCellHeight: 18 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 50 }
    },
    didDrawCell: (data: any) => {
      // Add logos in the first and last columns of the header
      if (data.section === 'head' && data.row.index === 0) {
        if (data.column.index === 0 && logoNovumideasBase64) {
          try {
            const cleanStr = logoNovumideasBase64.replace(/^data:image\/\w+;base64,/, '');
            doc.addImage(cleanStr, 'PNG', data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, data.cell.height - 4);
          } catch(e){ console.error("Error drawing logoNovumideas", e); }
        }
        if (data.column.index === 2 && logoClienteBase64) {
          try {
            const cleanStr = logoClienteBase64.replace(/^data:image\/\w+;base64,/, '');
            const format = cleanStr.startsWith('/9j/') ? 'JPEG' : 'PNG';
            doc.addImage(cleanStr, format, data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, data.cell.height - 4);
          } catch(e){ console.error("Error drawing logoCliente", e); }
        }
      }
    }
  });
  return (doc as any).lastAutoTable.finalY;
};

export const generateFolderPDF = (folder: Folder, folderReqs: RequestItem[], fieldDatabase: Record<string, any>, exportOptions: any) => {
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
  let startY = drawPageHeader(doc, folder.name, exportOptions.clientName);

  doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
  doc.rect(14, startY, pageWidth - 28, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text("TIPO DE SOLICITUD", 16, startY + 4);
  startY += 6;

  autoTable(doc, {
    startY,
    body: [['Requerimiento', exportOptions.reqNumber || '']],
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
    startY = drawPageHeader(doc, folder.name, exportOptions.clientName) + 2;

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
    const descText = `A continuación se informa los links de los ambientes correspondientes (Desarrollo / Calidad / Producción) y la distribución de los campos de entrada / salida en relación al servicio de ${req.name}:`;
    const splitDesc = doc.splitTextToSize(descText, pageWidth - 28);
    doc.text(splitDesc, 14, startY);
    startY += (splitDesc.length * 5) + 3;

    // Tabla APIs (Filas separadas de Entorno y HEADER - Entorno)
    const apiBody: any[] = [];
    
    // Desarrollo
    apiBody.push([
      { content: 'Desarrollo', styles: { fillColor: [225, 225, 225], fontStyle: 'bold' } },
      { content: req.url, styles: { textColor: [0, 0, 238], fontStyle: 'bold' } }
    ]);
    if (exportOptions.devApiKey && exportOptions.devApiKey.trim() !== '') {
      apiBody.push([
        { content: 'HEADER -\nDesarrollo', styles: { fillColor: [225, 225, 225], fontStyle: 'bold' } },
        { content: `X-API-Key:  ${exportOptions.devApiKey}`, styles: { textColor: [0, 0, 238], fontStyle: 'bold' } }
      ]);
    }

    // Calidad
    const qaUrl = getReplacedUrl(req.url, exportOptions.qaUrl);
    apiBody.push([
      { content: 'Calidad', styles: { fillColor: [225, 225, 225], fontStyle: 'bold' } },
      { content: qaUrl, styles: { textColor: [0, 0, 238], fontStyle: 'bold' } }
    ]);
    if (exportOptions.qaApiKey && exportOptions.qaApiKey.trim() !== '') {
      apiBody.push([
        { content: 'HEADER -\nCalidad', styles: { fillColor: [225, 225, 225], fontStyle: 'bold' } },
        { content: `X-API-Key:  ${exportOptions.qaApiKey}`, styles: { textColor: [0, 0, 238], fontStyle: 'bold' } }
      ]);
    }

    // Producción
    const prodUrl = getReplacedUrl(req.url, exportOptions.prodUrl);
    apiBody.push([
      { content: 'Producción', styles: { fillColor: [225, 225, 225], fontStyle: 'bold' } },
      { content: prodUrl, styles: { textColor: [0, 0, 238], fontStyle: 'bold' } }
    ]);
    if (exportOptions.prodApiKey && exportOptions.prodApiKey.trim() !== '') {
      apiBody.push([
        { content: 'HEADER -\nProducción', styles: { fillColor: [225, 225, 225], fontStyle: 'bold' } },
        { content: `X-API-Key:  ${exportOptions.prodApiKey}`, styles: { textColor: [0, 0, 238], fontStyle: 'bold' } }
      ]);
    }

    autoTable(doc, {
      startY,
      head: [
        [{ content: 'APIs:', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255], textColor: 0 } }]
      ],
      body: apiBody,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 3, lineColor: 0, lineWidth: 0.4, textColor: 0 },
      columnStyles: { 
        0: { cellWidth: 42 },
        1: { cellWidth: 'auto' }
      }
    });
    startY = (doc as any).lastAutoTable.finalY + 6;

    // PARAMETROS DE ENTRADA
    let inFields: string[] = [];
    try { if (req.body) inFields = extractFieldsFromObj(JSON.parse(req.body)); } catch(e){}
    
    // Check if we need to paginate
    if (startY > pageHeight - 60) {
      doc.addPage();
      startY = drawPageHeader(doc, folder.name, exportOptions.clientName) + 5;
    }

    const inTableBody = inFields.map((f, i) => {
      const meta = fieldDatabase[f] || fieldDatabase[f.split('.').pop() || ''] || {};
      const fieldDisplayName = f.split('.').pop() || f;
      return [
        i + 1,
        fieldDisplayName,
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
        startY = drawPageHeader(doc, folder.name, exportOptions.clientName) + 5;
    }

    const outTableBody = outFields.map((f, i) => {
      const meta = fieldDatabase[f] || fieldDatabase[f.split('.').pop() || ''] || {};
      const fieldDisplayName = f.split('.').pop() || f;
      return [
        i + 1,
        fieldDisplayName,
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
        startY = drawPageHeader(doc, folder.name, exportOptions.clientName) + 5;
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
          startY = drawPageHeader(doc, folder.name, exportOptions.clientName) + 15;
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
      startY += (splitResp.length * 4) + 10;
    }
  });

  // --- SECCIÓN FINAL: CÓDIGOS DE RESPUESTA Y MANEJO DE EXCEPCIONES ---
  doc.addPage();
  let finalY = drawPageHeader(doc, folder.name, exportOptions.clientName) + 5;

  // 1. CÓDIGOS DE RESPUESTA (Standard HTTP Response Codes)
  doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
  doc.rect(14, finalY, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("1. CÓDIGOS DE RESPUESTA", 16, finalY + 6);
  finalY += 12;

  autoTable(doc, {
    startY: finalY,
    head: [
      [
        { content: 'Códigos', styles: { fillColor: [180, 180, 180], fontStyle: 'bold', halign: 'center' as const } },
        { content: 'Respuesta', styles: { fillColor: [180, 180, 180], fontStyle: 'bold', halign: 'center' as const } }
      ]
    ],
    body: [
      [{ content: '1000', styles: { halign: 'center' as const } }, 'SUCCESS'],
      [{ content: '1001', styles: { halign: 'center' as const } }, 'ERRORES DE VALIDACIÓN DEL SERVICIO'],
      [{ content: '1010', styles: { halign: 'center' as const } }, 'EXCEPCIONES OCURRIDAS EN EL SERVICIO'],
      [{ content: '0500', styles: { halign: 'center' as const } }, 'EXCEPCIONES OCURRIDAS FUERA DEL SERVICIO']
    ],
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 3, lineColor: 0, lineWidth: 0.4, textColor: 0 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 'auto' }
    }
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  // 2. MANEJO DE EXCEPCIONES Y ERRORES
  doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
  doc.rect(14, finalY, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("2. MANEJO DE EXCEPCIONES Y ERRORES", 16, finalY + 6);
  finalY += 12;

  // Parse user-edited error codes or default
  let errorCodesBody: any[] = [];
  if (exportOptions.errorCodesRaw && exportOptions.errorCodesRaw.trim() !== '') {
    const lines = exportOptions.errorCodesRaw.split('\n');
    lines.forEach((line: string) => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const code = parts[0].trim();
        const desc = parts.slice(1).join(':').trim();
        errorCodesBody.push([{ content: code, styles: { halign: 'center' as const } }, desc]);
      } else if (line.trim() !== '') {
        errorCodesBody.push([{ content: '-', styles: { halign: 'center' as const } }, line.trim()]);
      }
    });
  } else {
    errorCodesBody = [
      [{ content: "'00", styles: { halign: 'center' as const } }, 'Solicitud de pago efectuada exitosamente'],
      [{ content: "'03", styles: { halign: 'center' as const } }, 'Error en la longitud de los parámetros de entrada (Fecha Inválida, Número de Tarjeta)'],
      [{ content: "'04", styles: { halign: 'center' as const } }, 'La longitud de la fecha para la transacción no es valida.'],
      [{ content: "'05", styles: { halign: 'center' as const } }, 'Hubo un error en los parámetros de entrada'],
      [{ content: "'06", styles: { halign: 'center' as const } }, 'Longitud de tipo de pago no permitido'],
      [{ content: "'07", styles: { halign: 'center' as const } }, 'Tipo de pago no permitido'],
      [{ content: "'08", styles: { halign: 'center' as const } }, 'El monto reportado para la operación no es válido'],
      [{ content: "'09", styles: { halign: 'center' as const } }, 'La longitud del código de banco que realiza el pago no es válida.'],
      [{ content: "'97", styles: { halign: 'center' as const } }, 'Error al procesar el pago en Línea.'],
      [{ content: "'98", styles: { halign: 'center' as const } }, 'Error al procesar el pago en Línea, se ha encontrado que un valor que se deseaba actualizar o insertar era null.'],
      [{ content: "'99", styles: { halign: 'center' as const } }, 'El número de transacción ya ha sido utilizado con anterioridad.']
    ];
  }

  autoTable(doc, {
    startY: finalY,
    head: [
      [
        { content: 'Códigos', styles: { fillColor: [180, 180, 180], fontStyle: 'bold', halign: 'center' as const } },
        { content: 'Descripción', styles: { fillColor: [180, 180, 180], fontStyle: 'bold', halign: 'center' as const } }
      ]
    ],
    body: errorCodesBody,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: 0, lineWidth: 0.4, textColor: 0 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 'auto' }
    }
  });

  doc.save(`Diccionario_${folder.name.replace(/\s+/g, '_')}.pdf`);
};
