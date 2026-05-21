import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const intakeSchema = z.object({
  client: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    businessType: z.string().min(2)
  }),
  policyType: z.string().min(2),
  payload: z.record(z.any())
});

export async function POST(request: Request) {
  const body = await request.json();
  const result = intakeSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { client, policyType, payload } = result.data;
  const dbClient = await prisma.client.upsert({
    where: { email: client.email },
    update: { name: client.name, businessType: client.businessType },
    create: client
  });

  const submission = await prisma.submission.create({
    data: {
      clientId: dbClient.id,
      policyType,
      payload,
      status: "SUBMITTED"
    },
    include: { client: true }
  });

  return NextResponse.json(submission, { status: 201 });
}

export async function GET() {
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true }
  });
  return NextResponse.json(submissions);
}
