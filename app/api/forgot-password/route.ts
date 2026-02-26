import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email requerido" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // 1. Buscamos al usuario por su email
    const result = await sql`SELECT email FROM usuarios WHERE email = ${email} LIMIT 1`;

    if (result.length === 0) {
      return NextResponse.json(
        { message: "El correo electrónico no existe en nuestra base de datos." },
        { status: 404 }
      );
    }

    // 2. Generar token de seguridad y expiración (1 hora)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hora desde ahora

    // 3. Guardar el token en la tabla password_reset_tokens
    // Usamos ON CONFLICT para actualizar el token si el usuario ya pidió uno antes
    await sql`
      INSERT INTO password_reset_tokens (email, token, expires_at)
      VALUES (${email}, ${token}, ${expires})
      ON CONFLICT (email) 
      DO UPDATE SET token = ${token}, expires_at = ${expires}
    `;

    // 4. Configurar el transportador de Nodemailer (Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Tu contraseña de aplicación de 16 letras
      },
    });

    // Definimos la URL base (en desarrollo es localhost, en producción será tu dominio)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // 5. Enviar el correo real
    await transporter.sendMail({
      from: `"AJCAR 25" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Restablecer tu contraseña - AJCAR 25",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px;">
          <h2 style="color: #dc2626; text-align: center;">AJCAR 25</h2>
          <p style="color: #374151; font-size: 16px;">Hola,</p>
          <p style="color: #374151; line-height: 1.5;">Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            Este enlace es válido por 1 hora. Si no solicitaste este cambio, puedes ignorar este correo.
          </p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: "Se ha enviado un correo con las instrucciones." },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error en forgot-password API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor al procesar el envío." },
      { status: 500 }
    );
  }
}