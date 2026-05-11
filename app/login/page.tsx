'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhotoIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError(null);

    if (!email || !senha) {
      setError('Preencha seu email e senha para continuar.');
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (signInError) {
      setError(signInError.message || 'Erro ao entrar. Verifique seus dados.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] lg:grid lg:grid-cols-2">
      {/* Branding - Desktop */}
      <section className="relative hidden min-h-screen overflow-hidden bg-[#181818] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#E879F9]/20 blur-3xl" />
        
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-white text-[#181818] shadow-sm">
            <SparklesIcon className="h-7 w-7" />
          </div>

          <div>
            <h1 className="text-xl font-semibold tracking-tight">BiaBot</h1>
            <p className="text-xs text-white/50">
              Sua assistente de artes no WhatsApp
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
            <ShieldCheckIcon className="h-5 w-5" />
            Organize uma vez. Receba suas artes todos os dias.
          </div>

          <h2 className="max-w-lg text-5xl font-semibold leading-[1.05] tracking-tight">
            Automatize o envio das suas artes direto no WhatsApp.
          </h2>

          <p className="mt-5 max-w-md text-base leading-7 text-white/55">
            Suba suas imagens, escolha os dias da semana e deixe a Bia entregar
            tudo no grupo certo, no horário certo.
          </p>

          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
              <PhotoIcon className="mb-4 h-6 w-6 text-white/80" />
              <p className="text-sm font-medium">Artes prontas</p>
              <p className="mt-1 text-xs leading-5 text-white/45">
                Envie imagens já criadas.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
              <CalendarDaysIcon className="mb-4 h-6 w-6 text-white/80" />
              <p className="text-sm font-medium">Agenda semanal</p>
              <p className="mt-1 text-xs leading-5 text-white/45">
                Programe por dia e horário.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
              <ChatBubbleLeftRightIcon className="mb-4 h-6 w-6 text-white/80" />
              <p className="text-sm font-medium">WhatsApp</p>
              <p className="mt-1 text-xs leading-5 text-white/45">
                Receba tudo em um grupo.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 rounded-[32px] border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="mt-0.5 h-6 w-6 flex-none text-white" />

            <div>
              <p className="text-sm font-medium">MVP em modo demonstração</p>
              <p className="mt-1 text-sm leading-6 text-white/45">
                Nesta primeira versão, a BiaBot organiza e envia artes manuais
                em horários programados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Login */}
      <section className="flex min-h-screen items-center justify-center px-4 py-8 lg:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[28px] bg-[#181818] shadow-sm">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-[#181818]">
              BiaBot
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Organize suas artes e receba tudo automaticamente no WhatsApp.
            </p>
          </div>

          <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#181818]">
                Entrar na BiaBot
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Acesse seu painel para organizar campanhas, imagens e horários.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Email
                </label>

                <div className="relative">
                  <EnvelopeIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="h-14 w-full rounded-full border border-zinc-200 bg-[#FAFAFA] pl-12 pr-4 text-sm text-[#181818] outline-none transition placeholder:text-zinc-400 focus:border-[#181818] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="senha"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Senha
                </label>

                <div className="relative">
                  <LockClosedIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

                  <input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    className="h-14 w-full rounded-full border border-zinc-200 bg-[#FAFAFA] pl-12 pr-4 text-sm text-[#181818] outline-none transition placeholder:text-zinc-400 focus:border-[#181818] focus:bg-white"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#181818] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Entrando...' : 'Entrar no painel'}

                {!loading && <ArrowRightIcon className="h-5 w-5" />}
              </button>
            </form>

            <div className="mt-5 rounded-[24px] bg-[#F7F7F5] p-4">
              <div className="flex gap-3">
                <ClockIcon className="mt-0.5 h-5 w-5 flex-none text-zinc-500" />

                <p className="text-xs leading-5 text-zinc-500">
                  <strong className="font-semibold text-zinc-700">
                    Acesso seguro:
                  </strong>{' '}
                  use o email e a senha cadastrados no Supabase para entrar no
                  painel.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-400">
            BiaBot © {new Date().getFullYear()}
          </p>
        </div>
      </section>
    </main>
  );
}
