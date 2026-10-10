import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Por ahora dejamos que pasen todas las peticiones (dummy middleware).
  // Cuando montemos Supabase, aquí pondremos la lógica para bloquear las zonas privadas.
  return NextResponse.next();
}

export const config = {
  // Le decimos al middleware que se ejecute en todas las rutas, 
  // EXCEPTO en los archivos estáticos de Next (imágenes, CSS, etc)
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
