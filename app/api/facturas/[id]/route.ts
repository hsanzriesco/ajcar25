// app/api/facturas/[id]/route.ts
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params;
    console.log("🔍 [PDF] ID recibido:", paramId);

    const sql = neon(process.env.DATABASE_URL!);

    // Consulta simple
    const result = await sql`
      SELECT * FROM facturas 
      WHERE id = ${paramId} OR presupuesto_id = ${paramId}
      LIMIT 1
    `;

    console.log("📊 Filas encontradas:", result.length);

    if (result.length === 0) {
      console.log("❌ No se encontró la factura");
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    const factura = result[0];
    console.log("✅ Factura encontrada:", factura.numero_factura);

    // Parseo seguro de artículos
    let articulos: any[] = [];
    try {
      articulos = Array.isArray(factura.articulos) 
        ? factura.articulos 
        : JSON.parse(factura.articulos || "[]");
    } catch (e) {
      console.warn("⚠️ Error parseando artículos");
    }

    // === GENERACIÓN DEL PDF ===
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, pageWidth, 60, "F");

    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("AJCAR 25 - FACTURA", pageWidth / 2, 38, { align: "center" });

    doc.setFontSize(11);
    doc.text(`Nº: ${factura.numero_factura || "N/A"}`, 20, 75);
    doc.text(
      `Fecha: ${factura.fecha_emision ? new Date(factura.fecha_emision).toLocaleDateString("es-ES") : "Sin fecha"}`,
      pageWidth - 20,
      75,
      { align: "right" }
    );

    let y = 95;
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL CLIENTE", 20, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Cliente: ${factura.cliente_nombre || "Sin nombre"}`, 20, y); y += 7;
    doc.text(`Vehículo: ${factura.vehiculo || "—"}`, 20, y); y += 7;

    // Tabla
    const tableBody = articulos.map((art: any) => [
      art.descripcion || art.nombre || "Artículo",
      String(art.cantidad || 1),
      `${Number(art.precio_unitario || art.precio || 0).toFixed(2)}€`,
      `${(Number(art.cantidad || 1) * Number(art.precio_unitario || art.precio || 0)).toFixed(2)}€`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [["DESCRIPCIÓN", "CANT.", "PRECIO UN.", "TOTAL"]],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: [17, 24, 39], textColor: 255 },
      margin: { left: 20, right: 20 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || y + 40;

    doc.setFillColor(37, 99, 235);
    doc.rect(20, finalY, pageWidth - 40, 18, "F");

    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("TOTAL FACTURA", 25, finalY + 12);
    doc.text(
      `${Number(factura.total || 0).toFixed(2)}€`,
      pageWidth - 25,
      finalY + 12,
      { align: "right" }
    );

    const dataUri = doc.output("datauristring");
    const base64 = dataUri.split(",")[1];
    const pdfBuffer = Buffer.from(base64, "base64");

    console.log("✅ PDF generado correctamente");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Factura_${factura.numero_factura || paramId}.pdf"`,
      },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ ERROR EN ROUTE:", msg);
    return NextResponse.json({ error: "Error interno al generar la factura" }, { status: 500 });
  }
}