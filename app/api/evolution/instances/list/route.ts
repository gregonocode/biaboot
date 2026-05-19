import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const { data: instancias, error } = await admin
      .from('whatsapp_instancias')
      .select(
        `
        *,
        grupo_principal:whatsapp_grupos(
          id,
          nome,
          group_jid,
          principal,
          ativo
        )
      `,
      )
      .eq('user_id', usuario.id)
      .eq('whatsapp_grupos.principal', true)
      .eq('whatsapp_grupos.ativo', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar instâncias:', error);

      return NextResponse.json(
        { error: 'Erro ao buscar instâncias.' },
        { status: 500 },
      );
    }

    const normalized = (instancias ?? []).map((instancia) => ({
      ...instancia,
      grupo_principal: Array.isArray(instancia.grupo_principal)
        ? instancia.grupo_principal[0] ?? null
        : instancia.grupo_principal ?? null,
    }));

    return NextResponse.json({
      ok: true,
      instancias: normalized,
    });
  } catch (error) {
    console.error('Erro ao listar instâncias:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao listar instâncias.',
      },
      { status: 500 },
    );
  }
}
