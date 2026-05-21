import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";

const authRouter = Router();

const loginSchema = z.object({
  username: z.string().email(),
  password: z.string().min(8)
});

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");
  if (derived.length !== keyBuffer.length) return false;
  return timingSafeEqual(derived, keyBuffer);
}

authRouter.post("/auth/seed-demo", async (_req, res) => {
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

  return res.status(201).json({
    id: user.id,
    username: user.username,
    role: user.role,
    message: "Demo user created or updated"
  });
});

authRouter.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  return res.json({ id: user.id, username: user.username, role: user.role });
});

export { authRouter };
