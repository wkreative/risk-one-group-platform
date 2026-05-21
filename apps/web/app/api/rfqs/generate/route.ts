import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const rfqSchema = z.object({
  submissionId: z.string().min(3),
  insurerIds: z.array(z.string().min(3)).min(1)
});

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass }
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = rfqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { submissionId, insurerIds } = parsed.data;
  const submission = await prisma.submission.findUnique({ where: { id: submissionId }, include: { client: true } });
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const insurers = await prisma.insurer.findMany({ where: { id: { in: insurerIds } } });
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM ?? "operations@riskonegroup.com";
  const createdRfqs = [];

  for (const insurer of insurers) {
    const rfqDocument = `RFQ for ${submission.client.name} - ${submission.policyType}`;
    const rfq = await prisma.rfq.create({
      data: {
        submissionId,
        insurerId: insurer.id,
        documentUrl: `generated://${submissionId}/${insurer.id}.txt`,
        status: "DRAFT"
      }
    });

    if (!transporter) {
      createdRfqs.push(rfq);
      continue;
    }

    try {
      await transporter.sendMail({
        from,
        to: insurer.email,
        subject: `RFQ - ${submission.client.name} - ${submission.policyType}`,
        text: `${rfqDocument}\n\nPlease provide your quote response.`
      });

      const sent = await prisma.rfq.update({
        where: { id: rfq.id },
        data: { status: "SENT", emailSentTo: insurer.email }
      });
      createdRfqs.push(sent);
    } catch {
      createdRfqs.push(rfq);
    }
  }

  return NextResponse.json(createdRfqs, { status: 201 });
}
