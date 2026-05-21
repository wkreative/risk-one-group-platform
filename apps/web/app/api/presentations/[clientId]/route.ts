import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: { clientId: string } }) {
  const presentations = await prisma.presentation.findMany({
    where: { clientId: context.params.clientId },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(presentations);
}
