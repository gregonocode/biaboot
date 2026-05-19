//app\dashboard\configuracoes\whatsapp\page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  PlusIcon,
  QrCodeIcon,
  SparklesIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type ModalStep = 'nome' | 'qrcode';

type WhatsappInstancia = {
  id: string;
  nome: string;
  instance_name: string;
  numero: string | null;
  status: 'desconectado' | 'conectando' | 'conectado' | 'erro';
  qr_code: string | null;
  created_at: string;
};

function getQrCodeImageSrc(value: string | null) {
  if (!value) return null;

  if (value.startsWith('data:image')) {
    return value;
  }

  if (value.startsWith('/')) {
    return value;
  }

  return `data:image/png;base64,${value}`;
}

export default function WhatsappConfiguracoesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<ModalStep>('nome');
  const [instanceName, setInstanceName] = useState('');
  const [instancias, setInstancias] = useState<WhatsappInstancia[]>([]);
  const [currentInstancia, setCurrentInstancia] =
    useState<WhatsappInstancia | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [creatingInstance, setCreatingInstance] = useState(false);
  const [connectedSuccess, setConnectedSuccess] = useState(false);
  const [checkAnimation, setCheckAnimation] = useState<object | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadInstancias = useCallback(async () => {
    const response = await fetch('/api/evolution/instances/list');
    const data = await response.json();

    if (data.ok) {
      setInstancias(data.instancias ?? []);
    }
  }, []);

  useEffect(() => {
    fetch('/check.json')
      .then((res) => res.json())
      .then((data) => setCheckAnimation(data))
      .catch(() => {
        setCheckAnimation(null);
      });
  }, []);

  useEffect(() => {
    fetch('/api/evolution/instances/list')
      .then((response) => response.json())
      .then((data) => {
        if (data.ok) {
          setInstancias(data.instancias ?? []);
        }
      })
      .catch(() => {
        setInstancias([]);
      });
  }, []);

  useEffect(() => {
    if (!modalOpen || step !== 'qrcode' || !currentInstancia || connectedSuccess) {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(
          `/api/evolution/instances/status?instanciaId=${currentInstancia.id}`,
        );

        const data = await response.json();

        if (data.ok && data.status === 'conectado') {
          setConnectedSuccess(true);
          await loadInstancias();
          window.clearInterval(interval);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [modalOpen, step, currentInstancia, connectedSuccess, loadInstancias]);

  function openModal() {
    setModalOpen(true);
    setStep('nome');
    setInstanceName('');
    setCurrentInstancia(null);
    setQrCode(null);
    setPairingCode(null);
    setConnectedSuccess(false);
    setErrorMessage(null);
  }

  function closeModal() {
    setModalOpen(false);
    setStep('nome');
    setInstanceName('');
    setCurrentInstancia(null);
    setQrCode(null);
    setPairingCode(null);
    setConnectedSuccess(false);
    setErrorMessage(null);
  }

  async function handleNextStep() {
    if (!instanceName.trim()) {
      alert('Digite um nome para a instância.');
      return;
    }

    try {
      setCreatingInstance(true);
      setConnectedSuccess(false);
      setErrorMessage(null);
      setQrCode(null);
      setPairingCode(null);

      const createResponse = await fetch('/api/evolution/instances/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: instanceName,
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok || !createData.ok) {
        alert(createData.error ?? 'Erro ao criar instância.');
        return;
      }

      setCurrentInstancia(createData.instancia);

      const qrResponse = await fetch('/api/evolution/instances/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanciaId: createData.instancia.id,
        }),
      });

      const qrData = await qrResponse.json();

      if (!qrResponse.ok || !qrData.ok) {
        alert(qrData.error ?? 'Erro ao gerar QR Code.');
        return;
      }

      setQrCode(qrData.qrCode);
      setPairingCode(qrData.pairingCode ?? null);
      setStep('qrcode');
      await loadInstancias();
    } finally {
      setCreatingInstance(false);
    }
  }

  async function handleDeleteInstancia(instanciaId: string) {
    const confirmDelete = window.confirm(
      'Tem certeza que deseja excluir essa instância? Ela também será removida da Evolution API.',
    );

    if (!confirmDelete) return;

    const response = await fetch('/api/evolution/instances/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanciaId,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      alert(data.error ?? 'Erro ao excluir instância.');
      return;
    }

    await loadInstancias();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#F7F7F5] px-3 py-1.5 text-xs font-medium text-zinc-600">
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            Configuração do WhatsApp
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#181818] sm:text-3xl">
            Conecte seu WhatsApp na BiaBot
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Crie uma instância, escaneie o QR Code e deixe a Bia enviar suas
            artes automaticamente no grupo escolhido.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#181818] px-5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <PlusIcon className="h-5 w-5" />
          Criar instância
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#F7F7F5]">
            <DevicePhoneMobileIcon className="h-6 w-6 text-[#181818]" />
          </div>

          <p className="text-sm text-zinc-500">Instâncias</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#181818]">
            {instancias.length}
          </h2>

          <p className="mt-3 text-xs leading-5 text-zinc-400">
            {instancias.length === 1
              ? 'Uma instância cadastrada.'
              : 'Instâncias cadastradas no momento.'}
          </p>
        </div>

        <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#F7F7F5]">
            <CheckCircleIcon className="h-6 w-6 text-[#181818]" />
          </div>

          <p className="text-sm text-zinc-500">Status</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#181818]">
            {instancias.some((item) => item.status === 'conectado')
              ? 'Conectado'
              : instancias.some((item) => item.status === 'conectando')
                ? 'Conectando'
                : 'Desconectado'}
          </h2>

          <p className="mt-3 text-xs leading-5 text-zinc-400">
            Conecte seu WhatsApp para começar os envios.
          </p>
        </div>

        <div className="rounded-[32px] border border-zinc-200 bg-[#181818] p-5 text-white shadow-sm sm:p-6">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[22px] bg-white text-[#181818]">
            <SparklesIcon className="h-6 w-6" />
          </div>

          <p className="text-sm text-white/50">Plano atual</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Basic</h2>

          <p className="mt-3 text-xs leading-5 text-white/45">
            Permite conectar 1 WhatsApp e enviar artes para 1 grupo.
          </p>
        </div>
      </section>

      {instancias.length > 0 && (
        <section className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#181818]">
                Instâncias conectadas
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Gerencie os WhatsApps conectados na BiaBot.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {instancias.map((instancia) => (
              <div
                key={instancia.id}
                className="rounded-[28px] border border-zinc-100 bg-[#FAFAFA] p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-zinc-600" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-[#181818]">
                          {instancia.nome}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            instancia.status === 'conectado'
                              ? 'bg-emerald-50 text-emerald-700'
                              : instancia.status === 'conectando'
                                ? 'bg-zinc-900 text-white'
                                : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {instancia.status === 'conectado'
                            ? 'Conectado'
                            : instancia.status === 'conectando'
                              ? 'Conectando'
                              : 'Desconectado'}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-zinc-500">
                        {instancia.instance_name}
                      </p>

                      <p className="mt-2 text-xs text-zinc-400">
                        {instancia.numero
                          ? `Número: ${instancia.numero}`
                          : 'Número ainda não identificado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-10 items-center justify-center rounded-full bg-[#181818] px-4 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={instancia.status !== 'conectado'}
                    >
                      Conectar a um grupo
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteInstancia(instancia.id)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-600 transition hover:border-red-200 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {instancias.length === 0 && (
        <section className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#181818]">
                Nenhum WhatsApp conectado
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                Depois que você criar a instância, a BiaBot vai gerar um QR Code.
                Escaneie pelo WhatsApp Business ou WhatsApp normal para conectar.
              </p>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-[#F7F7F5] px-5 text-sm font-semibold text-[#181818] transition hover:border-zinc-300"
            >
              <QrCodeIcon className="h-5 w-5" />
              Conectar agora
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] bg-[#F7F7F5] p-4">
              <p className="text-sm font-medium text-[#181818]">
                1. Crie a instância
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Dê um nome para identificar esse WhatsApp.
              </p>
            </div>

            <div className="rounded-[24px] bg-[#F7F7F5] p-4">
              <p className="text-sm font-medium text-[#181818]">
                2. Escaneie o QR Code
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Use o aparelho onde está seu WhatsApp.
              </p>
            </div>

            <div className="rounded-[24px] bg-[#F7F7F5] p-4">
              <p className="text-sm font-medium text-[#181818]">
                3. Escolha o grupo
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Depois vamos listar os grupos disponíveis.
              </p>
            </div>
          </div>
        </section>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[36px] bg-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow-sm transition hover:bg-white hover:text-[#181818]"
              aria-label="Fechar modal"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="relative hidden min-h-[560px] overflow-hidden bg-[#181818] p-8 text-white lg:block">
              <div className="absolute -left-24 top-14 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -right-24 bottom-14 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-white text-[#181818]">
                    {step === 'nome' ? (
                      <ChatBubbleLeftRightIcon className="h-7 w-7" />
                    ) : (
                      <QrCodeIcon className="h-7 w-7" />
                    )}
                  </div>

                  <h2 className="mt-8 max-w-sm text-3xl font-semibold leading-tight tracking-tight">
                    {step === 'nome'
                      ? 'Crie uma instância para conectar seu WhatsApp.'
                      : 'Escaneie o QR Code para finalizar a conexão.'}
                  </h2>

                  <p className="mt-4 max-w-sm text-sm leading-6 text-white/50">
                    {step === 'nome'
                      ? 'Essa instância será usada pela BiaBot para enviar suas artes automaticamente no grupo configurado.'
                      : 'Depois que o WhatsApp conectar, vamos salvar essa instância e liberar a escolha dos grupos.'}
                  </p>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-medium">
                    {step === 'nome' ? 'Etapa 1 de 2' : 'Etapa 2 de 2'}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    {step === 'nome'
                      ? 'Informe um nome simples para identificar esse WhatsApp.'
                      : 'Mantenha essa tela aberta enquanto escaneia o QR Code.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-[92vh] overflow-y-auto bg-[#F7F7F5] p-5 sm:p-8">
              <div className="mb-6 flex items-center gap-2">
                <div
                  className={`h-2 flex-1 rounded-full ${
                    step === 'nome' || step === 'qrcode'
                      ? 'bg-[#181818]'
                      : 'bg-zinc-200'
                  }`}
                />
                <div
                  className={`h-2 flex-1 rounded-full ${
                    step === 'qrcode'
                      ? connectedSuccess
                        ? 'bg-emerald-600'
                        : 'bg-[#181818]'
                      : 'bg-zinc-200'
                  }`}
                />
              </div>

              {step === 'nome' && (
                <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#F7F7F5]">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-[#181818]" />
                    </div>

                    <h3 className="text-xl font-semibold text-[#181818]">
                      Nome da instância
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      Escolha um nome para identificar esse WhatsApp dentro da
                      BiaBot.
                    </p>

                    {errorMessage && (
                      <p className="mt-3 rounded-[18px] bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                        {errorMessage}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="instanceName"
                      className="mb-2 block text-sm font-medium text-zinc-700"
                    >
                      Nome
                    </label>

                    <input
                      id="instanceName"
                      type="text"
                      value={instanceName}
                      onChange={(e) => setInstanceName(e.target.value)}
                      placeholder="Ex: WhatsApp da loja"
                      className="h-14 w-full rounded-full border border-zinc-200 bg-[#FAFAFA] px-5 text-sm text-[#181818] outline-none transition placeholder:text-zinc-400 focus:border-[#181818] focus:bg-white"
                    />

                    <p className="mt-2 text-xs leading-5 text-zinc-400">
                      Esse nome é apenas interno. Seus clientes não verão essa
                      informação.
                    </p>
                  </div>

                  <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-[#181818]"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={creatingInstance}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#181818] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {creatingInstance ? 'Criando instância...' : 'Continuar'}
                      {!creatingInstance && <ArrowRightIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {step === 'qrcode' && (
                <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[22px] bg-[#F7F7F5]">
                      <QrCodeIcon className="h-6 w-6 text-[#181818]" />
                    </div>

                    <h3 className="text-xl font-semibold text-[#181818]">
                      Escaneie o QR Code
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      Abra o WhatsApp no celular e escaneie o QR Code para
                      conectar a instância.
                    </p>
                  </div>

                  <div className="rounded-[32px] border border-dashed border-zinc-300 bg-[#FAFAFA] p-5">
                    <div className="mx-auto flex aspect-square w-full max-w-xs items-center justify-center rounded-[28px] bg-white shadow-sm">
                      {connectedSuccess ? (
                        <div className="text-center">
                          {checkAnimation && (
                            <div className="mx-auto h-32 w-32">
                              <Lottie animationData={checkAnimation} loop={false} />
                            </div>
                          )}

                          <p className="mt-4 text-sm font-semibold text-emerald-700">
                            WhatsApp conectado!
                          </p>
                          <p className="mt-1 text-xs text-zinc-400">
                            Agora você já pode conectar um grupo.
                          </p>
                        </div>
                      ) : getQrCodeImageSrc(qrCode) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getQrCodeImageSrc(qrCode)!}
                          alt="QR Code para conectar WhatsApp"
                          className="h-full w-full rounded-[24px] object-contain p-4"
                        />
                      ) : (
                        <div className="text-center">
                          <QrCodeIcon className="mx-auto h-24 w-24 text-zinc-300" />
                          <p className="mt-4 text-sm font-medium text-[#181818]">
                            Gerando QR Code...
                          </p>
                          <p className="mt-1 text-xs text-zinc-400">
                            Aguarde alguns segundos
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {errorMessage && (
                    <p className="mt-4 rounded-[18px] bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                      {errorMessage}
                    </p>
                  )}

                  {pairingCode && (
                    <div className="mt-4 rounded-[24px] bg-[#F7F7F5] p-4">
                      <p className="text-xs text-zinc-500">
                        Código de pareamento
                      </p>
                      <p className="mt-1 text-lg font-semibold tracking-tight text-[#181818]">
                        {pairingCode}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 rounded-[24px] bg-[#F7F7F5] p-4">
                    <p className="text-sm font-medium text-[#181818]">
                      Instância: {currentInstancia?.nome ?? instanceName}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Status:{' '}
                      {connectedSuccess
                        ? 'conectado'
                        : 'aguardando leitura do QR Code'}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('nome');
                        setErrorMessage(null);
                      }}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-[#181818]"
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                      Voltar
                    </button>

                    <button
                      type="button"
                      onClick={closeModal}
                      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition hover:opacity-90 ${
                        connectedSuccess ? 'bg-emerald-600' : 'bg-[#181818]'
                      }`}
                    >
                      {connectedSuccess ? 'OK' : 'Finalizar depois'}
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
