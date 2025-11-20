/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "http://localhost:9002"
  ],
  turbopack: {
    // Silencia la advertencia sobre la raíz del espacio de trabajo
    root: __dirname,
  },
  experimental: {
    // El objeto experimental ahora puede quedar vacío o ser eliminado si no se usa
  },
};

module.exports = nextConfig;