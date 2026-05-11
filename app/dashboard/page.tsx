'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowPathRoundedSquareIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  PlusIcon,
  SparklesIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

type PeriodoFiltro = 'hoje' | 'semana' | 'mes';

type EnvioAgendado = {
  id: string;
  titulo: string;
  grupo: string;
  campanha: string;
  data: string;
  horario: string;
  status: 'agendado' | 'enviado' | 'rascunho';
};

const enviosMock: EnvioAgendado[] = [
  {
    id: 'ENV-001',
    titulo: 'Promoção de perfumes femininos',
    grupo: 'Artes - Loja de Perfumes',
    campanha: 'Semana de Conteúdo',
    data: 'Hoje',
    horario: '08:00',
    status: 'enviado',
  },
  {
    id: 'ENV-002',
    titulo: 'Kit presente para casal',
    grupo: 'Artes - Loja de Perfumes',
    campanha: 'Semana de Conteúdo',
    data: 'Amanhã',
    horario: '08:00',
    status: 'agendado',
  },
  {
    id: 'ENV-003',
    titulo: 'Perfume masculino em destaque',
    grupo: 'Artes - Loja de Perfumes',
    campanha: 'Semana de Conteúdo',
    data: 'Sexta-feira',
    horario: '08:00',
    status: 'agendado',
  },
  {
    id: 'ENV-004',
    titulo: 'Lembrete de oferta da semana',
    grupo: 'Artes - Loja de Perfumes',
    campanha: 'Campanha de Maio',
    data: 'Sábado',
    horario: '09:30',
    status: 'rascunho',
  },
];

const filtros: { label: string; value: PeriodoFiltro }[] = [
  { label: 'Hoje', value: 'hoje' },
  { label: 'Essa semana', value: 'semana' },
  { label: 'Esse mês', value: 'mes' },
];

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('semana');

  const resumo = useMemo(() => {
    const enviados = enviosMock.filter((item) => item.status === 'enviado');
    const agendados = enviosMock.filter((item) => item.status === 'agendado');
    const rascunhos = enviosMock.filter((item) => item.status === 'rascunho');

    return {
      artesAgendadas: agendados.length,
      artesEnviadas: enviados.length,
      campanhasAtivas: 2,
      rascunhos: rascunhos.length,
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#F7F7F5] px-3 py-1.5 text-xs font-medium text-zinc-600">
            <SparklesIcon className="h-4 w-4" />
            Painel da BiaBot
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#181818] sm:text-3xl">
            Suas artes organizadas no WhatsApp.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Veja campanhas, imagens agendadas e próximos envios automáticos para
            o seu grupo.
          </p>
        </div>

        <Link
          href="/dashboard/campanhas/nova"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#181818] px-5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <PlusIcon className="h-5 w-5" />
          Criar campanha
        </Link>
      </section>

      <section className="flex gap-2 overflow-x-auto pb-1">
        {filtros.map((filtro) => {
          const active = periodo === filtro.value;

          return (
            <button
              key={filtro.value}
              type="button"
              onClick={() => setPeriodo(filtro.value)}
              className={`h-11 flex-none rounded-full px-5 text-sm font-medium transition ${
                active
                  ? 'bg-[#181818] text-white'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
              }`}
            >
              {filtro.label}
            </button>
          );
        })}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#F7F7F5]">
            <CalendarDaysIcon className="h-6 w-6 text-[#181818]" />
          </div>

          <p className="text-sm text-zinc-500">Artes agendadas</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#181818]">
            {resumo.artesAgendadas}
          </h2>

          <p className="mt-3 text-xs text-zinc-400">
            Imagens prontas para envio automático.
          </p>
        </div>

        <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#F7F7F5]">
            <PaperAirplaneIcon className="h-6 w-6 text-[#181818]" />
          </div>

          <p className="text-sm text-zinc-500">Enviadas</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#181818]">
            {resumo.artesEnviadas}
          </h2>

          <p className="mt-3 text-xs text-zinc-400">
            Artes já entregues no grupo.
          </p>
        </div>

        <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#F7F7F5]">
            <Squares2X2Icon className="h-6 w-6 text-[#181818]" />
          </div>

          <p className="text-sm text-zinc-500">Campanhas ativas</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#181818]">
            {resumo.campanhasAtivas}
          </h2>

          <p className="mt-3 text-xs text-zinc-400">
            Sequências semanais ou mensais.
          </p>
        </div>

        <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#F7F7F5]">
            <PhotoIcon className="h-6 w-6 text-[#181818]" />
          </div>

          <p className="text-sm text-zinc-500">Rascunhos</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#181818]">
            {resumo.rascunhos}
          </h2>

          <p className="mt-3 text-xs text-zinc-400">
            Artes aguardando configuração.
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#181818]">
                Próximos envios
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Agenda visual das artes que serão entregues no WhatsApp.
              </p>
            </div>

            <Link
              href="/dashboard/agenda"
              className="hidden rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 sm:inline-flex"
            >
              Ver agenda
            </Link>
          </div>

          <div className="space-y-3">
            {enviosMock.map((item) => {
              return (
                <div
                  key={item.id}
                  className="rounded-[28px] border border-zinc-100 bg-[#FAFAFA] p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white">
                        <PhotoIcon className="h-5 w-5 text-zinc-600" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-[#181818]">
                            {item.titulo}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.status === 'enviado'
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.status === 'agendado'
                                  ? 'bg-zinc-900 text-white'
                                  : 'bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            {item.status === 'enviado'
                              ? 'Enviado'
                              : item.status === 'agendado'
                                ? 'Agendado'
                                : 'Rascunho'}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-zinc-500">
                          {item.campanha}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                          <span className="flex items-center gap-1">
                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                            {item.grupo}
                          </span>

                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {item.data}, {item.horario}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:justify-end">
                      <button
                        type="button"
                        className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-[#181818]"
                      >
                        Ver arte
                      </button>

                      <button
                        type="button"
                        className="inline-flex h-10 items-center justify-center rounded-full bg-[#181818] px-4 text-xs font-semibold text-white transition hover:opacity-90"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[32px] border border-zinc-200 bg-[#181818] p-5 text-white shadow-sm sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-white text-[#181818]">
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
            </div>

            <h2 className="mt-6 text-xl font-semibold tracking-tight">
              WhatsApp conectado
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/50">
              A BiaBot vai enviar as artes no grupo configurado usando sua
              instância do WhatsApp.
            </p>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/45">Grupo principal</p>
              <p className="mt-1 text-sm font-semibold">
                Artes - Loja de Perfumes
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#181818]">
                <CheckCircleIcon className="h-4 w-4" />
                Conectado
              </div>
            </div>

            <Link
              href="/dashboard/configuracoes"
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#181818] transition hover:opacity-90"
            >
              Configurar WhatsApp
            </Link>
          </div>

          <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#F7F7F5] text-[#181818]">
              <ArrowPathRoundedSquareIcon className="h-6 w-6" />
            </div>

            <h2 className="mt-6 text-lg font-semibold text-[#181818]">
              Sequência semanal
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Organize suas artes uma vez e deixe a Bia entregar uma imagem por
              dia automaticamente.
            </p>

            <div className="mt-5 space-y-3">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map((dia, index) => (
                <div
                  key={dia}
                  className="flex items-center justify-between rounded-[20px] bg-[#F7F7F5] px-4 py-3"
                >
                  <span className="text-sm font-medium text-[#181818]">
                    {dia}
                  </span>
                  <span className="text-xs text-zinc-500">
                    Arte {index + 1} às 08:00
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}