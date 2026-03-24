import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nombre = (searchParams.get("nombre") || "").trim().toUpperCase();
    const apellido1 = (searchParams.get("apellido1") || searchParams.get("apellidos1") || "").trim().toUpperCase();
    const apellido2 = (searchParams.get("apellido2") || searchParams.get("apellidos2") || "").trim().toUpperCase();

    if (!nombre || !apellido1) return NextResponse.json({ existe: false });

    const sql = neon(process.env.DATABASE_URL!);
    const resultado = await sql`
      SELECT id, nombre, apellido1, apellido2, email, telefono, documento_identidad, tipo_cliente
      FROM usuarios 
      WHERE UPPER(TRIM(nombre)) = ${nombre} 
      AND UPPER(TRIM(apellido1)) = ${apellido1}
      AND (UPPER(TRIM(apellido2)) = ${apellido2} OR apellido2 IS NULL OR apellido2 = '')
      LIMIT 1
    `;

    return NextResponse.json({ existe: resultado.length > 0, usuario: resultado[0] || null });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al buscar usuario" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
    const sql = neon(process.env.DATABASE_URL);
    const body = await request.json();

    const nombre = (body.nombre || "").trim().toUpperCase();
    const apellido1 = (body.apellido1 || "").trim().toUpperCase(); 
    const apellido2 = (body.apellido2 || "").trim().toUpperCase();
    const email = (body.email || "").toLowerCase().trim();
    const telefono = (body.telefono || "").trim();
    const dni = (body.documento_identidad || `TEMP-${Date.now()}`).toUpperCase().trim();
    
    // Determinamos si es Empresa o Particular basado en el input
    const esEmpresa = (body.tipo_cliente || "").toUpperCase().includes("EMPRESA") || 
                      (body.tipo_cliente || "").toUpperCase().includes("AUTON");

    // Lista de formatos posibles que tu DB podría estar esperando (Prueba error)
    const opcionesIntentar = esEmpresa 
      ? ["Empresa", "EMPRESA", "empresa"] 
      : ["Particular", "PARTICULAR", "particular"];

    if (!nombre || !apellido1 || !email) {
      return NextResponse.json({ error: "Datos obligatorios faltantes" }, { status: 400 });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); 

    let nuevo = null;
    let ultimoError = "";

    // BUCLE DE INTENTOS: Probamos los 3 formatos hasta que uno no dé error de constraint
    for (const valorPrueba of opcionesIntentar) {
      try {
        nuevo = await sql`
          INSERT INTO usuarios (
            nombre, apellido1, apellido2, email, telefono, 
            documento_identidad, role, tipo_cliente, password_hash, 
            reset_token, reset_token_expires
          )
          VALUES (
            ${nombre}, ${apellido1}, ${apellido2}, ${email}, ${telefono}, 
            ${dni}, 'cliente', ${valorPrueba}, 'PENDING_SETUP', 
            ${resetToken}, ${expires}
          )
          RETURNING id
        `;
        if (nuevo) break; // Si tuvo éxito, salimos del bucle
      } catch (dbError: any) {
        ultimoError = dbError.message;
        if (dbError.message.includes("check constraint")) {
          continue; // Si es error de validación, probamos el siguiente formato
        } else {
          throw dbError; // Si es otro tipo de error (ej: email duplicado), paramos
        }
      }
    }

    if (!nuevo) {
      throw new Error(`La base de datos rechazó todos los formatos de tipo_cliente. Error: ${ultimoError}`);
    }

    // --- ENVÍO DE EMAIL ---
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (emailUser && emailPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: emailUser, pass: emailPass },
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const setupLink = `${baseUrl}/set-password?token=${resetToken}`;

      try {
        await transporter.sendMail({
          from: `"AJCAR 25" <${emailUser}>`,
          to: email,
          subject: "Configura tu acceso de cliente - AJCAR 25",
          html: `<div style="font-family:sans-serif;padding:20px;">
            <h2>Hola ${nombre},</h2>
            <p>Se ha creado tu ficha de cliente. Establece tu contraseña para acceder:</p>
            <a href="${setupLink}" style="background:#2563eb;color:white;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:bold;">ESTABLECER CONTRASEÑA</a>
          </div>`,
        });
      } catch (e) { console.error("Error email:", e); }
    }

    return NextResponse.json({ success: true, id: nuevo[0].id }, { status: 201 });

  } catch (error: any) {
    console.error("🔴 ERROR REGISTRO:", error.message);
    
    if (error.message.includes("unique constraint")) {
      return NextResponse.json({ error: "El DNI o Email ya existen." }, { status: 409 });
    }

    return NextResponse.json({ 
      error: "Error de servidor", 
      detalle: error.message 
    }, { status: 500 });
  }
}