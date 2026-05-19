import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type ConteudoTipo =
  | 'texto'
  | 'imagem'
  | 'imagem_texto'
  | 'audio'
  | 'audio_texto'
  | 'video'
  | 'video_texto'
  | 'documento';

type ConteudoInput = {
  data_envio: string;
  horario: string;
  tipo_conteudo: ConteudoTipo;
  texto?: string | null;
  conteudo_url?: string | null;
  nome_arquivo?: string | null;
  mime_type?: string | null;
  ordem?: number;
};

type CreateCampanhaBody = {
  nome: string;
  descricao?: string | null;
  tipo: 'manual' | 'data_especifica' | 'semanal';
  grupo_id?: string | null;
  conteudos: ConteudoInput[];
};

const TIPOS_SUPORTADOS: ConteudoTipo[] = [
  'texto',
  'imagem',
  'imagem_texto',
  'audio',
  'audio_texto',
  'video',
  'video_texto',
  'documento',
];

function createEnviarEm(dataEnvio: string, horario: string) {
  // MVP usando horário do Brasil.
  // Exemplo final: 2026-05-13T08:00:00-03:00
  return `${dataEnvio}T${horario}:00-03:00`;
}

function isConteudoComArquivo(tipo: ConteudoTipo) {
  return [
    'imagem',
    'imagem_texto',
    'audio',
    'audio_texto',
    'video',
    'video_texto',
    'documento',
  ].includes(tipo);
}

function isConteudoComTexto(tipo: ConteudoTipo) {
  return ['texto', 'imagem_texto', 'audio_texto', 'video_texto'].includes(tipo);
}

function getImageUrl(conteudo: ConteudoInput) {
  return conteudo.tipo_conteudo.includes('imagem')
    ? conteudo.conteudo_url ?? null
    : null;
}

function getAudioUrl(conteudo: ConteudoInput) {
  return conteudo.tipo_conteudo.includes('audio')
    ? conteudo.conteudo_url ?? null
    : null;
}

function getVideoUrl(conteudo: ConteudoInput) {
  return conteudo.tipo_conteudo.includes('video')
    ? conteudo.conteudo_url ?? null
    : null;
}

function getDocumentoUrl(conteudo: ConteudoInput) {
  return conteudo.tipo_conteudo === 'documento'
    ? conteudo.conteudo_url ?? null
    : null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateCampanhaBody;

    const nome = String(body.nome ?? '').trim();
    const tipo = body.tipo;
    const descricao = body.descricao ?? null;
    const conteudos = Array.isArray(body.conteudos) ? body.conteudos : [];

    if (!nome) {
      return NextResponse.json(
        { error: 'Informe o nome da campanha.' },
        { status: 400 },
      );
    }

    if (!['manual', 'data_especifica', 'semanal'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo de campanha inválido.' },
        { status: 400 },
      );
    }

    if (conteudos.length === 0) {
      return NextResponse.json(
        { error: 'Adicione pelo menos um conteúdo na campanha.' },
        { status: 400 },
      );
    }

    for (const [index, conteudo] of conteudos.entries()) {
      if (!conteudo.data_envio) {
        return NextResponse.json(
          { error: `Informe a data do conteúdo ${index + 1}.` },
          { status: 400 },
        );
      }

      if (!conteudo.horario) {
        return NextResponse.json(
          { error: `Informe o horário do conteúdo ${index + 1}.` },
          { status: 400 },
        );
      }

      if (!conteudo.tipo_conteudo) {
        return NextResponse.json(
          { error: `Informe o tipo do conteúdo ${index + 1}.` },
          { status: 400 },
        );
      }

      if (!TIPOS_SUPORTADOS.includes(conteudo.tipo_conteudo)) {
        return NextResponse.json(
          { error: `Tipo do conteúdo ${index + 1} é inválido.` },
          { status: 400 },
        );
      }

      if (
        isConteudoComTexto(conteudo.tipo_conteudo) &&
        !String(conteudo.texto ?? '').trim()
      ) {
        return NextResponse.json(
          { error: `Informe a mensagem do conteúdo ${index + 1}.` },
          { status: 400 },
        );
      }

      if (
        isConteudoComArquivo(conteudo.tipo_conteudo) &&
        !String(conteudo.conteudo_url ?? '').trim()
      ) {
        return NextResponse.json(
          { error: `Envie o arquivo do conteúdo ${index + 1}.` },
          { status: 400 },
        );
      }
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
      .select('id, plano_atual')
      .eq('auth_user_id', user.id)
      .single();

    if (usuarioError || !usuario) {
      return NextResponse.json(
        { error: 'Perfil do usuário não encontrado.' },
        { status: 404 },
      );
    }

    let grupoId = body.grupo_id ?? null;

    if (!grupoId) {
      const { data: grupoPrincipal, error: grupoPrincipalError } = await admin
        .from('whatsapp_grupos')
        .select('id, instancia_id')
        .eq('user_id', usuario.id)
        .eq('principal', true)
        .eq('ativo', true)
        .maybeSingle();

      if (grupoPrincipalError) {
        return NextResponse.json(
          { error: 'Erro ao buscar grupo principal.' },
          { status: 500 },
        );
      }

      if (!grupoPrincipal) {
        return NextResponse.json(
          {
            error:
              'Nenhum grupo principal conectado. Configure um grupo antes de criar campanhas.',
          },
          { status: 400 },
        );
      }

      grupoId = grupoPrincipal.id;
    }

    const { data: grupo, error: grupoError } = await admin
      .from('whatsapp_grupos')
      .select('id, instancia_id, nome')
      .eq('id', grupoId)
      .eq('user_id', usuario.id)
      .single();

    if (grupoError || !grupo) {
      return NextResponse.json(
        { error: 'Grupo não encontrado.' },
        { status: 404 },
      );
    }

    const datasOrdenadas = [...conteudos]
      .map((item) => item.data_envio)
      .sort((a, b) => a.localeCompare(b));

    const dataInicio = datasOrdenadas[0];
    const dataFim = datasOrdenadas[datasOrdenadas.length - 1];

    const { data: campanha, error: campanhaError } = await admin
      .from('campanhas')
      .insert({
        user_id: usuario.id,
        grupo_id: grupo.id,
        nome,
        descricao,
        tipo: 'manual',
        status: 'ativa',
        data_inicio: dataInicio,
        data_fim: dataFim,
        repetir_semanalmente: false,
      })
      .select('*')
      .single();

    if (campanhaError || !campanha) {
      console.error('Erro ao criar campanha:', campanhaError);

      return NextResponse.json(
        { error: 'Erro ao criar campanha.' },
        { status: 500 },
      );
    }

    const midiasCriadas = [];

    for (const [index, conteudo] of conteudos.entries()) {
      const conteudoUrl = conteudo.conteudo_url ?? null;
      const texto = conteudo.texto ?? null;

      const imageUrl = getImageUrl(conteudo);
      const audioUrl = getAudioUrl(conteudo);
      const videoUrl = getVideoUrl(conteudo);
      const documentoUrl = getDocumentoUrl(conteudo);

      const { data: midia, error: midiaError } = await admin
        .from('campanha_midias')
        .insert({
          user_id: usuario.id,
          campanha_id: campanha.id,
          titulo: `Conteúdo ${index + 1}`,

          image_url: imageUrl,
          audio_url: audioUrl,
          video_url: videoUrl,
          documento_url: documentoUrl,

          storage_path: null,
          legenda: texto,
          texto,
          ordem: conteudo.ordem ?? index + 1,
          origem: 'manual',
          status: 'agendada',
          tipo_conteudo: conteudo.tipo_conteudo,
          horario: conteudo.horario,
          data_envio: conteudo.data_envio,
          nome_arquivo: conteudo.nome_arquivo ?? null,
          mime_type: conteudo.mime_type ?? null,
        })
        .select('*')
        .single();

      if (midiaError || !midia) {
        console.error('Erro ao criar conteúdo da campanha:', midiaError);

        return NextResponse.json(
          {
            error:
              'Campanha criada, mas ocorreu erro ao criar um dos conteúdos.',
          },
          { status: 500 },
        );
      }

      const enviarEm = createEnviarEm(conteudo.data_envio, conteudo.horario);

      const { error: agendamentoError } = await admin
        .from('agendamentos_envio')
        .insert({
          user_id: usuario.id,
          campanha_id: campanha.id,
          midia_id: midia.id,
          grupo_id: grupo.id,
          instancia_id: grupo.instancia_id,
          enviar_em: enviarEm,
          timezone: 'America/Sao_Paulo',
          status: 'pendente',
          tentativas: 0,

          tipo_conteudo: conteudo.tipo_conteudo,
          conteudo_url: conteudoUrl,
          audio_url: audioUrl,
          texto,
          nome_arquivo: conteudo.nome_arquivo ?? null,
          mime_type: conteudo.mime_type ?? null,
        });

      if (agendamentoError) {
        console.error('Erro ao criar agendamento:', agendamentoError);

        return NextResponse.json(
          {
            error:
              'Campanha e conteúdo criados, mas ocorreu erro ao criar a fila de envio.',
          },
          { status: 500 },
        );
      }

      midiasCriadas.push(midia);
    }

    return NextResponse.json({
      ok: true,
      campanha,
      conteudos: midiasCriadas,
      total_agendamentos: midiasCriadas.length,
    });
  } catch (error) {
    console.error('Erro geral ao criar campanha:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao criar campanha.',
      },
      { status: 500 },
    );
  }
}