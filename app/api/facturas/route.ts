import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`
      SELECT 
        f.id, f.numero_factura, f.presupuesto_id, f.cliente_nombre,
        f.vehiculo, f.total, f.articulos, f.fecha_emision, 
        f.email, f.empleado_id,
        p.matricula
      FROM facturas f
      LEFT JOIN presupuestos_pedidos p ON f.presupuesto_id = p.id::text
      ORDER BY f.fecha_emision DESC
    `;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error al obtener facturas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await req.json();

    const { 
      presupuesto_id, 
      taller_id,
      cliente_nombre, 
      email, 
      vehiculo, 
      total, 
      articulos, 
      pdfBase64,
      empleado_id
    } = body;

    const final_id = presupuesto_id || taller_id;

    if (!final_id) return NextResponse.json({ error: "Falta el ID del presupuesto/taller" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "Falta el email del cliente" }, { status: 400 });
    if (!pdfBase64) return NextResponse.json({ error: "Falta el PDF en base64" }, { status: 400 });
    if (!articulos || !Array.isArray(articulos) || articulos.length === 0) return NextResponse.json({ error: "La lista de artículos no es válida" }, { status: 400 });
    if (!cliente_nombre || !total) return NextResponse.json({ error: "Faltan datos del cliente o total" }, { status: 400 });

    const numero_factura = `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await sql`
      INSERT INTO facturas (
        numero_factura, presupuesto_id, cliente_nombre, 
        vehiculo, total, articulos, empleado_id
      )
      VALUES (
        ${numero_factura}, ${final_id}, ${cliente_nombre}, 
        ${vehiculo || null}, ${Number(total)}, ${JSON.stringify(articulos)},
        ${empleado_id || null}
      )
    `;

    for (const item of articulos) {
      const cant = Number(item.cantidad);
      if (!isNaN(cant) && item.codigo) {
        await sql`
          UPDATE articulos 
          SET stock = stock - ${cant},
              stock_reservado = GREATEST(0, COALESCE(stock_reservado, 0) - ${cant})
          WHERE codigo = ${item.codigo}
        `;
      }
    }

    await sql`
      UPDATE presupuestos_pedidos 
      SET estado = 'Facturado' 
      WHERE id::text = ${final_id}
    `;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      const base64Clean = pdfBase64.includes(",") ? pdfBase64.split(",")[1] : pdfBase64;

      await transporter.sendMail({
        from: `"AJCAR 25" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Factura Oficial ${numero_factura} - AJCAR 25`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px; border-top: 8px solid #2563eb;">
            <h2 style="color: #2563eb;">FACTURA DE SERVICIO</h2>
            <p>Estimado/a <strong>${cliente_nombre}</strong>,</p>
            <p>El servicio para su vehículo <strong>${vehiculo || "—"}</strong> ha finalizado. Adjunto encontrará la factura oficial.</p>
            <div style="background:#f0f7ff;padding:25px;border-radius:15px;margin:25px 0;text-align:center;border:1px dashed #2563eb;">
              <p style="font-size:24px;color:#2563eb;font-weight:900;margin:0">${numero_factura}</p>
              <p style="font-size:32px;color:#16a34a;font-weight:900;margin:10px 0 0">${Number(total).toFixed(2)}€</p>
            </div>
            <p>Gracias por su confianza.</p>
          </div>
        `,
        attachments: [{
          filename: `Factura_${numero_factura}.pdf`,
          content: base64Clean,
          encoding: 'base64',
        }],
      });
    }

    return NextResponse.json({ 
      success: true, 
      numero_factura,
      message: "Factura guardada, stock actualizado y email enviado correctamente." 
    });

  } catch (error: any) {
    console.error("Error crítico en POST /api/facturas:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
