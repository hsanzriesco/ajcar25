import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();
    
    // 1. Normalización de datos
    const nombre = (body.nombre || "NUEVO").toUpperCase().trim();
    const apellidos = (body.apellidos || "CLIENTE").toUpperCase().trim();
    const email = body.email?.toLowerCase().trim() || `cliente_${Date.now()}@ajcar25.com`;
    const telefono = body.telefono || "";

    // 2. Verificación previa para evitar duplicados y errores 500
    const existe = await sql`
      SELECT id FROM usuarios 
      WHERE UPPER(nombre) = ${nombre} AND UPPER(apellidos) = ${apellidos}
      LIMIT 1
    `;

    if (existe.length > 0) {
      return NextResponse.json({ 
        success: true, 
        id: existe[0].id, 
        mensaje: "Usuario ya existente recuperado" 
      }, { status: 200 });
    }

    // 3. Inserción con el valor de ENUM corregido
    // Basado en tu error, el ENUM 'user_role' espera mayúsculas o un término específico.
    // Probamos con 'CLIENTE' que coincide con el estilo de tus otros campos.
    const nuevo = await sql`
      INSERT INTO usuarios (
        nombre, 
        apellidos, 
        email, 
        telefono, 
        role, 
        password_hash, 
        esta_activo,
        tipo_cliente
      )
      VALUES (
        ${nombre}, 
        ${apellidos}, 
        ${email}, 
        ${telefono}, 
        'CLIENTE', 
        'provisional_hash_123', 
        true,
        'particular'
      )
      RETURNING id
    `;

    return NextResponse.json({ 
      success: true, 
      id: nuevo[0].id 
    }, { status: 201 });

  } catch (error: any) {
    console.error("DETALLE ERROR SQL:", error.message);

    // Si el error persiste por el ENUM, lo capturamos para informarte
    if (error.message.includes("user_role")) {
      return NextResponse.json({ 
        error: "Error de Rol (ENUM)", 
        detalle: "El valor 'CLIENTE' no es aceptado por el ENUM user_role. Revisa los valores permitidos en Neon.",
        sugerencia: "Ejecuta en Neon: SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enum_typid = pg_type.oid WHERE pg_type.typname = 'user_role';"
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: "Error en base de datos", 
      detalle: error.message 
    }, { status: 500 });
  }
}