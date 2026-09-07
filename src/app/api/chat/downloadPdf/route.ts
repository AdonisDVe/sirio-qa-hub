import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Archivo no encontrado o expirado (ID faltante)', { status: 404 });
    }

    const exportRecord = await prisma.collectionExport.findUnique({
      where: { id }
    });

    if (!exportRecord || !exportRecord.pdfBase64) {
      return new NextResponse('Archivo PDF no encontrado o expirado', { status: 404 });
    }

    // The pdfBase64 might be a data URI like "data:application/pdf;filename=generated.pdf;base64,JVBERi0xLj..."
    // We need to extract just the base64 part.
    let base64Data = exportRecord.pdfBase64;
    if (base64Data.includes('base64,')) {
      base64Data = base64Data.split('base64,')[1];
    }

    const pdfBuffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Diccionario_${exportRecord.folderName.replace(/\s+/g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error in downloadPdf route:', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}
