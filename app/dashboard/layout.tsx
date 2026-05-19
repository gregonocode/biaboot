'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import {
  ArrowLeftOnRectangleIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  HomeIcon,
  PhotoIcon,
  SparklesIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Campanhas',
    href: '/dashboard/campanhas',
    icon: Squares2X2Icon,
  },
  {
    name: 'Artes',
    href: '/dashboard/artes',
    icon: PhotoIcon,
  },
  {
    name: 'Agenda',
    href: '/dashboard/agenda',
    icon: CalendarDaysIcon,
  },
  {
    name: 'Configurações',
    href: '/dashboard/configuracoes',
    icon: Cog6ToothIcon,
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  function isActive(href: string) {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }

    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Sidebar desktop */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-zinc-200 bg-white p-4 lg:block">
        <div className="flex h-full flex-col">
          <Link
            href="/dashboard"
            className="mb-8 flex items-center gap-3 rounded-[28px] px-3 py-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#181818] text-white">
              <SparklesIcon className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-lg font-semibold tracking-tight text-[#181818]">
                BiaBot
              </h1>
              <p className="text-xs text-zinc-400">
                Assistente de artes
              </p>
            </div>
          </Link>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-12 items-center gap-3 rounded-full px-4 text-sm font-medium transition ${
                    active
                      ? 'bg-[#181818] text-white'
                      : 'text-zinc-500 hover:bg-[#F7F7F5] hover:text-[#181818]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[28px] bg-[#F7F7F5] p-4">
            <p className="text-sm font-medium text-[#181818]">
              Plano Basic
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Envie artes prontas automaticamente para seu grupo no WhatsApp.
            </p>

            <button
              type="button"
              className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-[#181818] transition hover:bg-zinc-100"
            >
              Ver planos
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-[#181818]"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-[#F7F7F5]/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[20px] bg-[#181818] text-white">
              <SparklesIcon className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-base font-semibold text-[#181818]">
                BiaBot
              </h1>
              <p className="text-xs text-zinc-400">
                Assistente de artes
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm"
            aria-label="Sair"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="pb-28 lg:ml-72 lg:pb-8">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

      {/* Bottom navigation mobile */}
      <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-full border border-zinc-200 bg-white/95 p-2 shadow-lg shadow-zinc-200/70 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-14 flex-col items-center justify-center rounded-full text-[10px] font-medium transition ${
                  active
                    ? 'bg-[#181818] text-white'
                    : 'text-zinc-400 hover:bg-[#F7F7F5] hover:text-[#181818]'
                }`}
              >
                <Icon className="mb-0.5 h-5 w-5" />
                {item.name === 'Configurações' ? 'Config' : item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
