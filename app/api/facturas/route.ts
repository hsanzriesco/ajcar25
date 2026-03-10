import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// --- FUNCIÓN GET PARA VER EL HISTORIAL ---
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    // Traemos las facturas ordenadas por la más reciente
    const data = await sql`SELECT * FROM facturas ORDER BY fecha_emision DESC`;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error al obtener facturas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- FUNCIÓN POST PARA CREAR Y ENVIAR ---
export async function POST(req: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await req.json();
    const { presupuesto_id, cliente_nombre, email, vehiculo, total, articulos, pdfBase64 } = body;

    // Validación extra para evitar errores de artículos vacíos
    if (!articulos || !Array.isArray(articulos) || articulos.length === 0) {
      return NextResponse.json({ error: "No hay artículos válidos para procesar la factura" }, { status: 400 });
    }

    const numero_factura = `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Guardar en DB (Usamos JSON.stringify para el campo de tipo JSON o TEXT)
    await sql`
      INSERT INTO facturas (numero_factura, presupuesto_id, cliente_nombre, vehiculo, total, articulos)
      VALUES (${numero_factura}, ${presupuesto_id}, ${cliente_nombre}, ${vehiculo}, ${Number(total)}, ${JSON.stringify(articulos)})
    `;

    // 2. Descontar Stock con protección de valores
    for (const item of articulos) {
      const cantidad = Number(item.cantidad);
      if (!isNaN(cantidad) && item.codigo) {
        await sql`
          UPDATE articulos 
          SET stock = stock - ${cantidad},
              stock_reservado = COALESCE(stock_reservado, 0) - ${cantidad}
          WHERE codigo = ${item.codigo}
        `;
      }
    }

    // 3. Actualizar estado del presupuesto original
    await sql`UPDATE presupuestos_pedidos SET estado = 'Facturado' WHERE id = ${presupuesto_id}`;

    // 4. Enviar Email vía Resend
    if (resend && pdfBase64 && email) {
      try {
        const base64Content = pdfBase64.split(",")[1];
        await resend.emails.send({
          from: "AJCAR 25 <onboarding@resend.dev>", // Cambia esto por tu dominio verificado cuando lo tengas
          to: email,
          subject: `Factura ${numero_factura} - AJCAR 25`,
          html: `
            <div style="font-family: sans-serif; color: #333;">
              <h2>Hola ${cliente_nombre},</h2>
              <p>Esperamos que estés satisfecho con el trabajo realizado en tu <strong>${vehiculo}</strong>.</p>
              <p>Adjuntamos la factura oficial <strong>${numero_factura}</strong> correspondiente a los servicios prestados.</p>
              <br/>
              <p>Atentamente,<br/>El equipo de AJCAR 25</p>
            </div>
          `,
          attachments: [{ filename: `${numero_factura}.pdf`, content: base64Content }],
        });
      } catch (e) {
        console.error("Error enviando email:", e);
        // No bloqueamos la respuesta aunque el email falle, la factura ya está creada
      }
    }

    return NextResponse.json({ success: true, numero: numero_factura });
  } catch (error: any) {
    console.error("Error crítico en proceso de factura:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}