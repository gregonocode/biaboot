import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type CampanhaRow = {
  id: string;
  nome: string;
  tipo: string | null;
  status: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  grupo_id: string | null;
};

type GrupoRow = {
  id: string;
  nome: string | null;
};

type ItemStatusRow = {
  campanha_id: string | null;
  status: string | null;
};

function normalizeStatus(status: string | null) {
  return String(status ?? '').trim().toLowerCase();
}

function isSent(status: string | null) {
  return normalizeStatus(status) === 'enviado';
}

function normalizeCampaign(campanha: CampanhaRow) {
  const status = normalizeStatus(campanha.status);

  return {
    ...campanha,
    tipo: campanha.tipo === 'semanal' ? 'semanal' : 'data_especifica',
    status: status === 'ativo' ? 'ativa' : status || 'ativa',
  };
}

export async function GET() {
  try {
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

    const { data: campanhas, error: campanhasError } = await admin
      .from('campanhas')
      .select('id, nome, tipo, status, data_inicio, data_fim, grupo_id')
      .eq('user_id', usuario.id)
      .order('created_at', { ascending: false });

    if (campanhasError) {
      console.error('Erro ao buscar campanhas:', campanhasError);

      return NextResponse.json(
        { error: 'Erro ao buscar campanhas.' },
        { status: 500 },
      );
    }

    const campanhasRows = (campanhas ?? []) as CampanhaRow[];
    const campanhaIds = campanhasRows.map((campanha) => campanha.id);
    const grupoIds = [
      ...new Set(
        campanhasRows
          .map((campanha) => campanha.grupo_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    let gruposById = new Map<string, GrupoRow>();

    if (grupoIds.length > 0) {
      const { data: grupos, error: gruposError } = await admin
        .from('whatsapp_grupos')
        .select('id, nome')
        .in('id', grupoIds);

      if (gruposError) {
        console.error('Erro ao buscar grupos das campanhas:', gruposError);

        return NextResponse.json(
          { error: 'Erro ao buscar grupos das campanhas.' },
          { status: 500 },
        );
      }

      gruposById = new Map(
        ((grupos ?? []) as GrupoRow[]).map((grupo) => [grupo.id, grupo]),
      );
    }

    let midias: ItemStatusRow[] = [];
    let agendamentos: ItemStatusRow[] = [];

    if (campanhaIds.length > 0) {
      const { data: midiasData, error: midiasError } = await admin
        .from('campanha_midias')
        .select('campanha_id, status')
        .in('campanha_id', campanhaIds);

      if (midiasError) {
        console.error('Erro ao buscar conteúdos das campanhas:', midiasError);

        return NextResponse.json(
          { error: 'Erro ao buscar conteúdos das campanhas.' },
          { status: 500 },
        );
      }

      const { data: agendamentosData, error: agendamentosError } = await admin
        .from('agendamentos_envio')
        .select('campanha_id, status')
        .in('campanha_id', campanhaIds);

      if (agendamentosError) {
        console.error('Erro ao buscar fila das campanhas:', agendamentosError);

        return NextResponse.json(
          { error: 'Erro ao buscar fila das campanhas.' },
          { status: 500 },
        );
      }

      midias = (midiasData ?? []) as ItemStatusRow[];
      agendamentos = (agendamentosData ?? []) as ItemStatusRow[];
    }

    const campanhasNormalizadas = campanhasRows.map((campanha) => {
      const normalized = normalizeCampaign(campanha);
      const grupo = campanha.grupo_id
        ? gruposById.get(campanha.grupo_id)
        : null;

      const midiasDaCampanha = midias.filter(
        (midia) => midia.campanha_id === campanha.id,
      );
      const agendamentosDaCampanha = agendamentos.filter(
        (agendamento) => agendamento.campanha_id === campanha.id,
      );

      const totalItens =
        agendamentosDaCampanha.length || midiasDaCampanha.length || 0;
      const enviados =
        agendamentosDaCampanha.filter((item) => isSent(item.status)).length ||
        midiasDaCampanha.filter((item) => isSent(item.status)).length;

      return {
        id: campanha.id,
        nome: campanha.nome,
        tipo: normalized.tipo,
        status: normalized.status,
        inicio: campanha.data_inicio,
        fim: campanha.data_fim,
        totalItens,
        enviados,
        grupo: grupo?.nome ?? 'Grupo não informado',
      };
    });

    return NextResponse.json({
      ok: true,
      campanhas: campanhasNormalizadas,
    });
  } catch (error) {
    console.error('Erro geral ao listar campanhas:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao listar campanhas.',
      },
      { status: 500 },
    );
  }
}
