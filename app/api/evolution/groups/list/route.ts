//app\api\evolution\groups\list\route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { evolutionFetch } from '@/lib/evolution/client';

type EvolutionGroupRaw = {
  id?: string;
  jid?: string;
  groupJid?: string;
  subject?: string;
  name?: string;
  desc?: string;
  participants?: unknown[];
  size?: number;
  participantCount?: number;
};

function normalizeGroup(group: EvolutionGroupRaw) {
  const groupJid = group.groupJid ?? group.jid ?? group.id ?? '';

  return {
    nome: group.subject ?? group.name ?? 'Grupo sem nome',
    groupJid,
    descricao: group.desc ?? null,
    participantes: Array.isArray(group.participants)
      ? group.participants.length
      : group.participantCount ?? group.size ?? null,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const instanciaId = url.searchParams.get('instanciaId');

    if (!instanciaId) {
      return NextResponse.json(
        { error: 'Informe a instância.' },
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
        { error: 'Usuário não autenticado.' },
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
        { error: 'Perfil do usuário não encontrado.' },
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
        { error: 'Instância não encontrada.' },
        { status: 404 },
      );
    }

    if (instancia.status !== 'conectado') {
      return NextResponse.json(
        { error: 'Conecte o WhatsApp antes de buscar os grupos.' },
        { status: 400 },
      );
    }

    const evolutionResponse = await evolutionFetch<unknown>(
      `/group/fetchAllGroups/${encodeURIComponent(
        instancia.instance_name,
      )}?getParticipants=true`,
      {
        method: 'GET',
      },
    );

    let rawGroups: EvolutionGroupRaw[] = [];

    if (Array.isArray(evolutionResponse)) {
      rawGroups = evolutionResponse as EvolutionGroupRaw[];
    } else if (
      evolutionResponse &&
      typeof evolutionResponse === 'object' &&
      'groups' in evolutionResponse &&
      Array.isArray((evolutionResponse as { groups: unknown }).groups)
    ) {
      rawGroups = (evolutionResponse as { groups: EvolutionGroupRaw[] }).groups;
    } else if (
      evolutionResponse &&
      typeof evolutionResponse === 'object' &&
      'data' in evolutionResponse &&
      Array.isArray((evolutionResponse as { data: unknown }).data)
    ) {
      rawGroups = (evolutionResponse as { data: EvolutionGroupRaw[] }).data;
    }

    const grupos = rawGroups
      .map(normalizeGroup)
      .filter((grupo) => grupo.groupJid.endsWith('@g.us'));

    return NextResponse.json({
      ok: true,
      grupos,
      evolutionResponse,
    });
  } catch (error) {
    console.error('Erro ao listar grupos:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao listar grupos.',
      },
      { status: 500 },
    );
  }
}
