import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  evolutionFetch,
  normalizeInstanceName,
} from '@/lib/evolution/client';

type EvolutionCreateInstanceResponse = {
  instance?: {
    instanceName?: string;
    instanceId?: string;
    status?: string;
  };
  data?: {
    id?: string;
    name?: string;
    token?: string;
    connected?: boolean;
  };
  message?: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nome = String(body.nome ?? '').trim();

    if (!nome) {
      return NextResponse.json(
        { error: 'Informe o nome da instancia.' },
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
      .select('id, plano_atual')
      .eq('auth_user_id', user.id)
      .single();

    if (usuarioError || !usuario) {
      return NextResponse.json(
        { error: 'Perfil do usuario nao encontrado.' },
        { status: 404 },
      );
    }

    const { count: totalInstancias, error: countError } = await admin
      .from('whatsapp_instancias')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', usuario.id);

    if (countError) {
      return NextResponse.json(
        { error: 'Erro ao verificar limite de instancias.' },
        { status: 500 },
      );
    }

    if ((totalInstancias ?? 0) >= 1) {
      return NextResponse.json(
        {
          error: 'Seu plano atual permite apenas 1 instancia de WhatsApp.',
        },
        { status: 403 },
      );
    }

    const instanceName = normalizeInstanceName(nome, usuario.id);

    const evolutionResponse =
      await evolutionFetch<EvolutionCreateInstanceResponse>(
        '/instance/create',
        {
          method: 'POST',
          body: {
            instanceName,
            integration: 'WHATSAPP-BAILEYS',
            qrcode: true,
          },
        },
      );

    const evolutionInstanceId =
      evolutionResponse.instance?.instanceId ?? evolutionResponse.data?.id ?? null;

    const { data: instancia, error: insertError } = await admin
      .from('whatsapp_instancias')
      .insert({
        user_id: usuario.id,
        nome,
        instance_name: instanceName,
        status: 'conectando',
        evolution_instance_id: evolutionInstanceId,
      })
      .select('*')
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          error: 'Instancia criada na Evolution, mas erro ao salvar no banco.',
          details: insertError.message,
          evolutionResponse,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      instancia,
      evolutionResponse,
    });
  } catch (error) {
    console.error('Erro ao criar instancia:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao criar instancia.',
      },
      { status: 500 },
    );
  }
}
