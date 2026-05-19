import { NextResponse } from 'next/server';
import { evolutionFetch } from '@/lib/evolution/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

type EvolutionConnectResponse = {
  pairingCode?: string;
  code?: string;
  base64?: string;
  qrcode?: {
    code?: string;
    base64?: string;
  };
  count?: number;
};

function extractQrCode(response: EvolutionConnectResponse) {
  return (
    response.base64 ??
    response.qrcode?.base64 ??
    response.code ??
    response.qrcode?.code ??
    null
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const instanciaId = String(body.instanciaId ?? '').trim();

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

    const evolutionResponse = await evolutionFetch<EvolutionConnectResponse>(
      `/instance/connect/${instancia.instance_name}`,
      {
        method: 'GET',
      },
    );

    const qrCode = extractQrCode(evolutionResponse);

    await admin
      .from('whatsapp_instancias')
      .update({
        qr_code: qrCode,
        status: 'conectando',
      })
      .eq('id', instancia.id);

    return NextResponse.json({
      ok: true,
      qrCode,
      pairingCode: evolutionResponse.pairingCode ?? null,
      evolutionResponse,
    });
  } catch (error) {
    console.error('Erro ao conectar instancia:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao conectar instancia.',
      },
      { status: 500 },
    );
  }
}
