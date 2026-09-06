import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todos los ambientes
export async function GET() {
  try {
    const environments = await prisma.environment.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(environments);
  } catch (error) {
    console.error('Error fetching environments:', error);
    return NextResponse.json({ error: 'Error obteniendo ambientes' }, { status: 500 });
  }
}

// Crear o actualizar un ambiente
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { id, name, variables } = data;

    if (!name) {
      return NextResponse.json({ error: 'El nombre del ambiente es obligatorio' }, { status: 400 });
    }

    let environment;
    if (id) {
      // Actualizar existente
      environment = await prisma.environment.update({
        where: { id },
        data: {
          name,
          variables: typeof variables === 'string' ? variables : JSON.stringify(variables)
        }
      });
    } else {
      // Crear nuevo
      environment = await prisma.environment.create({
        data: {
          name,
          variables: typeof variables === 'string' ? variables : JSON.stringify(variables)
        }
      });
    }

    return NextResponse.json({ success: true, environment });
  } catch (error) {
    console.error('Error saving environment:', error);
    return NextResponse.json({ error: 'Error guardando en base de datos' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    await prisma.environment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
