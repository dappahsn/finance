import { useEffect, useState, type FC, type FormEvent } from 'react';

type AuthMode = 'signin' | 'signup';

interface AuthUser {
  id: number;
  email: string;
  fullName: string;
}

interface ApiResponse {
  user?: AuthUser | null;
  error?: string;
}

async function requestAuth(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse> {
  const response = await fetch(`/api/auth/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const result =
    response.status === 204
      ? {}
      : ((await response.json()) as ApiResponse);

  if (!response.ok) {
    throw new Error(result.error || 'Permintaan autentikasi gagal.');
  }
  return result;
}

const AccountPage: FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    void requestAuth('session')
      .then((result) => {
        if (!isMounted) return;
        setUser(result.user ?? null);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error
            ? `${error.message} Pastikan server API dan MySQL berjalan.`
            : 'Tidak dapat menghubungi server API.',
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage('');
    setErrorMessage('');
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setErrorMessage('');
    try {
      const result = await requestAuth(
        mode === 'signup' ? 'register' : 'login',
        {
          method: 'POST',
          body: JSON.stringify({
            ...(mode === 'signup' ? { fullName: fullName.trim() } : {}),
            email: email.trim(),
            password,
          }),
        },
      );
      setUser(result.user ?? null);
      setMessage(mode === 'signup' ? 'Akun berhasil dibuat.' : 'Berhasil masuk.');
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan. Silakan coba lagi.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const signOut = async () => {
    setErrorMessage('');
    setMessage('');
    try {
      await requestAuth('logout', { method: 'POST' });
      setUser(null);
      setMessage('Kamu sudah keluar dari akun.');
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Tidak dapat keluar dari akun.',
      );
    }
  };

  if (isLoadingSession) {
    return (
      <div
        aria-label="Memuat status akun"
        className="mx-auto flex min-h-[50vh] w-full max-w-6xl items-center justify-center"
        role="status"
      >
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="relative flex min-h-64 flex-col justify-between overflow-hidden rounded-2xl bg-primary p-7 text-on-primary shadow-[0_16px_40px_rgba(87,53,39,0.12)] sm:min-h-80 sm:p-9">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-20 h-56 w-56 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-2 -top-10 h-40 w-40 rounded-full border border-white/10"
        />
        <div className="relative">
          <span className="icon-tile h-12 w-12 rounded-2xl bg-white/10 text-on-primary">
            <span className="material-symbols-outlined text-[25px]">
              account_balance_wallet
            </span>
          </span>
          <p className="mt-7 font-label-sm text-label-sm uppercase tracking-[0.14em] text-on-primary/70">
            Catat.in · Keuangan pribadi
          </p>
          <h1 className="mt-2 max-w-lg font-headline-lg text-headline-lg sm:text-3xl">
            Uang lebih teratur, pikiran lebih tenang.
          </h1>
          <p className="mt-3 max-w-md font-body-md text-body-md text-on-primary/75">
            Masuk atau buat akun untuk mengelola perjalanan finansialmu dalam
            satu tempat.
          </p>
        </div>
        <p className="relative mt-8 font-body-sm text-body-sm text-on-primary/60">
          Privasi dan keamanan akunmu selalu penting.
        </p>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm sm:p-8">
        {user ? (
          <div className="flex min-h-64 flex-col justify-center">
            <span className="icon-tile h-14 w-14 rounded-2xl bg-income-green-subtle text-income-green">
              <span className="material-symbols-outlined text-[28px]">
                verified_user
              </span>
            </span>
            <p className="mt-5 font-label-sm text-label-sm uppercase tracking-[0.12em] text-text-muted">
              Akun aktif
            </p>
            <h2 className="mt-1 break-all font-headline-md text-headline-md text-text-primary">
              {user.fullName || user.email}
            </h2>
            <p className="mt-2 break-all font-body-md text-body-md text-text-secondary">
              {user.email}
            </p>
            <button
              className="mt-7 self-start rounded-xl border border-border-subtle px-4 py-2.5 font-body-md-medium text-body-md-medium text-text-secondary transition hover:bg-surface-container-low"
              onClick={() => void signOut()}
              type="button"
            >
              Keluar
            </button>
          </div>
        ) : (
          <>
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-text-muted">
                Selamat datang
              </p>
              <h2 className="mt-1 font-headline-md text-headline-md text-text-primary">
                {mode === 'signin' ? 'Masuk ke akunmu' : 'Buat akun baru'}
              </h2>
              <p className="mt-2 font-body-md text-body-md text-text-secondary">
                {mode === 'signin'
                  ? 'Lanjutkan mengatur keuangan dengan lebih nyaman.'
                  : 'Mulai langkah kecil untuk keuangan yang lebih tertata.'}
              </p>
            </div>

            <div
              aria-label="Pilih metode autentikasi"
              className="mt-6 grid grid-cols-2 rounded-xl bg-surface-container-low p-1"
              role="group"
            >
              <button
                aria-pressed={mode === 'signin'}
                className={`rounded-lg px-3 py-2.5 font-body-md-medium text-body-md-medium transition ${
                  mode === 'signin'
                    ? 'bg-surface-card text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                onClick={() => changeMode('signin')}
                type="button"
              >
                Sign in
              </button>
              <button
                aria-pressed={mode === 'signup'}
                className={`rounded-lg px-3 py-2.5 font-body-md-medium text-body-md-medium transition ${
                  mode === 'signup'
                    ? 'bg-surface-card text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                onClick={() => changeMode('signup')}
                type="button"
              >
                Sign up
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={submitAuth}>
              {mode === 'signup' && (
                <label className="block space-y-1.5">
                  <span className="font-body-md-medium text-body-md-medium text-text-primary">
                    Nama lengkap
                  </span>
                  <input
                    autoComplete="name"
                    className="h-11 w-full rounded-xl border border-border-subtle bg-surface px-3 text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary"
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Nama kamu"
                    required
                    value={fullName}
                  />
                </label>
              )}
              <label className="block space-y-1.5">
                <span className="font-body-md-medium text-body-md-medium text-text-primary">
                  Email
                </span>
                <input
                  autoComplete="email"
                  className="h-11 w-full rounded-xl border border-border-subtle bg-surface px-3 text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@email.com"
                  required
                  type="email"
                  value={email}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="font-body-md-medium text-body-md-medium text-text-primary">
                  Kata sandi
                </span>
                <input
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
                  className="h-11 w-full rounded-xl border border-border-subtle bg-surface px-3 text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                  type="password"
                  value={password}
                />
              </label>

              {errorMessage && (
                <p
                  className="rounded-xl bg-expense-rose-subtle px-3.5 py-3 font-body-sm text-body-sm text-expense-rose"
                  role="alert"
                >
                  {errorMessage}
                </p>
              )}
              {message && (
                <p
                  className="rounded-xl bg-income-green-subtle px-3.5 py-3 font-body-sm text-body-sm text-income-green"
                  role="status"
                >
                  {message}
                </p>
              )}

              <button
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-body-md-medium text-body-md-medium text-on-primary shadow-sm transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting || isLoadingSession}
                type="submit"
              >
                {isSubmitting && (
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                )}
                {isSubmitting
                  ? 'Memproses...'
                  : mode === 'signin'
                    ? 'Sign in'
                    : 'Buat akun'}
              </button>
            </form>

            <p className="mt-5 text-center font-body-sm text-body-sm text-text-muted">
              {mode === 'signin' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
              <button
                className="font-semibold text-primary hover:text-secondary"
                onClick={() =>
                  changeMode(mode === 'signin' ? 'signup' : 'signin')
                }
                type="button"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </>
        )}
      </section>
    </div>
  );
};

export default AccountPage;
