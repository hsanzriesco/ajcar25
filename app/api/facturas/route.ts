// app/api/facturas/route.ts
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`
      SELECT * FROM facturas 
      ORDER BY fecha_emision DESC
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

    if (!final_id) {
      return NextResponse.json({ error: "Falta el ID del presupuesto/taller" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Falta el email del cliente" }, { status: 400 });
    }
    if (!pdfBase64) {
      return NextResponse.json({ error: "Falta el PDF en base64" }, { status: 400 });
    }
    if (!articulos || !Array.isArray(articulos) || articulos.length === 0) {
      return NextResponse.json({ error: "La lista de artículos no es válida" }, { status: 400 });
    }
    if (!cliente_nombre || !total) {
      return NextResponse.json({ error: "Faltan datos del cliente o total" }, { status: 400 });
    }

    const numero_factura = `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Insertar la factura con empleado_id
    await sql`
      INSERT INTO facturas (
        numero_factura, 
        presupuesto_id, 
        cliente_nombre, 
        vehiculo, 
        total, 
        articulos,
        empleado_id
      )
      VALUES (
        ${numero_factura}, 
        ${final_id}, 
        ${cliente_nombre}, 
        ${vehiculo || null}, 
        ${Number(total)}, 
        ${JSON.stringify(articulos)},
        ${empleado_id || null}
      )
    `;

    // Actualizar stock
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

    // Cambiar estado del presupuesto
    await sql`
      UPDATE presupuestos_pedidos 
      SET estado = 'Facturado' 
      WHERE id = ${final_id}
    `;

    // Envío de email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const base64Clean = pdfBase64.includes(",") ? pdfBase64.split(",")[1] : pdfBase64;

      const mailOptions = {
        from: `"AJCAR 25" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Factura Oficial ${numero_factura} - AJCAR 25`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px; border-top: 8px solid #2563eb;">
            <div style="text-align: center; margin-bottom: 20px;">
               <h2 style="color: #2563eb; margin: 0;">FACTURA DE SERVICIO</h2>
               <p style="text-transform: uppercase; font-size: 10px; letter-spacing: 2px; color: #999;">AJCAR 25 Taller Mecánico</p>
            </div>
            <p>Estimado/a <strong>${cliente_nombre}</strong>,</p>
            <p>Le informamos que el servicio para su vehículo <strong>${vehiculo || "—"}</strong> ha finalizado satisfactoriamente. Adjunto encontrará la factura oficial.</p>
            <div style="background-color: #f0f7ff; padding: 25px; border-radius: 15px; margin: 25px 0; text-align: center; border: 1px dashed #2563eb;">
              <p style="margin: 0; font-size: 12px; color: #1e40af; font-weight: bold; text-transform: uppercase;">Referencia Factura</p>
              <p style="margin: 5px 0; font-size: 24px; color: #2563eb; font-weight: 900;">${numero_factura}</p>
              <div style="margin-top: 15px; border-top: 1px solid rgba(37, 99, 235, 0.2); padding-top: 15px;">
                 <p style="margin: 10px 0 0 0; font-size: 12px; color: #1e40af;">IMPORTE TOTAL</p>
                 <p style="margin: 0; font-size: 32px; color: #16a34a; font-weight: 900;">${Number(total).toFixed(2)}€</p>
              </div>
            </div>
            <p style="font-size: 14px; color: #555; line-height: 1.5;">Este documento sirve como comprobante de pago y garantía.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center;">
              <p>Si tiene cualquier duda, responda a este email.</p>
              <p style="font-weight: bold; color: #333; margin-top: 10px;">Gracias por su confianza.</p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `Factura_${numero_factura}.pdf`,
            content: base64Clean,
            encoding: 'base64',
          },
        ],
      };

      await transporter.sendMail(mailOptions);
    }

    return NextResponse.json({ 
      success: true, 
      numero_factura,
      message: "Factura guardada, stock actualizado y email enviado correctamente." 
    });

  } catch (error: any) {
    console.error("❌ Error crítico en POST /api/facturas:", error);
    return NextResponse.json({ 
      error: error.message || "Error interno del servidor" 
    }, { status: 500 });
  }
}
