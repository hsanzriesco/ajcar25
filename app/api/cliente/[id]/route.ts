import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = params.id;

  console.log("✅ API /cliente/[id] fue llamada correctamente con ID:", userId);

  // Respuesta temporal simple para probar
  return NextResponse.json({
    cliente: {
      id: userId,
      nombre: "Cliente de Prueba",
      email: "prueba@ajcar25.com"
    },
    presupuestos: [],
    facturas: []
  });
}