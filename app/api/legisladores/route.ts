// app/api/legisladores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { publicApi } from '@/lib/public-api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extraer parámetros
    const params = {
      es_legislador_activo: true,
      camara: searchParams.get('camara') || undefined,
      search: searchParams.get('search') || undefined,
      partidos: searchParams.getAll('partidos').length > 0 
        ? searchParams.getAll('partidos') 
        : undefined,
      distritos: searchParams.getAll('distritos').length > 0 
        ? searchParams.getAll('distritos') 
        : undefined,
      skip: parseInt(searchParams.get('skip') || '0'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    const legisladores = await publicApi.getPersonas(params);
    
    return NextResponse.json(legisladores);
  } catch (error) {
    console.error('Error en API route:', error);
    return NextResponse.json(
      { error: 'Error al obtener legisladores' },
      { status: 500 }
    );
  }
}