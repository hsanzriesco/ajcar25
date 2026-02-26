import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error("La variable DATABASE_URL no está definida en el archivo .env");
}

export const sql = neon(process.env.DATABASE_URL);