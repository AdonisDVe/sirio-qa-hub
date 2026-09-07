import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { id, folderId, name, method, url, headers, body } = data;

    if (!folderId || !name || !method) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    let headersStr = '[]';
    try {
       headersStr = typeof headers === 'string' ? headers : JSON.stringify(headers || []);
    } catch (e) {}

    if (id && id.length > 10) { // Un UUID tipicamente tiene más de 10 chars, los de JS temporales son cortos o numéricos
      // Upsert para actualizar o crear
      const reqItem = await prisma.requestItem.upsert({
        where: { id },
        update: { name, method, url: url || '', headers: headersStr, body },
        create: { id, folderId, name, method, url: url || '', headers: headersStr, body }
      });
      return NextResponse.json(reqItem);
    } else {
      // Crear nuevo
      const reqItem = await prisma.requestItem.create({
        data: {
          folderId,
          name,
          method,
          url: url || '',
          headers: headersStr,
          body
        }
      });
      return NextResponse.json(reqItem);
    }
  } catch (error) {
    console.error('Error saving request:', error);
    return NextResponse.json({ error: 'Error guardando petición' }, { status: 500 });
  }
}
