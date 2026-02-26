import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      tipoRegistro, 
      nombre, 
      apellido1, 
      apellido2, 
      nombreEmpresa, 
      direccion, 
      dni, 
      email, 
      password, 
      telefono 
    } = body;

    // 1. Verificar si el usuario ya existe (Email o DNI/CIF)
    // Esto evita duplicados antes de intentar la inserción
    const existingUser = await sql`
      SELECT id FROM usuarios 
      WHERE email = ${email} OR documento_identidad = ${dni} 
      LIMIT 1
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: "El email o el documento (DNI/CIF) ya están registrados." },
        { status: 400 }
      );
    }

    // 2. Encriptar contraseña (Coste de hash: 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insertar en Neon incluyendo la nueva columna 'role'
    // Importante: El orden de las columnas debe coincidir exactamente con los VALUES
    await sql`
      INSERT INTO usuarios (
        tipo_cliente, 
        documento_identidad, 
        nombre, 
        apellido1, 
        apellido2, 
        nombre_empresa, 
        direccion_fiscal, 
        email, 
        telefono, 
        password_hash,
        role
      ) VALUES (
        ${tipoRegistro}, 
        ${dni}, 
        ${tipoRegistro === 'particular' ? nombre : null},
        ${tipoRegistro === 'particular' ? apellido1 : null},
        ${tipoRegistro === 'particular' ? apellido2 : null},
        ${tipoRegistro === 'empresa' ? nombreEmpresa : null},
        ${tipoRegistro === 'empresa' ? direccion : null},
        ${email}, 
        ${telefono}, 
        ${hashedPassword},
        'Cliente'
      )
    `;

    return NextResponse.json({ message: "¡Registro exitoso!" }, { status: 201 });

  } catch (error) {
    // Logueamos el error en la terminal para poder depurar
    console.error("Error en el registro:", error);
    
    return NextResponse.json(
      { message: "Error interno en el servidor al procesar el registro" }, 
      { status: 500 }
    );
  }
}