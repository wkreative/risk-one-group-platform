import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const seeds = [
    { name: "Aseguradora Atlas", email: "rfq@atlas.com", rfqTemplate: "standard" },
    { name: "Proteccion Segura", email: "cotizaciones@proteccion.com", rfqTemplate: "enterprise" },
    { name: "Global Coverage", email: "underwriting@globalcoverage.com", rfqTemplate: "premium" }
  ];
  const created = [];
  for (const insurer of seeds) {
    const item = await prisma.insurer.upsert({
      where: { name: insurer.name },
      update: insurer,
      create: insurer
    });
    created.push(item);
  }
  return NextResponse.json(created, { status: 201 });
}
