import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todos los códigos de respuesta guardados
export async function GET() {
  try {
    const codes = await prisma.responseCodeMetadata.findMany({
      orderBy: { code: 'asc' } // Ordenarlos numéricamente/alfabéticamente
    });
    return NextResponse.json(codes);
  } catch (error) {
    console.error('Error fetching response codes:', error);
    return NextResponse.json({ error: 'Error obteniendo códigos' }, { status: 500 });
  }
}

// Guardar o Actualizar un código de respuesta
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { code, description, type } = data;

    if (!code || !description || !type) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Upsert: Si el código ya existe lo actualiza, si no, lo crea
    const responseCode = await prisma.responseCodeMetadata.upsert({
      where: { code: code },
      update: {
        description,
        type,
      },
      create: {
        code,
        description,
        type,
      }
    });

    return NextResponse.json({ success: true, responseCode });
  } catch (error) {
    console.error('Error saving response code:', error);
    return NextResponse.json({ error: 'Error guardando en base de datos' }, { status: 500 });
  }
}
