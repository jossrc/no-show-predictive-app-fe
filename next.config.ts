import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: { useTypeScriptCli: true },
  // El indicador de Next.js es una herramienta técnica: solo acompaña a APP_ENV=development
  // (la presentación se resuelve en `src/lib/config/presentation.ts`; aquí no puede importarse).
  devIndicators: process.env.APP_ENV?.trim() === 'development' ? undefined : false,
};

export default nextConfig;
