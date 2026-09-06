import { NextResponse } from 'next/server';
import { exportCache } from '../share/route';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !exportCache.has(id)) {
      return new NextResponse('Archivo no encontrado o expirado', { status: 404 });
    }

    const { folderName, collectionJson } = exportCache.get(id);

    return new NextResponse(JSON.stringify(collectionJson, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${folderName.replace(/\s+/g, '_')}_Collection.json"`,
      },
    });
  } catch (error) {
    return new NextResponse('Error interno', { status: 500 });
  }
}
