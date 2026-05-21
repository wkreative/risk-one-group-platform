# RISK ONE GROUP - Plataforma de Operaciones de Seguros

Proyecto full-stack en TypeScript para digitalizar el flujo completo de operaciones de seguros:

1. Captacion del cliente
2. Generador de solicitud de cotizacion (RFQ)
3. Generador de presentacion para cliente
4. Evaluacion de poliza emitida

## Stack

- Frontend: Next.js 14 + TypeScript
- Backend: Express + TypeScript
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

Si deseas envio real de correos, llena `SMTP_USER` y `SMTP_PASS` en `apps/api/.env`.

### 4) Preparar Prisma

```bash
npm run prisma:generate --workspace @rog/api
npm run prisma:migrate --workspace @rog/api -- --name init
```

### 5) Iniciar plataforma

En dos terminales:

```bash
npm run dev:api
npm run dev:web
```

Web: `http://localhost:3000`
API: `http://localhost:4000/health`

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
curl -X POST http://localhost:4000/api/auth/seed-demo
```

2. Login demo:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo@admin.com","password":"admin1236"}'
```

Credenciales demo:
- Username: `demo@admin.com`
- Password: `admin1236`

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
