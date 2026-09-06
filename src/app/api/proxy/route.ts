import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url, method, headers, body } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL es requerida' }, { status: 400 });
    }

    // Preparar opciones para el fetch nativo de Node
    const fetchOptions: RequestInit = {
      method: method || 'GET',
      headers: headers || {},
    };

    // Agregar el body solo si el método lo permite y si hay contenido
    if (method !== 'GET' && method !== 'HEAD' && body) {
      // Si el body es un string (JSON stringificado), lo pasamos tal cual
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Ejecutar la petición real desde el backend para evadir CORS del navegador
    const startTime = Date.now();
    const response = await fetch(url, fetchOptions);
    const endTime = Date.now();

    // Intentar parsear como JSON, si falla, tomar como texto plano
    let responseBody;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    // Convertir los headers de la respuesta a un objeto simple
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      timeMs: endTime - startTime,
      headers: responseHeaders,
      body: responseBody
    });

  } catch (error: any) {
    console.error('Error en el Proxy REST:', error);
    return NextResponse.json({ 
      error: 'Error de red o conexión al servidor destino', 
      details: error.message 
    }, { status: 500 });
  }
}
