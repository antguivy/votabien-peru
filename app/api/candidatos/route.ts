// app/api/legisladores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { publicApi } from '@/lib/public-api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extraer parámetros
    const params = {
      tipo: searchParams.get('tipo') || undefined,
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
    
    const candidatos = await publicApi.getCandidaturas(params);
    
    return NextResponse.json(candidatos);
  } catch (error) {
    console.error('Error en API route:', error);
    return NextResponse.json(
      { error: 'Error al obtener candidatos' },
      { status: 500 }
    );
  }
}