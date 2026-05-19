import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { evolutionFetch } from '@/lib/evolution/client';

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const instanciaId = String(body.instanciaId ?? '').trim();

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

    let evolutionDeleteResponse: unknown = null;

    try {
      evolutionDeleteResponse = await evolutionFetch(
        `/instance/delete/${instancia.instance_name}`,
        {
          method: 'DELETE',
        },
      );
    } catch (evolutionError) {
      console.error('Erro ao excluir na Evolution:', evolutionError);
    }

    const { error: deleteError } = await admin
      .from('whatsapp_instancias')
      .delete()
      .eq('id', instancia.id)
      .eq('user_id', usuario.id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Erro ao excluir instância do banco.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      evolutionDeleteResponse,
    });
  } catch (error) {
    console.error('Erro ao excluir instância:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao excluir instância.',
      },
      { status: 500 },
    );
  }
}
