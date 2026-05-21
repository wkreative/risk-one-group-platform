import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await prisma.user.upsert({
    where: { username: "demo@admin.com" },
    update: {
      passwordHash: hashPassword("admin1236"),
      role: "ADMIN"
    },
    create: {
      username: "demo@admin.com",
      passwordHash: hashPassword("admin1236"),
      role: "ADMIN"
    }
  });

  return NextResponse.json(
    { id: user.id, username: user.username, role: user.role, message: "Demo user created or updated" },
    { status: 201 }
  );
}
