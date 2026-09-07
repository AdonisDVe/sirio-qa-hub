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

    if (!exportRecord) {
      return new NextResponse('Archivo no encontrado o expirado (No en DB)', { status: 404 });
    }

    const collectionJson = JSON.parse(exportRecord.collectionJson);

    return new NextResponse(JSON.stringify(collectionJson, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${exportRecord.folderName.replace(/\s+/g, '_')}_Collection.json"`,
      },
    });
  } catch (error) {
    console.error('Error in download route:', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}
