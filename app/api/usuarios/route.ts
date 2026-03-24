import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
import nodemailer from "nodemailer";

/**
 * GET: Verifica si el usuario existe usando apellido1 y apellido2
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nombre = (searchParams.get("nombre") || "").trim().toUpperCase();
    const apellido1 = (searchParams.get("apellidos1") || "").trim().toUpperCase();
    const apellido2 = (searchParams.get("apellidos2") || "").trim().toUpperCase();

    if (!nombre || !apellido1) {
      return NextResponse.json({ existe: false });
    }

    const sql = neon(process.env.DATABASE_URL!);
    
    const resultado = await sql`
      SELECT id, nombre, apellido1, apellido2, email, telefono, documento_identidad
      FROM usuarios 
      WHERE UPPER(TRIM(nombre)) = ${nombre} 
      AND UPPER(TRIM(apellido1)) = ${apellido1}
      AND UPPER(TRIM(apellido2)) = ${apellido2}
      LIMIT 1
    `;

    return NextResponse.json({ 
      existe: resultado.length > 0, 
      usuario: resultado[0] || null 
    });

  } catch (error: any) {
    console.error("🔴 Error en GET usuarios:", error.message);
    return NextResponse.json({ error: "Error al buscar usuario" }, { status: 500 });
  }
}

/**
 * POST: Crea el usuario y envía correo real con Nodemailer
 */
export async function POST(request: Request) {
  try {
    // 1. Validar Variables de Entorno Críticas
    if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL en .env");
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) throw new Error("Faltan credenciales SMTP en .env");

    const sql = neon(process.env.DATABASE_URL);
    const body = await request.json();

    const nombre = (body.nombre || "").trim().toUpperCase();
    const apellido1 = (body.apellidos1 || "").trim().toUpperCase();
    const apellido2 = (body.apellidos2 || "").trim().toUpperCase();
    const email = (body.email || "").toLowerCase().trim();
    const telefono = (body.telefono || "").trim();
    const dni = (body.documento_identidad || `TEMP-${Date.now()}`).toUpperCase().trim();

    if (!nombre || !apellido1 || !email) {
      return NextResponse.json({ error: "Nombre, Apellido 1 y Email son obligatorios" }, { status: 400 });
    }

    // 2. Generar Token y expiración
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 3. Inserción en DB
    console.log("💾 Guardando usuario en DB...");
    const nuevo = await sql`
      INSERT INTO usuarios (
        nombre, apellido1, apellido2, email, telefono, 
        documento_identidad, role, esta_activo, tipo_cliente, 
        password_hash, reset_token, reset_token_expires
      )
      VALUES (
        ${nombre}, ${apellido1}, ${apellido2}, ${email}, ${telefono}, 
        ${dni}, 'user', true, 'particular', 
        'PENDING_SETUP', ${resetToken}, ${expires}
      )
      RETURNING id
    `;

    // 4. Configurar Transporter con validación de puerto
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Timeout para evitar que la API se quede colgada
      connectionTimeout: 10000, 
    });

    const setupLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/set-password?token=${resetToken}`;

    // 5. Envío de Email con bloque try-catch específico
    console.log(`📧 Intentando enviar email a ${email}...`);
    try {
      await transporter.sendMail({
        from: `"AJCAR 25" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Configura tu acceso - AJCAR 25",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
            <h2 style="color: #2563eb;">Hola, ${nombre}</h2>
            <p>Se ha creado tu cuenta de cliente en <strong>AJCAR 25</strong>.</p>
            <p>Por favor, establece tu contraseña para acceder a tus presupuestos:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${setupLink}" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                CONFIGURAR CONTRASEÑA
              </a>
            </div>
            <p style="font-size: 11px; color: #999;">Si el botón no funciona, copia este enlace: ${setupLink}</p>
          </div>
        `,
      });
      console.log("✅ Email enviado con éxito");
    } catch (mailError: any) {
      console.error("⚠️ Error crítico enviando email:", mailError.message);
      // Opcional: Podrías borrar al usuario de la DB aquí si quieres ser estricto
      return NextResponse.json({ 
        success: true, 
        id: nuevo[0].id, 
        mensaje: "Usuario creado, pero hubo un problema enviando el correo. Configúralo manualmente." 
      }, { status: 201 });
    }

    return NextResponse.json({
      success: true,
      id: nuevo[0].id,
      mensaje: "Usuario creado y correo enviado correctamente."
    }, { status: 201 });

  } catch (error: any) {
    console.error("🔴 ERROR EN POST /api/usuarios:", error.message);
    
    if (error.message.includes("unique constraint") || error.message.includes("already exists")) {
        return NextResponse.json({ error: "El Email o DNI ya está registrado" }, { status: 409 });
    }

    return NextResponse.json({ 
      error: "Error interno del servidor", 
      detalle: error.message 
    }, { status: 500 });
  }
}