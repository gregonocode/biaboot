import { NextResponse } from 'next/server';
import { evolutionFetch } from '@/lib/evolution/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

type EvolutionConnectionStateResponse = {
  instance?: {
    instanceName?: string;
    state?: string;
    status?: string;
  };
  state?: string;
  status?: string;
};

function normalizeStatus(state?: string | null) {
  const value = String(state ?? '').toLowerCase();

  if (
    value.includes('open') ||
    value.includes('connected') ||
    value.includes('conectado')
  ) {
    return 'conectado';
  }

  if (
    value.includes('connecting') ||
    value.includes('qrcode') ||
    value.includes('pairing')
  ) {
    return 'conectando';
  }

  if (
    value.includes('close') ||
    value.includes('disconnected') ||
    value.includes('desconectado')
  ) {
    return 'desconectado';
  }

  return 'conectando';
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const instanciaId = url.searchParams.get('instanciaId');

    if (!instanciaId) {
      return NextResponse.json(
        { error: 'Informe a instancia.' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuario nao autenticado.' },
        { status: 401 },
      );
    }

    const admin = createAdminClient();

    const { data: usuario, error: usuarioError } = await admin
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (usuarioError || !usuario) {
      return NextResponse.json(
        { error: 'Perfil do usuario nao encontrado.' },
        { status: 404 },
      );
    }

    const { data: instancia, error: instanciaError } = await admin
      .from('whatsapp_instancias')
      .select('*')
      .eq('id', instanciaId)
      .eq('user_id', usuario.id)
      .single();

    if (instanciaError || !instancia) {
      return NextResponse.json(
        { error: 'Instancia nao encontrada.' },
        { status: 404 },
      );
    }

    const evolutionResponse =
      await evolutionFetch<EvolutionConnectionStateResponse>(
        `/instance/connectionState/${instancia.instance_name}`,
        {
          method: 'GET',
        },
      );

    const rawState =
      evolutionResponse.instance?.state ??
      evolutionResponse.instance?.status ??
      evolutionResponse.state ??
      evolutionResponse.status ??
      null;

    const status = normalizeStatus(rawState);

    await admin
      .from('whatsapp_instancias')
      .update({
        status,
        connected_at: status === 'conectado' ? new Date().toISOString() : null,
        disconnected_at:
          status === 'desconectado' ? new Date().toISOString() : null,
      })
      .eq('id', instancia.id);

    return NextResponse.json({
      ok: true,
      status,
      rawState,
      evolutionResponse,
    });
  } catch (error) {
    console.error('Erro ao buscar status da instancia:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao buscar status.',
      },
      { status: 500 },
    );
  }
}
