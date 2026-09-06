import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Extraemos la API Key que nos enviará el Frontend
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json({ error: 'Falta la Postman API Key' }, { status: 400 });
  }

  try {
    // Hacemos la petición real a los servidores de Postman
    const response = await fetch('https://api.getpostman.com/collections', {
      headers: {
        'X-Api-Key': apiKey,
      },
      // Usamos cache:'no-store' para asegurar que siempre traiga la info más reciente
      cache: 'no-store' 
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || 'Error al conectar con Postman' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error interno conectando con Postman:', error);
    return NextResponse.json({ error: 'Error del servidor interno' }, { status: 500 });
  }
}
