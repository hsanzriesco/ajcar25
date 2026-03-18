import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const data = await sql`SELECT * FROM facturas ORDER BY fecha_emision DESC`;
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
      cliente_nombre, 
      email, 
      vehiculo, 
      total, 
      articulos, 
      pdfBase64 
    } = body;

    // 1. VALIDACIONES CRÍTICAS
    if (!presupuesto_id || !email || !pdfBase64) {
      return NextResponse.json({ error: "Faltan datos obligatorios (ID, Email o PDF)" }, { status: 400 });
    }

    if (!articulos || !Array.isArray(articulos)) {
      return NextResponse.json({ error: "Artículos no válidos" }, { status: 400 });
    }

    // Generamos un número de factura único
    const numero_factura = `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. GUARDAR EN BASE DE DATOS
    await sql`
      INSERT INTO facturas (numero_factura, presupuesto_id, cliente_nombre, vehiculo, total, articulos)
      VALUES (
        ${numero_factura}, 
        ${presupuesto_id}, 
        ${cliente_nombre}, 
        ${vehiculo}, 
        ${Number(total)}, 
        ${JSON.stringify(articulos)}
      )
    `;

    // 3. ACTUALIZAR STOCK Y ESTADO DEL PRESUPUESTO
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

    // Cambiamos el estado del presupuesto original a 'Facturado'
    await sql`UPDATE presupuestos_pedidos SET estado = 'Facturado' WHERE id = ${presupuesto_id}`;

    // 4. ENVÍO DE EMAIL CON NODEMAILER (Igual que el presupuesto)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Limpiamos el base64 para el adjunto
    const base64Clean = pdfBase64.includes(",") ? pdfBase64.split(",")[1] : pdfBase64;

    const mailOptions = {
      from: `"AJCAR 25" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Factura Oficial ${numero_factura} - AJCAR 25`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px; border-top: 8px solid #7e22ce;">
          <h2 style="color: #7e22ce;">Factura Generada con Éxito</h2>
          <p>Hola, <strong>${cliente_nombre}</strong>.</p>
          <p>Le adjuntamos la factura oficial correspondiente a los trabajos realizados en su vehículo <strong>${vehiculo}</strong>.</p>
          
          <div style="background-color: #f3e8ff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #6b21a8; font-weight: bold;">NÚMERO DE FACTURA</p>
            <p style="margin: 5px 0; font-size: 22px; color: #7e22ce; font-weight: 900;">${numero_factura}</p>
            <p style="margin: 15px 0 0 0; font-size: 14px; color: #6b21a8;">TOTAL A PAGAR</p>
            <p style="margin: 0; font-size: 28px; color: #16a34a; font-weight: 900;">${Number(total).toFixed(2)}€</p>
          </div>

          <p style="font-size: 14px; color: #666;">El documento PDF adjunto contiene el desglose detallado de piezas y mano de obra.</p>
          <p style="font-size: 13px; color: #888; margin-top: 30px;">Gracias por confiar en nuestros servicios. Guarde este documento para su garantía.</p>
          
          <br/>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 11px; color: #aaa; text-align: center;">AJCAR 25 - Taller de Mecánica Avanzada</p>
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

    return NextResponse.json({ 
      success: true, 
      numero: numero_factura,
      message: "Factura guardada, stock actualizado y email enviado." 
    });

  } catch (error: any) {
    console.error("Error crítico en API facturas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}