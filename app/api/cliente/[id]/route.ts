import { NextRequest, NextResponse } from 'next/server';

// 1. Define que params es una Promesa
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> } 
) {
  // 2. Espera a que la promesa se resuelva
  const { id } = await params;

  // Tu lógica actual...
  const cliente = { id, nombre: "Ejemplo", email: "test@test.com" }; 

  return NextResponse.json({ 
    cliente, 
    presupuestos: [], 
    facturas: [] 
  });
}