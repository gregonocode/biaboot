import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const instanciaId = String(body.instanciaId ?? '').trim();
    const nome = String(body.nome ?? '').trim();
    const groupJid = String(body.groupJid ?? '').trim();
    const descricao = body.descricao ? String(body.descricao) : null;

    if (!instanciaId || !nome || !groupJid) {
      return NextResponse.json(
        { error: 'Dados do grupo incompletos.' },
        { status: 400 },
      );
    }

    if (!groupJid.endsWith('@g.us')) {
      return NextResponse.json(
        { error: 'O identificador informado não parece ser de um grupo.' },
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
      .select('id, user_id')
      .eq('id', instanciaId)
      .eq('user_id', usuario.id)
      .single();

    if (instanciaError || !instancia) {
      return NextResponse.json(
        { error: 'Instância não encontrada.' },
        { status: 404 },
      );
    }

    await admin
      .from('whatsapp_grupos')
      .update({
        principal: false,
      })
      .eq('user_id', usuario.id);

    const { data: grupoExistente } = await admin
      .from('whatsapp_grupos')
      .select('id')
      .eq('instancia_id', instancia.id)
      .eq('group_jid', groupJid)
      .maybeSingle();

    let grupo;

    if (grupoExistente) {
      const { data, error } = await admin
        .from('whatsapp_grupos')
        .update({
          nome,
          descricao,
          principal: true,
          ativo: true,
        })
        .eq('id', grupoExistente.id)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Erro ao atualizar grupo.' },
          { status: 500 },
        );
      }

      grupo = data;
    } else {
      const { data, error } = await admin
        .from('whatsapp_grupos')
        .insert({
          user_id: usuario.id,
          instancia_id: instancia.id,
          nome,
          group_jid: groupJid,
          descricao,
          principal: true,
          ativo: true,
        })
        .select('*')
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Erro ao salvar grupo.' },
          { status: 500 },
        );
      }

      grupo = data;
    }

    return NextResponse.json({
      ok: true,
      grupo,
    });
  } catch (error) {
    console.error('Erro ao salvar grupo:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao salvar grupo.',
      },
      { status: 500 },
    );
  }
}
