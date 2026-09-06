import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ uid: string }> | { uid: string } }) {
  const apiKey = request.nextUrl.searchParams.get('apikey');
  // En Next.js 15, params es una promesa. Await garantiza compatibilidad.
  const resolvedParams = await params;
  const uid = resolvedParams?.uid;

  if (!apiKey || !uid) {
    return new NextResponse('Falta API Key o UID', { status: 400 });
  }

  try {
    // Descargamos el JSON desde Postman
    const res = await fetch(`https://api.getpostman.com/collections/${uid}`, {
      headers: { 'x-api-key': apiKey }
    });

    if (!res.ok) {
      return new NextResponse('Error obteniendo la colección de Postman', { status: res.status });
    }

    const data = await res.json();
    const collectionName = data.collection?.info?.name || 'coleccion';
    
    // Limpiamos el nombre para el archivo
    const safeName = collectionName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Obligamos al navegador a descargar el archivo (Attachment)
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${safeName}.json"`
      }
    });

  } catch (error) {
    console.error(error);
    return new NextResponse('Error interno', { status: 500 });
  }
}
