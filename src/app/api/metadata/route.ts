import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todos los campos guardados
export async function GET() {
  try {
    const fields = await prisma.fieldMetadata.findMany();
    // Convertir a un objeto key-value para que el frontend lo lea fácil
    const fieldDatabase: Record<string, any> = {};
    fields.forEach(f => {
      fieldDatabase[f.fieldName] = {
        desc: f.description,
        type: f.dataType,
        mandatory: f.isMandatory,
        businessValue: f.businessValue
      };
    });
    return NextResponse.json(fieldDatabase);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json({ error: 'Error obteniendo metadatos' }, { status: 500 });
  }
}

// Guardar o Actualizar un campo
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { fieldName, description, dataType, isMandatory, businessValue } = data;

    if (!fieldName || !description || !dataType) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Upsert: Si existe lo actualiza, si no existe lo crea
    const field = await prisma.fieldMetadata.upsert({
      where: { fieldName: fieldName },
      update: {
        description,
        dataType,
        isMandatory,
        businessValue
      },
      create: {
        fieldName,
        description,
        dataType,
        isMandatory,
        businessValue
      }
    });

    return NextResponse.json({ success: true, field });
  } catch (error) {
    console.error('Error saving metadata:', error);
    return NextResponse.json({ error: 'Error guardando en base de datos' }, { status: 500 });
  }
}
