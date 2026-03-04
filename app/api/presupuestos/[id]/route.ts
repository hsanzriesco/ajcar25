import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } } 
) {
  try {
    // 1. Resolver parámetros (maneja tanto Promise como objeto plano)
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();
    const { estado } = body;

    // 2. Validaciones básicas
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "ID no válido" }, { status: 400 });
    }

    if (!estado) {
      return NextResponse.json({ error: "El estado es requerido" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // 3. Ejecutar actualización con el nombre de tabla CORRECTO
    // Se cambia 'presupuestos' por 'presupuestos_pedidos'
    const resultado = await sql`
      UPDATE presupuestos_pedidos 
      SET estado = ${estado} 
      WHERE id = ${id}
      RETURNING *;
    `;

    // 4. Verificar si se encontró el registro
    if (resultado.length === 0) {
      return NextResponse.json({ 
        error: `No se encontró el presupuesto con ID: ${id}` 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Estado actualizado correctamente",
      data: resultado[0] 
    });

  } catch (error: any) {
    console.error("ERROR EN API PATCH:", error.message);
    
    // Error específico si la tabla no existe (por seguridad)
    if (error.message.includes("relation") && error.message.includes("does not exist")) {
      return NextResponse.json({ 
        error: "Error de configuración: La tabla 'presupuestos_pedidos' no fue encontrada en la base de datos.",
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: "Error interno del servidor", 
      details: error.message 
    }, { status: 500 });
  }
}