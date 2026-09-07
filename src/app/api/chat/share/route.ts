import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { folderName, collectionJson, origin } = await request.json();
    
    if (!folderName || !collectionJson) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const exportRecord = await prisma.collectionExport.create({
      data: {
        folderName,
        collectionJson: typeof collectionJson === 'string' ? collectionJson : JSON.stringify(collectionJson)
      }
    });

    const baseUrl = origin || 'http://localhost:3000';
    const downloadLink = `${baseUrl}/api/chat/download?id=${exportRecord.id}`;

    const GOOGLE_CHAT_WEBHOOK_URL = process.env.GOOGLE_CHAT_WEBHOOK;
    if (GOOGLE_CHAT_WEBHOOK_URL) {
      const chatMessage = {
        cards: [{
          header: { title: "✅ Colección Aprobada", subtitle: "Sirio Postman Collector" },
          sections: [{
            widgets: [
              { textParagraph: { text: `🚀 El requerimiento/carpeta *${folderName}* ha sido certificado y está listo.` } },
              { textParagraph: { text: `🔗 Link directo (copiar y pegar si el botón falla):\n${downloadLink}` } },
              { buttons: [{ textButton: { text: "📥 Descargar Colección Postman", onClick: { openLink: { url: downloadLink } } } }] }
            ]
          }]
        }]
      };

      await fetch(GOOGLE_CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatMessage)
      });
    }

    return NextResponse.json({ success: true, downloadLink });
  } catch (error: any) {
    console.error('Error compartiendo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return NextResponse.json({ error: 'Use POST to share' }, { status: 405 });
}
