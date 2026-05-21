# RISK ONE GROUP - Plataforma de Operaciones de Seguros

Proyecto full-stack en TypeScript para digitalizar el flujo completo de operaciones de seguros.
El frontend y los endpoints API productivos viven en `apps/web` para despliegue directo en Vercel.

1. Captacion del cliente
2. Generador de solicitud de cotizacion (RFQ)
3. Generador de presentacion para cliente
4. Evaluacion de poliza emitida

## Stack

- Frontend: Next.js 14 + TypeScript
- Backend productivo (Vercel): Next.js Route Handlers + TypeScript
- Backend local opcional: Express + TypeScript
- Base de datos: PostgreSQL + Prisma ORM
- Integraciones: Nodemailer para envio de RFQ por correo

## Estructura

```
apps/
  api/   # API y logica de negocio
  web/   # Portal operacional
```

## Ejecutar de principio a fin

### 1) Instalar dependencias

```bash
npm install
```

### 2) Levantar PostgreSQL

```bash
docker compose up -d
```

### 3) Variables de entorno

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Si deseas envio real de correos, llena `SMTP_USER` y `SMTP_PASS` en `apps/web/.env.local`.

### 4) Preparar Prisma

```bash
npm run prisma:generate
npm run prisma:migrate --workspace @rog/api -- --name init
```

### 5) Iniciar plataforma

En una terminal (modo Vercel-like):

```bash
npm run dev:web
```

Web: `http://localhost:3000`
API: `http://localhost:3000/api/health`

Si quieres correr tambien el backend Express legacy:

```bash
npm run dev:api
```

## Flujo funcional

- Modulo 1: Completar datos del cliente y crear submission.
- Modulo 2: Sembrar aseguradoras y generar RFQ automatico.
- Modulo 3: Generar presentacion consolidada.
- Modulo 4: Evaluar texto de poliza y detectar faltantes/contradicciones.

## Endpoints principales

- `POST /api/auth/seed-demo`
- `POST /api/auth/login`
- `POST /api/submissions`
- `GET /api/submissions`
- `POST /api/insurers/seed`
- `GET /api/insurers`
- `POST /api/rfqs/generate`
- `POST /api/presentations`
- `GET /api/presentations/:clientId`
- `POST /api/policy-evaluations`
- `GET /api/policy-evaluations/:submissionId`

## Usuario demo

1. Crear usuario demo:

```bash
curl -X POST http://localhost:3000/api/auth/seed-demo
```

2. Login demo:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo@admin.com","password":"admin1236"}'
```

En Vercel cambia `localhost:3000` por tu dominio desplegado.

Credenciales demo:
- Username: `demo@admin.com`
- Password: `admin1236`

## Deploy en Vercel

1. Importa el repo `wkreative/risk-one-group-platform` en Vercel.
2. Framework detectado: `Next.js`.
3. Define Root Directory como `apps/web`.
4. Variables de entorno en Vercel Project Settings:
   - `DATABASE_URL`
   - `SMTP_HOST` (opcional)
   - `SMTP_PORT` (opcional)
   - `SMTP_USER` (opcional)
   - `SMTP_PASS` (opcional)
   - `SMTP_FROM` (opcional)
   - `NEXT_PUBLIC_API_URL` dejar vacio
5. Deploy.

Despues del primer deploy, crea el usuario demo:

```bash
curl -X POST https://TU_DOMINIO_VERCEL/api/auth/seed-demo
```

## Subir a GitHub

```bash
git init
git add .
git commit -m "feat: initial risk one group insurance operations platform"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/risk-one-group-platform.git
git push -u origin main
```

Si ya tienes repo creado en GitHub, reemplaza `TU_USUARIO` por tu cuenta.
