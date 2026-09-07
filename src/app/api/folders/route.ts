import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const folders = await prisma.folder.findMany({
      include: {
        requests: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json({ error: 'Error obteniendo carpetas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 });

    const folder = await prisma.folder.create({
      data: {
        name
      },
      include: {
        requests: true
      }
    });
    return NextResponse.json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Error creando carpeta' }, { status: 500 });
  }
}
