import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { collectionUid, apiKey } = await request.json();

    if (!collectionUid || !apiKey) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // 1. Obtener el JSON crudo de la colección desde Postman
    const response = await fetch(`https://api.getpostman.com/collections/${collectionUid}`, {
      headers: { 'X-Api-Key': apiKey },
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Error obteniendo la colección de Postman' }, { status: response.status });
    }

    const data = await response.json();
    const collection = data.collection;

    // 2. Lógica de Parseo: Extraer metadata para el Diccionario
    const endpoints: any[] = [];

    // Función recursiva para iterar sobre carpetas y peticiones
    const extractItems = (items: any[]) => {
      for (const item of items) {
        if (item.item) {
          // Es una carpeta, iteramos dentro
          extractItems(item.item);
        } else if (item.request) {
          // Es una petición final (Endpoint)
          const req = item.request;
          
          // Intentamos extraer el Body de Entrada
          let requestBody = null;
          if (req.body && req.body.raw) {
            try {
              requestBody = JSON.parse(req.body.raw);
            } catch (e) {
              requestBody = "Formato no-JSON";
            }
          }

          // Intentamos extraer el Body de Salida (de los ejemplos guardados si existen)
          let responseBody = null;
          if (item.response && item.response.length > 0 && item.response[0].body) {
            try {
              responseBody = JSON.parse(item.response[0].body);
            } catch (e) {
              responseBody = "Formato no-JSON";
            }
          }

          endpoints.push({
            name: item.name,
            method: req.method,
            url: req.url?.raw || '',
            requestFields: requestBody ? Object.keys(requestBody) : [],
            responseFields: responseBody ? Object.keys(responseBody) : [],
            rawRequest: requestBody,
            rawResponse: responseBody
          });
        }
      }
    };

    extractItems(collection.item);

    // Retornamos la data estructurada lista para convertirse en PDF
    return NextResponse.json({
      collectionName: collection.info.name,
      totalEndpoints: endpoints.length,
      endpoints: endpoints
    });

  } catch (error) {
    console.error('Error parseando diccionario:', error);
    return NextResponse.json({ error: 'Error del servidor interno' }, { status: 500 });
  }
}
