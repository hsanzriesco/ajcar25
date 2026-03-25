import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const dni = (searchParams.get("dni") || "").trim().toUpperCase();
    const nombre = (searchParams.get("nombre") || "").trim().toUpperCase();
    const apellido1 = (searchParams.get("apellido1") || searchParams.get("apellidos1") || "").trim().toUpperCase();
    const apellido2 = (searchParams.get("apellido2") || searchParams.get("apellidos2") || "").trim().toUpperCase();

    const sql = neon(process.env.DATABASE_URL!);

    let resultado;

    if (dni) {
      resultado = await sql`
        SELECT id, nombre, apellido1, apellido2, email, telefono, documento_identidad, tipo_cliente
        FROM usuarios 
        WHERE UPPER(TRIM(documento_identidad)) = ${dni}
        LIMIT 1
      `;
    } else if (nombre && apellido1) {
      resultado = await sql`
        SELECT id, nombre, apellido1, apellido2, email, telefono, documento_identidad, tipo_cliente
        FROM usuarios 
        WHERE UPPER(TRIM(nombre)) = ${nombre} 
        AND UPPER(TRIM(apellido1)) = ${apellido1}
        AND (UPPER(TRIM(apellido2)) = ${apellido2} OR apellido2 IS NULL OR apellido2 = '')
        LIMIT 1
      `;
    } else {
      return NextResponse.json({ existe: false });
    }

    const existe = resultado.length > 0;

    return NextResponse.json({ 
      existe, 
      usuario: existe ? resultado[0] : null 
    });

  } catch (error: any) {
    console.error("Error en GET /api/usuarios:", error);
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
    const dni = (body.documento_identidad || "").trim().toUpperCase();

    if (!nombre || !apellido1 || !email || !dni) {
      return NextResponse.json({ error: "Nombre, apellidos, email y DNI son obligatorios" }, { status: 400 });
    }

    // Verificar si ya existe el DNI
    const existeDNI = await sql`
      SELECT id FROM usuarios 
      WHERE UPPER(TRIM(documento_identidad)) = ${dni}
      LIMIT 1
    `;

    if (existeDNI.length > 0) {
      return NextResponse.json({ error: "Ya existe un cliente con ese DNI" }, { status: 409 });
    }

    // ✅ CORREGIDO: Usamos exactamente los valores que acepta la constraint de la BD
    const tipoClienteFinal = (body.tipo_cliente || "").toLowerCase().trim() === "empresa" 
      ? "empresa" 
      : "particular";

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); 

    const nuevo = await sql`
      INSERT INTO usuarios (
        nombre, apellido1, apellido2, email, telefono, 
        documento_identidad, role, tipo_cliente, password_hash, 
        reset_token, reset_token_expires
      )
      VALUES (
        ${nombre}, ${apellido1}, ${apellido2}, ${email}, ${telefono}, 
        ${dni}, 'cliente', ${tipoClienteFinal}, 'PENDING_SETUP', 
        ${resetToken}, ${expires}
      )
      RETURNING id, nombre, apellido1, apellido2, email, telefono, documento_identidad, tipo_cliente
    `;

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
      } catch (e) { console.error("Error enviando email:", e); }
    }

    return NextResponse.json({ 
      success: true, 
      id: nuevo[0].id,
      usuario: nuevo[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error("🔴 ERROR REGISTRO:", error.message);
    
    if (error.message.includes("unique constraint")) {
      return NextResponse.json({ error: "El DNI o el Email ya existen." }, { status: 409 });
    }

    return NextResponse.json({ 
      error: "Error de servidor", 
      detalle: error.message 
    }, { status: 500 });
  }
}