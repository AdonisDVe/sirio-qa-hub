import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { collectionUid, environmentId, collectionName, apiKey } = await request.json();

    if (!collectionUid || !apiKey) {
      return NextResponse.json({ error: 'Falta el ID de la colección o la API Key' }, { status: 400 });
    }

    // 1. Buscar el ambiente en la base de datos
    let envArgs = "";
    let envName = "Sin Ambiente";
    
    if (environmentId) {
      const env = await prisma.environment.findUnique({ where: { id: environmentId } });
      if (env) {
        envName = env.name;
        const parsed = JSON.parse(env.variables || "{}");
        // Formato para la consola: --env-var "baseUrl=http..." --env-var "key=123"
        envArgs = Object.keys(parsed)
          .map(key => `--env-var "${key}=${parsed[key]}"`)
          .join(' ');
      }
    }

    // 2. Ejecución INVISIBLE y REAL con Newman usando la Terminal del Servidor
    const collectionUrl = `https://api.getpostman.com/collections/${collectionUid}?apikey=${apiKey}`;
    const command = `npx newman run "${collectionUrl}" ${envArgs}`;

    let passed = true;
    let failures = 0;
    let totalRequests = 0;
    let newmanLog = "";

    try {
      const { stdout } = await execPromise(command);
      newmanLog = stdout;
      const reqMatch = stdout.match(/requests\s+(\d+)/);
      if (reqMatch) totalRequests = parseInt(reqMatch[1], 10);
    } catch (error: any) {
      passed = false;
      newmanLog = error.stdout || error.stderr || error.message;
      const reqMatch = newmanLog.match(/requests\s+(\d+)/);
      const failMatch = newmanLog.match(/assertions\s+\d+\s+(\d+)/);
      if (reqMatch) totalRequests = parseInt(reqMatch[1], 10);
      if (failMatch) {
        failures = parseInt(failMatch[1], 10);
      } else {
        // Si no hay aserciones fallidas pero tronó, fue un error de red o de Newman general
        failures = 1; 
      }
    }

    // 3. Preparar la Evidencia para el Chat
    const GOOGLE_CHAT_WEBHOOK_URL = process.env.GOOGLE_CHAT_WEBHOOK;
    if (!GOOGLE_CHAT_WEBHOOK_URL) {
      return NextResponse.json({ error: 'Webhook no configurado' }, { status: 500 });
    }

    const downloadLink = `http://localhost:3000/api/download/${collectionUid}?apikey=${apiKey}`;
    
    // Armar el mensaje dinámico para Google Chat
    const headerTitle = passed ? "✅ Certificación Exitosa" : "❌ Pruebas Fallidas";
    const statusText = passed 
      ? `Newman ejecutó *${totalRequests}* peticiones. ¡0 errores encontrados! Se certifica el pase a Producción.`
      : `¡ALERTA! Las pruebas fallaron. Se requiere revisión técnica urgente.`;

    const chatMessage = {
      cards: [
        {
          header: {
            title: headerTitle,
            subtitle: "Sirio QA Hub Automation",
          },
          sections: [
            {
              widgets: [
                { textParagraph: { text: `🚀 *Colección:* ${collectionName || 'API'}` } },
                { textParagraph: { text: `🏢 *Ambiente Ejecutado:* ${envName}` } },
                { textParagraph: { text: statusText } },
                {
                  buttons: [
                    {
                      textButton: {
                        text: "📥 Descargar Evidencia JSON",
                        onClick: { openLink: { url: downloadLink } }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    // Disparar Notificación Push al equipo
    await fetch(GOOGLE_CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatMessage)
    });

    // Responder al Frontend con el log completo de Newman para depurar
    if (passed) {
      return NextResponse.json({ success: true, message: `Certificación exitosa en ${envName}. Mensaje enviado a Google Chat.`, log: newmanLog });
    } else {
      return NextResponse.json({ success: false, error: `Las pruebas fallaron. Mira la consola para detalles.`, log: newmanLog }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error ejecutando Newman:', error);
    return NextResponse.json({ error: 'Error interno ejecutando pruebas en Newman' }, { status: 500 });
  }
}
