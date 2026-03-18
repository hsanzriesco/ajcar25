import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { neon } from "@neondatabase/serverless"; // Importamos Neon

export async function POST(req: Request) {
  try {
    const { id, email, nombre, pdfBase64, total, vehiculo, articulos } = await req.json();

    // 1. Validaciones de seguridad
    if (!id) {
      return NextResponse.json({ error: "El ID del presupuesto es obligatorio" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // --- BLOQUE DE BASE DE DATOS: GUARDAR LÍNEAS ---
    // Borramos líneas previas para evitar duplicados si se envía varias veces
    await sql`DELETE FROM lineas_presupuestos WHERE presupuesto_id = ${id}`;

    // Insertamos las líneas una a una (Línea 1, Línea 2...)
    if (articulos && Array.isArray(articulos)) {
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

    // Actualizamos el estado del presupuesto a "Enviado" en la tabla principal
    await sql`UPDATE presupuestos_pedidos SET estado = 'Presupuesto enviado' WHERE id = ${id}`;
    // ----------------------------------------------

    // 2. Configuración de Email (Nodemailer)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const base64Data = pdfBase64.split(",")[1];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const acceptUrl = `${baseUrl}/presupuesto/aceptar/${id}`; 

    const mailOptions = {
      from: `"AJCAR 25" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Presupuesto AJCAR 25 - ${vehiculo}`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
          <h2 style="color: #1e3a8a;">Hola, ${nombre}</h2>
          <p>Le adjuntamos el presupuesto detallado para su vehículo <strong>${vehiculo}</strong>.</p>
          <p style="font-size: 16px;"><strong>Total Presupuestado:</strong> <span style="font-size: 20px; color: #1e3a8a;">${total}€</span> (IVA incluido)</p>
          
          <div style="margin: 35px 0; text-align: center;">
            <p style="margin-bottom: 20px; font-size: 14px; color: #666;">Si está de acuerdo con el presupuesto, puede aceptarlo haciendo clic aquí:</p>
            
            <a href="${acceptUrl}" 
               style="background-color: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              ACEPTAR PRESUPUESTO ONLINE
            </a>
          </div>

          <p style="font-size: 13px; color: #888;">Si tiene dudas, puede responder a este correo o llamarnos directamente.</p>
          <br/>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #aaa; text-align: center;">AJCAR 25 - Taller Mecánico de Confianza</p>
        </div>
      `,
      attachments: [
        {
          filename: `Presupuesto_${vehiculo.replace(/\s+/g, '_')}.pdf`,
          content: base64Data,
          encoding: 'base64',
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "Guardado en DB y Correo enviado" });
  } catch (error: any) {
    console.error("Error en el proceso:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}