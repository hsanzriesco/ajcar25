import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// --- NUEVA FUNCIÓN GET PARA VER EL HISTORIAL ---
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

// --- TU FUNCIÓN POST PARA CREAR Y ENVIAR ---
export async function POST(req: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await req.json();
    const { presupuesto_id, cliente_nombre, email, vehiculo, total, articulos, pdfBase64 } = body;

    const numero_factura = `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Guardar en DB
    await sql`
      INSERT INTO facturas (numero_factura, presupuesto_id, cliente_nombre, vehiculo, total, articulos)
      VALUES (${numero_factura}, ${presupuesto_id}, ${cliente_nombre}, ${vehiculo}, ${total}, ${JSON.stringify(articulos)})
    `;

    // 2. Descontar Stock
    if (articulos && Array.isArray(articulos)) {
      for (const item of articulos) {
        await sql`
          UPDATE articulos 
          SET stock = stock - ${Number(item.cantidad)},
              stock_reservado = stock_reservado - ${Number(item.cantidad)}
          WHERE codigo = ${item.codigo}
        `;
      }
    }

    // 3. Actualizar presupuesto
    await sql`UPDATE presupuestos_pedidos SET estado = 'Facturado' WHERE id = ${presupuesto_id}`;

    // 4. Enviar Email
    if (resend && pdfBase64 && email) {
      try {
        const base64Content = pdfBase64.split(",")[1];
        await resend.emails.send({
          from: "AJCAR 25 <onboarding@resend.dev>", 
          to: email,
          subject: `Factura ${numero_factura} - AJCAR 25`,
          html: `<p>Hola ${cliente_nombre}, adjuntamos la factura de tu ${vehiculo}.</p>`,
          attachments: [{ filename: `${numero_factura}.pdf`, content: base64Content }],
        });
      } catch (e) {
        console.error("Error enviando email:", e);
      }
    }

    return NextResponse.json({ success: true, numero: numero_factura });
  } catch (error: any) {
    console.error("Error crítico:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}