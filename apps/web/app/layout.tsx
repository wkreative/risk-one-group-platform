import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RISK ONE GROUP | Plataforma de Operaciones de Seguros",
  description: "Plataforma de captacion, RFQ, presentacion y evaluacion de polizas."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
