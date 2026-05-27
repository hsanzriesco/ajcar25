import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { neon } from "@neondatabase/serverless";

// Guarda las líneas del presupuesto en la BD, actualiza su estado y envía el PDF al cliente por email
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, nombre, pdfBase64, total, vehiculo, articulos } = body;

    // Validación de campos mínimos necesarios para continuar
    if (!id || !email || !pdfBase64) {
      return NextResponse.json({ error: "Faltan datos requeridos (ID, Email o PDF)" }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      console.error("CRÍTICO: DATABASE_URL no está definida en .env");
      return NextResponse.json({ error: "Error de configuración de base de datos" }, { status: 500 });
    }

    const sql = neon(process.env.DATABASE_URL);

    // BLOQUE DE BASE DE DATOS
    try {
      // Borra las líneas anteriores del presupuesto para evitar duplicados al reenviar
      await sql`DELETE FROM lineas_presupuestos WHERE presupuesto_id = ${id}`;

      // Inserta cada artículo como una línea del presupuesto
      if (articulos && Array.isArray(articulos) && articulos.length > 0) {
        for (const art of articulos) {
          await sql`
            INSERT INTO lineas_presupuestos (
              presupuesto_id, 
              articulo_codigo, 
              descripcion, 
              cantidad, 
              precio_unitario
            ) VALUES (
              ${id}, 
              ${art.codigo}, 
              ${art.descripcion}, 
              ${art.cantidad}, 
              ${art.precio_unitario}
            )
          `;
        }
      }

      // Marca el presupuesto como enviado al cliente
      await sql`UPDATE presupuestos_pedidos SET estado = 'Presupuesto enviado' WHERE id = ${id}`;
    } catch (dbError: any) {
      console.error("ERROR NEON DB:", dbError);
      return NextResponse.json({ error: "Fallo en base de datos: " + dbError.message }, { status: 500 });
    }

    // BLOQUE DE EMAIL
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Credenciales de Gmail no configuradas");
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Elimina el encabezado data:application/pdf;base64, si está presente
      const base64Data = pdfBase64.includes(",") ? pdfBase64.split(",")[1] : pdfBase64;

      // URL de la página donde el cliente puede aceptar o rechazar el presupuesto
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const acceptUrl = `${baseUrl}/presupuesto/aceptar/${id}`;

      const mailOptions = {
        from: `"AJCAR 25" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Presupuesto AJCAR 25 - ${vehiculo || "Revisión"}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
            <h2 style="color: #2563eb;">Hola, ${nombre}</h2>
            <p>Se ha generado el presupuesto para su vehículo <strong>${vehiculo}</strong>.</p>
            <p style="font-size: 18px;">Total: <strong>${total}€</strong></p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${acceptUrl}" style="background-color: #22c55e; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">ACEPTAR PRESUPUESTO ONLINE</a>
            </div>
            <p style="font-size: 11px; color: #999;">Adjuntamos el desglose en PDF.</p>
          </div>
        `,
        // El PDF se adjunta en base64 directamente desde el frontend sin leer el disco
        attachments: [
          {
            filename: `Presupuesto_${id.substring(0, 6)}.pdf`,
            content: base64Data,
            encoding: 'base64',
          },
        ],
      };

      await transporter.sendMail(mailOptions);
    } catch (mailError: any) {
      console.error("ERROR NODEMAILER:", mailError);
      return NextResponse.json({ error: "Fallo al enviar correo: " + mailError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "OK" });

  } catch (error: any) {
    console.error("ERROR GLOBAL API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
