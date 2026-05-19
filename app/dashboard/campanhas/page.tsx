//app\dashboard\campanhas\page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  PlayCircleIcon,
  PlusIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type CampaignType = 'semanal' | 'data_especifica';
type CampaignStatus = 'rascunho' | 'ativa' | 'pausada' | 'finalizada';

type ConteudoTipo =
  | 'texto'
  | 'imagem'
  | 'imagem_texto'
  | 'video'
  | 'video_texto'
  | 'documento';

type Campaign = {
  id: string;
  nome: string;
  tipo: CampaignType;
  status: CampaignStatus;
  inicio: string;
  fim?: string;
  totalItens: number;
  enviados: number;
  grupo: string;
};

type ContentDraft = {
  id: string;
  label: string;
  dateLabel: string;
  dateIso: string;
  horario: string;
  tipo: ConteudoTipo | null;
  texto: string;
  arquivoNome: string | null;
};

type ListCampaignsResponse = {
  ok?: boolean;
  campanhas?: Campaign[];
  error?: string;
};

const diasSemana = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

const tiposConteudo: {
  value: ConteudoTipo;
  label: string;
  description: string;
}[] = [
  {
    value: 'texto',
    label: 'Apenas texto',
    description: 'Mensagem simples no grupo.',
  },
  {
    value: 'imagem',
    label: 'Imagem',
    description: 'Envia somente uma imagem.',
  },
  {
    value: 'imagem_texto',
    label: 'Imagem + texto',
    description: 'Imagem com legenda/mensagem.',
  },
  {
    value: 'video',
    label: 'Vídeo',
    description: 'Envia somente um vídeo.',
  },
  {
    value: 'video_texto',
    label: 'Vídeo + texto',
    description: 'Vídeo com legenda/mensagem.',
  },
  {
    value: 'documento',
    label: 'Documento',
    description: 'PDF ou outro arquivo.',
  },
];

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function formatFullDate(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00`);

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getTodayIso() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localDate = new Date(today.getTime() - offset * 60 * 1000);

  return localDate.toISOString().split('T')[0];
}

function generateSevenDaysFromToday(horarioPadrao = '08:00'): ContentDraft[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    const dateIso = date.toISOString().split('T')[0];

    return {
      id: `conteudo-${index + 1}`,
      label: diasSemana[date.getDay()],
      dateLabel: formatDateLabel(date),
      dateIso,
      horario: horarioPadrao,
      tipo: null,
      texto: '',
      arquivoNome: null,
    };
  });
}

function getStatusLabel(status: CampaignStatus) {
  const labels = {
    rascunho: 'Rascunho',
    ativa: 'Ativa',
    pausada: 'Pausada',
    finalizada: 'Finalizada',
  };

  return labels[status];
}

function getStatusClass(status: CampaignStatus) {
  if (status === 'ativa') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (status === 'pausada') {
    return 'bg-amber-50 text-amber-700';
  }

  if (status === 'finalizada') {
    return 'bg-zinc-100 text-zinc-500';
  }

  return 'bg-[#181818] text-white';
}

function getTipoLabel(tipo: ConteudoTipo | null) {
  if (!tipo) return 'Não configurado';

  return tiposConteudo.find((item) => item.value === tipo)?.label ?? tipo;
}

function getTipoIcon(tipo: ConteudoTipo | null) {
  if (!tipo) return DocumentTextIcon;

  if (tipo.includes('imagem')) return PhotoIcon;
  if (tipo.includes('video')) return PlayCircleIcon;
  if (tipo === 'documento') return DocumentTextIcon;

  return DocumentTextIcon;
}

export default function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campaign[]>([]);
  const [loadingCampanhas, setLoadingCampanhas] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [contentModalOpen, setContentModalOpen] = useState(false);

  const [campaignType, setCampaignType] = useState<CampaignType>('semanal');
  const [nomeCampanha, setNomeCampanha] = useState('');
  const [horarioPadrao, setHorarioPadrao] = useState('08:00');
  const [dataEspecifica, setDataEspecifica] = useState(getTodayIso());

  const [conteudos, setConteudos] = useState<ContentDraft[]>(
    generateSevenDaysFromToday('08:00'),
  );
  const [selectedContent, setSelectedContent] = useState<ContentDraft | null>(
    null,
  );
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [campaignSuccess, setCampaignSuccess] = useState<string | null>(null);
  const [singleContent, setSingleContent] = useState<ContentDraft>({
    id: 'data-especifica',
    label: 'Envio único',
    dateIso: getTodayIso(),
    dateLabel: formatFullDate(getTodayIso()),
    horario: '08:00',
    tipo: null,
    texto: '',
    arquivoNome: null,
  });

  async function loadCampanhas() {
    try {
      setLoadingCampanhas(true);
      setListError(null);

      const response = await fetch('/api/campanhas/list', {
        cache: 'no-store',
      });
      const data = (await response.json()) as ListCampaignsResponse;

      if (!response.ok || !data.ok) {
        setListError(data.error ?? 'Erro ao carregar campanhas.');
        setCampanhas([]);
        return;
      }

      setCampanhas(data.campanhas ?? []);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
      setListError('Não foi possível carregar as campanhas agora.');
      setCampanhas([]);
    } finally {
      setLoadingCampanhas(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCampanhas();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const resumo = useMemo(() => {
    const ativas = campanhas.filter((item) => item.status === 'ativa');
    const rascunhos = campanhas.filter((item) => item.status === 'rascunho');
    const totalItens = campanhas.reduce(
      (acc, item) => acc + item.totalItens,
      0,
    );

    const enviados = campanhas.reduce((acc, item) => acc + item.enviados, 0);

    return {
      ativas: ativas.length,
      rascunhos: rascunhos.length,
      totalItens,
      enviados,
    };
  }, [campanhas]);

  function openModal() {
    const defaultTime = '08:00';

    setModalOpen(true);
    setCampaignType('semanal');
    setNomeCampanha('');
    setHorarioPadrao(defaultTime);
    setDataEspecifica(getTodayIso());
    setConteudos(generateSevenDaysFromToday(defaultTime));
    setSelectedContent(null);
    setCampaignError(null);
    setCampaignSuccess(null);
    setSingleContent({
      id: 'data-especifica',
      label: 'Envio único',
      dateIso: getTodayIso(),
      dateLabel: formatFullDate(getTodayIso()),
      horario: defaultTime,
      tipo: null,
      texto: '',
      arquivoNome: null,
    });
  }

  function closeModal() {
    setModalOpen(false);
    setContentModalOpen(false);
    setSelectedContent(null);
  }

  function handleChangeHorarioPadrao(value: string) {
    setHorarioPadrao(value);

    setConteudos((prev) =>
      prev.map((item) => ({
        ...item,
        horario: item.horario === horarioPadrao ? value : item.horario,
      })),
    );
  }

  function openContentModal(content: ContentDraft) {
    setSelectedContent(content);
    setContentModalOpen(true);
  }

  function closeContentModal() {
    setSelectedContent(null);
    setContentModalOpen(false);
  }

  function updateSelectedContent(updates: Partial<ContentDraft>) {
    setSelectedContent((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        ...updates,
      };
    });
  }

  function saveSelectedContent() {
    if (!selectedContent) return;

    if (selectedContent.id === 'data-especifica') {
      setSingleContent(selectedContent);
      closeContentModal();
      return;
    }

    setConteudos((prev) =>
      prev.map((item) =>
        item.id === selectedContent.id ? selectedContent : item,
      ),
    );

    closeContentModal();
  }

  async function handleCreateCampaign() {
    try {
      setCreatingCampaign(true);
      setCampaignError(null);
      setCampaignSuccess(null);

      const nome = nomeCampanha.trim();

      if (!nome) {
        setCampaignError('Informe o nome da campanha.');
        return;
      }

      const conteudosBase =
        campaignType === 'semanal'
          ? conteudos.filter((item) => item.tipo)
          : singleContent.tipo
            ? [
                {
                  ...singleContent,
                  dateIso: dataEspecifica,
                  dateLabel: formatFullDate(dataEspecifica),
                  horario: horarioPadrao,
                },
              ]
            : [];

      if (conteudosBase.length === 0) {
        setCampaignError('Configure pelo menos um conteúdo antes de criar.');
        return;
      }

      const temConteudoComArquivo = conteudosBase.some(
        (item) =>
          item.tipo &&
          [
            'imagem',
            'imagem_texto',
            'video',
            'video_texto',
            'documento',
          ].includes(item.tipo),
      );

      if (temConteudoComArquivo) {
        setCampaignError(
          'Por enquanto, crie campanhas apenas com conteúdo do tipo "Apenas texto". O upload de imagem/vídeo/documento será conectado no próximo passo.',
        );
        return;
      }

      const conteudosPayload = conteudosBase.map((item, index) => ({
        data_envio: item.dateIso,
        horario: item.horario,
        tipo_conteudo: item.tipo,
        texto: item.texto,
        conteudo_url: null,
        nome_arquivo: null,
        mime_type: null,
        ordem: index + 1,
      }));

      const response = await fetch('/api/campanhas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome,
          descricao: null,
          tipo: campaignType,
          grupo_id: null,
          conteudos: conteudosPayload,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setCampaignError(data.error ?? 'Erro ao criar campanha.');
        return;
      }

      setCampaignSuccess(
        `Campanha criada com sucesso! ${data.total_agendamentos} envio(s) foram adicionados à fila.`,
      );
      await loadCampanhas();

      setTimeout(() => {
        closeModal();
      }, 900);
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      setCampaignError('Não foi possível criar a campanha agora.');
    } finally {
      setCreatingCampaign(false);
    }
  }

  const conteudosConfigurados = conteudos.filter((item) => item.tipo).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#F7F7F5] px-3 py-1.5 text-xs font-medium text-zinc-600">
            <SparklesIcon className="h-4 w-4" />
            Campanhas da BiaBot
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#181818] sm:text-3xl">
            Automatize conteúdos para seus grupos.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Programe textos, imagens, vídeos ou documentos e deixe a BiaBot
            enviar tudo no grupo certo, no horário certo.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#181818] px-5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <PlusIcon className="h-5 w-5" />
          Nova campanha
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#F7F7F5]">
            <CalendarDaysIcon className="h-6 w-6 text-[#181818]" />
          </div>

          <p className="text-sm text-zinc-500">Campanhas ativas</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#181818]">
            {resumo.ativas}
          </h2>

          <p className="mt-3 text-xs leading-5 text-zinc-400">
            Sequências de automação em andamento.
          </p>
        </div>

        <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#F7F7F5]">
            <DocumentTextIcon className="h-6 w-6 text-[#181818]" />
          </div>

          <p className="text-sm text-zinc-500">Rascunhos</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#181818]">
            {resumo.rascunhos}
          </h2>

          <p className="mt-3 text-xs leading-5 text-zinc-400">
            Campanhas aguardando configuração.
          </p>
        </div>

        <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#F7F7F5]">
            <ClockIcon className="h-6 w-6 text-[#181818]" />
          </div>

          <p className="text-sm text-zinc-500">Itens na fila</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#181818]">
            {resumo.totalItens}
          </h2>

          <p className="mt-3 text-xs leading-5 text-zinc-400">
            Conteúdos programados para envio.
          </p>
        </div>

        <div className="rounded-[32px] border border-zinc-200 bg-[#181818] p-5 text-white shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[22px] bg-white text-[#181818]">
            <CheckCircleIcon className="h-6 w-6" />
          </div>

          <p className="text-sm text-white/50">Enviados</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {resumo.enviados}
          </h2>

          <p className="mt-3 text-xs leading-5 text-white/45">
            Conteúdos já processados.
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#181818]">
                Campanhas
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Visualize campanhas e filas de automação.
              </p>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-[#F7F7F5] px-4 text-sm font-semibold text-[#181818] transition hover:border-zinc-300"
            >
              <PlusIcon className="h-4 w-4" />
              Adicionar
            </button>
          </div>

          {listError && (
            <div className="mb-4 rounded-[20px] bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
              {listError}
            </div>
          )}

          <div className="space-y-3">
            {loadingCampanhas && (
              <div className="rounded-[28px] border border-zinc-100 bg-[#FAFAFA] p-4 text-sm text-zinc-500">
                Carregando campanhas...
              </div>
            )}

            {!loadingCampanhas && campanhas.length === 0 && !listError && (
              <div className="rounded-[28px] border border-zinc-100 bg-[#FAFAFA] p-5">
                <p className="text-sm font-medium text-[#181818]">
                  Nenhuma campanha criada ainda.
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Crie sua primeira campanha para ver a fila real aqui.
                </p>
              </div>
            )}

            {campanhas.map((campanha) => (
              <div
                key={campanha.id}
                className="rounded-[28px] border border-zinc-100 bg-[#FAFAFA] p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white">
                      {campanha.tipo === 'semanal' ? (
                        <CalendarDaysIcon className="h-5 w-5 text-zinc-600" />
                      ) : (
                        <ClockIcon className="h-5 w-5 text-zinc-600" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-[#181818]">
                          {campanha.nome}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                            campanha.status,
                          )}`}
                        >
                          {getStatusLabel(campanha.status)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-zinc-500">
                        {campanha.tipo === 'semanal'
                          ? `Campanha semanal • ${formatFullDate(
                              campanha.inicio,
                            )} até ${
                              campanha.fim
                                ? formatFullDate(campanha.fim)
                                : 'sem data final'
                            }`
                          : `Envio específico • ${formatFullDate(
                              campanha.inicio,
                            )}`}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                        <span>{campanha.grupo}</span>
                        <span>
                          {campanha.enviados}/{campanha.totalItens} enviados
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-[#181818]"
                    >
                      Ver fila
                    </button>

                    <button
                      type="button"
                      className="inline-flex h-10 items-center justify-center rounded-full bg-[#181818] px-4 text-xs font-semibold text-white transition hover:opacity-90"
                    >
                      Editar
                    </button>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-[#181818]"
                    style={{
                      width: `${Math.max(
                        campanha.totalItens > 0 ? 4 : 0,
                        campanha.totalItens > 0
                          ? (campanha.enviados / campanha.totalItens) * 100
                          : 0,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[32px] border border-zinc-200 bg-[#181818] p-5 text-white shadow-sm sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-white text-[#181818]">
              <ClockIcon className="h-6 w-6" />
            </div>

            <h2 className="mt-6 text-xl font-semibold tracking-tight">
              Fila de automação
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Cada conteúdo vira um item agendado. O worker na VPS busca os
              pendentes no Supabase e envia pela Evolution API.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/45">Banco/fila</p>
                <p className="mt-1 text-sm font-semibold">Supabase</p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/45">Processamento</p>
                <p className="mt-1 text-sm font-semibold">Worker na VPS</p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/45">Envio</p>
                <p className="mt-1 text-sm font-semibold">Evolution API</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#F7F7F5] text-[#181818]">
              <CalendarDaysIcon className="h-6 w-6" />
            </div>

            <h2 className="mt-6 text-lg font-semibold text-[#181818]">
              Modelo semanal
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Por padrão, a campanha cria 7 envios a partir do dia atual.
            </p>
          </div>
        </aside>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative grid max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[36px] bg-white shadow-2xl lg:grid-cols-[0.8fr_1.2fr]">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow-sm transition hover:bg-white hover:text-[#181818]"
              aria-label="Fechar modal"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="relative hidden min-h-[660px] overflow-hidden bg-[#181818] p-8 text-white lg:block">
              <div className="absolute -left-24 top-14 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -right-24 bottom-14 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-white text-[#181818]">
                    <CalendarDaysIcon className="h-7 w-7" />
                  </div>

                  <h2 className="mt-8 max-w-sm text-3xl font-semibold leading-tight tracking-tight">
                    Crie uma campanha e configure cada envio.
                  </h2>

                  <p className="mt-4 max-w-sm text-sm leading-6 text-white/50">
                    Cada card representa um conteúdo da fila. Você pode escolher
                    horário, tipo, texto e arquivo de forma individual.
                  </p>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-medium">Automação de grupo</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    Pode ser texto, imagem, vídeo, documento ou combinações com
                    legenda.
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-[92vh] overflow-y-auto bg-[#F7F7F5] p-5 sm:p-8">
              <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#F7F7F5]">
                    <SparklesIcon className="h-6 w-6 text-[#181818]" />
                  </div>

                  <h3 className="text-xl font-semibold text-[#181818]">
                    Nova campanha
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Escolha o tipo de campanha e configure os conteúdos que
                    serão enviados no grupo.
                  </p>

                  {campaignError && (
                    <div className="mt-4 rounded-[20px] bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                      {campaignError}
                    </div>
                  )}

                  {campaignSuccess && (
                    <div className="mt-4 rounded-[20px] bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-700">
                      {campaignSuccess}
                    </div>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setCampaignType('semanal')}
                    className={`rounded-[28px] border p-4 text-left transition ${
                      campaignType === 'semanal'
                        ? 'border-[#181818] bg-[#181818] text-white'
                        : 'border-zinc-200 bg-[#FAFAFA] text-[#181818] hover:border-zinc-300'
                    }`}
                  >
                    <CalendarDaysIcon className="h-6 w-6" />

                    <p className="mt-4 text-sm font-semibold">
                      Campanha semanal
                    </p>

                    <p
                      className={`mt-1 text-xs leading-5 ${
                        campaignType === 'semanal'
                          ? 'text-white/50'
                          : 'text-zinc-500'
                      }`}
                    >
                      Cria 7 envios começando a partir de hoje.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCampaignType('data_especifica')}
                    className={`rounded-[28px] border p-4 text-left transition ${
                      campaignType === 'data_especifica'
                        ? 'border-[#181818] bg-[#181818] text-white'
                        : 'border-zinc-200 bg-[#FAFAFA] text-[#181818] hover:border-zinc-300'
                    }`}
                  >
                    <ClockIcon className="h-6 w-6" />

                    <p className="mt-4 text-sm font-semibold">
                      Data específica
                    </p>

                    <p
                      className={`mt-1 text-xs leading-5 ${
                        campaignType === 'data_especifica'
                          ? 'text-white/50'
                          : 'text-zinc-500'
                      }`}
                    >
                      Agenda um envio para uma data exata.
                    </p>
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="nomeCampanha"
                      className="mb-2 block text-sm font-medium text-zinc-700"
                    >
                      Nome da campanha
                    </label>

                    <input
                      id="nomeCampanha"
                      type="text"
                      value={nomeCampanha}
                      onChange={(e) => setNomeCampanha(e.target.value)}
                      placeholder={
                        campaignType === 'semanal'
                          ? 'Ex: Semana de conteúdos'
                          : 'Ex: Envio especial dia 28'
                      }
                      className="h-14 w-full rounded-full border border-zinc-200 bg-[#FAFAFA] px-5 text-sm text-[#181818] outline-none transition placeholder:text-zinc-400 focus:border-[#181818] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="horarioPadrao"
                      className="mb-2 block text-sm font-medium text-zinc-700"
                    >
                      Horário padrão
                    </label>

                    <input
                      id="horarioPadrao"
                      type="time"
                      value={horarioPadrao}
                      onChange={(e) => handleChangeHorarioPadrao(e.target.value)}
                      className="h-14 w-full rounded-full border border-zinc-200 bg-[#FAFAFA] px-5 text-sm text-[#181818] outline-none transition focus:border-[#181818] focus:bg-white"
                    />
                  </div>

                  {campaignType === 'data_especifica' && (
                    <div>
                      <label
                        htmlFor="dataEspecifica"
                        className="mb-2 block text-sm font-medium text-zinc-700"
                      >
                        Data do envio
                      </label>

                      <input
                        id="dataEspecifica"
                        type="date"
                        value={dataEspecifica}
                        onChange={(e) => setDataEspecifica(e.target.value)}
                        className="h-14 w-full rounded-full border border-zinc-200 bg-[#FAFAFA] px-5 text-sm text-[#181818] outline-none transition focus:border-[#181818] focus:bg-white"
                      />
                    </div>
                  )}
                </div>

                {campaignType === 'semanal' && (
                  <div className="mt-6 rounded-[28px] bg-[#F7F7F5] p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#181818]">
                          A campanha vai criar 7 envios:
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Clique em cada card para configurar o conteúdo.
                        </p>
                      </div>

                      <span className="mt-2 w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-500 sm:mt-0">
                        {conteudosConfigurados}/7 configurados
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {conteudos.map((item, index) => {
                        const Icon = getTipoIcon(item.tipo);

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => openContentModal(item)}
                            className={`rounded-[20px] border p-4 text-left transition ${
                              item.tipo
                                ? 'border-[#181818] bg-white'
                                : 'border-transparent bg-white hover:border-zinc-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-[#181818]">
                                  {item.label}
                                </p>
                                <p className="mt-0.5 text-xs text-zinc-400">
                                  {item.dateLabel} às {item.horario}
                                </p>
                              </div>

                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F7F5]">
                                <Icon className="h-4 w-4 text-zinc-600" />
                              </div>
                            </div>

                            <p className="mt-3 text-xs font-medium text-zinc-500">
                              Conteúdo {index + 1}
                            </p>

                            <p
                              className={`mt-1 text-xs ${
                                item.tipo
                                  ? 'text-[#181818]'
                                  : 'text-zinc-400'
                              }`}
                            >
                              {getTipoLabel(item.tipo)}
                            </p>

                            {item.arquivoNome && (
                              <p className="mt-2 truncate text-[11px] text-zinc-400">
                                Arquivo: {item.arquivoNome}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {campaignType === 'data_especifica' && (
                  <div className="mt-6 rounded-[28px] bg-[#F7F7F5] p-4">
                    <p className="text-sm font-semibold text-[#181818]">
                      Envio programado:
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        openContentModal({
                          ...singleContent,
                          dateIso: dataEspecifica,
                          dateLabel: dataEspecifica
                            ? formatFullDate(dataEspecifica)
                            : 'Selecione uma data',
                          horario: horarioPadrao,
                        })
                      }
                      className="mt-4 w-full rounded-[20px] bg-white px-4 py-3 text-left transition hover:ring-1 hover:ring-zinc-300"
                    >
                      <p className="text-sm font-medium text-[#181818]">
                        {dataEspecifica
                          ? formatFullDate(dataEspecifica)
                          : 'Selecione uma data'}
                      </p>

                      <p className="mt-0.5 text-xs text-zinc-400">
                        Horário: {horarioPadrao}
                      </p>

                      <p className="mt-2 text-xs font-medium text-zinc-500">
                        Clique para configurar o conteúdo
                      </p>
                    </button>
                  </div>
                )}

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-[#181818]"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateCampaign}
                    disabled={creatingCampaign}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#181818] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {creatingCampaign ? 'Criando campanha...' : 'Criar campanha'}
                    {!creatingCampaign && <CheckCircleIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {contentModalOpen && selectedContent && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[32px] bg-[#F7F7F5] p-5 shadow-2xl sm:p-6">
            <button
              type="button"
              onClick={closeContentModal}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm transition hover:text-[#181818]"
              aria-label="Fechar modal"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#F7F7F5]">
                  <DocumentTextIcon className="h-6 w-6 text-[#181818]" />
                </div>

                <h3 className="text-xl font-semibold text-[#181818]">
                  Configurar conteúdo
                </h3>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  {selectedContent.label} • {selectedContent.dateLabel} às{' '}
                  {selectedContent.horario}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="contentTime"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Horário deste envio
                  </label>

                  <input
                    id="contentTime"
                    type="time"
                    value={selectedContent.horario}
                    onChange={(e) =>
                      updateSelectedContent({ horario: e.target.value })
                    }
                    className="h-14 w-full rounded-full border border-zinc-200 bg-[#FAFAFA] px-5 text-sm text-[#181818] outline-none transition focus:border-[#181818] focus:bg-white"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-zinc-700">
                    Tipo de conteúdo
                  </p>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {tiposConteudo.map((tipo) => {
                      const active = selectedContent.tipo === tipo.value;

                      return (
                        <button
                          key={tipo.value}
                          type="button"
                          onClick={() =>
                            updateSelectedContent({ tipo: tipo.value })
                          }
                          className={`rounded-[22px] border p-4 text-left transition ${
                            active
                              ? 'border-[#181818] bg-[#181818] text-white'
                              : 'border-zinc-200 bg-[#FAFAFA] text-[#181818] hover:border-zinc-300'
                          }`}
                        >
                          <p className="text-sm font-semibold">{tipo.label}</p>
                          <p
                            className={`mt-1 text-xs leading-5 ${
                              active ? 'text-white/50' : 'text-zinc-500'
                            }`}
                          >
                            {tipo.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedContent.tipo &&
                  ['texto', 'imagem_texto', 'video_texto'].includes(
                    selectedContent.tipo,
                  ) && (
                    <div>
                      <label
                        htmlFor="contentText"
                        className="mb-2 block text-sm font-medium text-zinc-700"
                      >
                        Mensagem/legenda
                      </label>

                      <textarea
                        id="contentText"
                        value={selectedContent.texto}
                        onChange={(e) =>
                          updateSelectedContent({ texto: e.target.value })
                        }
                        placeholder="Digite a mensagem que será enviada no grupo..."
                        rows={4}
                        className="w-full resize-none rounded-[24px] border border-zinc-200 bg-[#FAFAFA] px-5 py-4 text-sm text-[#181818] outline-none transition placeholder:text-zinc-400 focus:border-[#181818] focus:bg-white"
                      />
                    </div>
                  )}

                {selectedContent.tipo &&
                  ['imagem', 'imagem_texto', 'video', 'video_texto', 'documento'].includes(
                    selectedContent.tipo,
                  ) && (
                    <div>
                      <label
                        htmlFor="contentFile"
                        className="mb-2 block text-sm font-medium text-zinc-700"
                      >
                        Arquivo
                      </label>

                      <input
                        id="contentFile"
                        type="file"
                        onChange={(e) =>
                          updateSelectedContent({
                            arquivoNome: e.target.files?.[0]?.name ?? null,
                          })
                        }
                        className="block w-full cursor-pointer rounded-full border border-zinc-200 bg-[#FAFAFA] text-sm text-zinc-500 file:mr-4 file:h-12 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#181818] file:px-5 file:text-sm file:font-semibold file:text-white"
                      />

                      {selectedContent.arquivoNome && (
                        <p className="mt-2 text-xs text-zinc-400">
                          Selecionado: {selectedContent.arquivoNome}
                        </p>
                      )}
                    </div>
                  )}
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={closeContentModal}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-[#181818]"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={saveSelectedContent}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#181818] px-5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Salvar conteúdo
                  <CheckCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
