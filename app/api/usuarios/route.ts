import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { searchParams } = new URL(request.url);

    const dni = searchParams.get("dni")?.trim().toUpperCase();

    if (!dni) {
      return NextResponse.json({ existe: false, motivo: "Falta el DNI" });
    }

    const usuarios = await sql`
      SELECT id, nombre, apellido1, apellido2, email, telefono, documento_identidad, tipo_cliente
      FROM usuarios 
      WHERE TRIM(UPPER(documento_identidad)) = ${dni}
      LIMIT 1
    `;

    const existe = usuarios.length > 0;

    return NextResponse.json({
      existe,
      usuario: existe ? usuarios[0] : null
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error en /api/usuarios GET:", error.message);
    return NextResponse.json({ error: error.message, existe: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();

    const { nombre, apellido1, apellido2, email, telefono, documento_identidad, tipo_cliente } = body;

    if (!nombre || !email || !documento_identidad) {
      return NextResponse.json({ error: "Nombre, email y documento_identidad son obligatorios" }, { status: 400 });
    }

    // Verificar si ya existe un usuario con ese documento o email
    const existente = await sql`
      SELECT id FROM usuarios 
      WHERE TRIM(UPPER(documento_identidad)) = ${documento_identidad.trim().toUpperCase()}
      OR TRIM(LOWER(email)) = ${email.trim().toLowerCase()}
      LIMIT 1
    `;

    if (existente.length > 0) {
      return NextResponse.json({ error: "Ya existe un usuario con ese DNI o email" }, { status: 409 });
    }

    // Contraseña por defecto temporal: se sustituirá cuando el cliente establezca la suya desde el email
    const passwordDefault = "Ajcar25&";
    const password_hash = await bcrypt.hash(passwordDefault, 10);

    // Token de activación para que el cliente establezca su propia contraseña (válido 48 horas)
    const tokenActivacion = crypto.randomBytes(32).toString("hex");
    const tokenExpira = new Date(Date.now() + 48 * 3600000);
    const correoNormalizado = email.trim().toLowerCase();

    const resultado = await sql`
      INSERT INTO usuarios (nombre, apellido1, apellido2, email, telefono, documento_identidad, tipo_cliente, role, esta_activo, password_hash, reset_token, reset_token_expires)
      VALUES (
        ${nombre.trim().toUpperCase()},
        ${(apellido1 || "").trim().toUpperCase()},
        ${(apellido2 || "").trim().toUpperCase()},
        ${correoNormalizado},
        ${(telefono || "").trim()},
        ${documento_identidad.trim().toUpperCase()},
        ${(tipo_cliente || "particular").toLowerCase()},
        'cliente',
        true,
        ${password_hash},
        ${tokenActivacion},
        ${tokenExpira}
      )
      RETURNING id, nombre, email
    `;

    // Envía el correo de activación con el enlace para establecer la contraseña.
    // Si el envío falla NO se aborta el alta: el usuario queda creado y se informa con emailEnviado=false.
    let emailEnviado = false;
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const activacionLink = `${baseUrl}/set-password?token=${tokenActivacion}`;

        await transporter.sendMail({
          from: `"AJCAR 25" <${process.env.EMAIL_USER}>`,
          to: correoNormalizado,
          subject: "Activa tu cuenta - AJCAR 25",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; padding: 24px; border-radius: 12px; border-top: 8px solid #2563eb;">
              <h2 style="color: #2563eb; text-align: center; margin-top: 0;">AJCAR 25</h2>
              <p style="color: #374151; font-size: 16px;">Hola ${nombre.trim()},</p>
              <p style="color: #374151; line-height: 1.6;">Se ha creado una cuenta para ti en AJCAR 25 para que puedas consultar tu presupuesto y acceder a tu área de cliente. Para empezar, establece tu contraseña pulsando el botón:</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${activacionLink}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Establecer mi contraseña
                </a>
              </div>
              <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><span style="color:#2563eb; word-break: break-all;">${activacionLink}</span></p>
              <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">Este enlace es válido durante 48 horas.</p>
            </div>
          `,
        });
        emailEnviado = true;
      }
    } catch (mailError) {
      console.error("Error enviando email de activación:", mailError);
    }

    return NextResponse.json({ success: true, usuario: resultado[0], emailEnviado }, { status: 201 });

  } catch (error: any) {
    console.error("Error en /api/usuarios POST:", error.message);
    return NextResponse.json({ error: error.message, detalle: error.detail }, { status: 500 });
  }
}
