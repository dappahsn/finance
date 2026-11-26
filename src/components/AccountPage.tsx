import { useState, type FC, type FormEvent } from 'react';
import { requestAuth, type AuthUser } from '../lib/auth';

type AuthMode = 'signin' | 'signup';

interface AccountPageProps {
  user: AuthUser | null;
  onUserChange: (user: AuthUser | null) => void;
  initialError?: string;
}

const AccountPage: FC<AccountPageProps> = ({
  user,
  onUserChange,
  initialError = '',
}) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState(initialError);

  const isSignUp = mode === 'signup';

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage('');
    setErrorMessage('');
    setShowPassword(false);
  };

  const submitAuth = async (
    event: FormEvent<HTMLFormElement>,
    targetMode: AuthMode,
  ) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setErrorMessage('');
    try {
      const result = await requestAuth(
        targetMode === 'signup' ? 'register' : 'login',
        {
          method: 'POST',
          body: JSON.stringify({
            ...(targetMode === 'signup' ? { fullName: fullName.trim() } : {}),
            email: email.trim(),
            password,
          }),
        },
      );
      onUserChange(result.user ?? null);
      setMessage(
        targetMode === 'signup' ? 'Akun berhasil dibuat.' : 'Berhasil masuk.',
      );
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
      onUserChange(null);
      setMessage('Kamu sudah keluar dari akun.');
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Tidak dapat keluar dari akun.',
      );
    }
  };

  if (user) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <section className="rounded-3xl border border-border-subtle bg-surface-card p-7 shadow-[0_16px_48px_rgba(48,41,35,0.08)] sm:p-9">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="icon-tile h-14 w-14 rounded-2xl bg-income-green-subtle text-income-green">
                <span className="material-symbols-outlined text-[28px]">
                  verified_user
                </span>
              </span>
              <div>
                <p className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-text-muted">
                  Akun aktif
                </p>
                <h2 className="mt-1 break-all font-headline-md text-headline-md text-text-primary">
                  {user.fullName || user.email}
                </h2>
                <p className="mt-0.5 break-all font-body-md text-body-md text-text-secondary">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {errorMessage && (
            <p
              className="mt-5 rounded-xl bg-expense-rose-subtle px-3.5 py-3 font-body-sm text-body-sm text-expense-rose"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <div className="mt-7 flex items-center justify-between border-t border-border-subtle pt-5">
            <p className="font-body-sm text-body-sm text-text-muted">
              finance · Keuangan pribadi
            </p>
            <button
              className="rounded-full border border-border-subtle px-5 py-2.5 font-body-md-medium text-body-md-medium text-text-secondary transition hover:bg-surface-container-low hover:text-text-primary"
              onClick={() => void signOut()}
              type="button"
            >
              Keluar
            </button>
          </div>
        </section>
      </div>
    );
  }

  const renderBrandBadge = (inverted = false) => (
    <div className="inline-flex items-center gap-2.5">
      <span
        className={`icon-tile h-8 w-8 rounded-lg ${
          inverted
            ? 'bg-white/15 text-on-primary'
            : 'bg-primary/10 text-primary'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">
          account_balance_wallet
        </span>
      </span>
      <span
        className={`font-headline-sm text-headline-sm tracking-tight ${
          inverted ? 'text-on-primary' : 'text-text-primary'
        }`}
      >
        finance
      </span>
    </div>
  );

  const renderFeedback = () => (
    <>
      {errorMessage && (
        <p
          className="rounded-xl bg-expense-rose-subtle px-3.5 py-2.5 text-left font-body-sm text-body-sm text-expense-rose"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
      {message && (
        <p
          className="rounded-xl bg-income-green-subtle px-3.5 py-2.5 text-left font-body-sm text-body-sm text-income-green"
          role="status"
        >
          {message}
        </p>
      )}
    </>
  );

  const renderSignInForm = (isActive: boolean) => (
    <form
      aria-hidden={!isActive}
      className="flex w-full max-w-[320px] flex-col items-center text-center"
      onSubmit={(event) => void submitAuth(event, 'signin')}
    >
      <h2 className="font-headline-lg text-headline-lg text-primary sm:text-[30px]">
        Masuk ke finance
      </h2>
      <p className="mt-2 font-body-sm text-body-sm text-text-muted">
        Gunakan akun email Anda untuk melanjutkan
      </p>

      <div className="mt-7 w-full space-y-3">
        <label className="flex h-12 items-center gap-3 rounded-xl bg-surface-container-low/80 px-3.5 ring-1 ring-transparent transition focus-within:bg-surface-card focus-within:ring-primary/40">
          <span className="material-symbols-outlined text-[19px] text-text-muted">
            mail
          </span>
          <input
            aria-label="Email"
            autoComplete="email"
            className="h-full min-w-0 flex-1 bg-transparent font-body-md text-body-md text-text-primary outline-none placeholder:text-text-muted"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            tabIndex={isActive ? 0 : -1}
            type="email"
            value={email}
          />
        </label>

        <label className="flex h-12 items-center gap-3 rounded-xl bg-surface-container-low/80 px-3.5 ring-1 ring-transparent transition focus-within:bg-surface-card focus-within:ring-primary/40">
          <span className="material-symbols-outlined text-[19px] text-text-muted">
            lock
          </span>
          <input
            aria-label="Kata sandi"
            autoComplete="current-password"
            className="h-full min-w-0 flex-1 bg-transparent font-body-md text-body-md text-text-primary outline-none placeholder:text-text-muted"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Kata sandi"
            required
            tabIndex={isActive ? 0 : -1}
            type={showPassword ? 'text' : 'password'}
            value={password}
          />
          <button
            aria-label={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
            className="text-text-muted transition hover:text-text-primary"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </label>
      </div>

      <div className="mt-4 w-full">{isActive && renderFeedback()}</div>

      <button
        className="mt-6 inline-flex h-11 min-w-[168px] items-center justify-center gap-2 rounded-full bg-primary px-8 font-label-md text-label-md uppercase tracking-[0.08em] text-on-primary shadow-[0_10px_24px_rgba(164,92,67,0.28)] transition hover:bg-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        tabIndex={isActive ? 0 : -1}
        type="submit"
      >
        {isSubmitting && isActive && (
          <span className="material-symbols-outlined animate-spin text-[17px]">
            progress_activity
          </span>
        )}
        {isSubmitting && isActive ? 'Memproses...' : 'Sign in'}
      </button>
    </form>
  );

  const renderSignUpForm = (isActive: boolean) => (
    <form
      aria-hidden={!isActive}
      className="flex w-full max-w-[320px] flex-col items-center text-center"
      onSubmit={(event) => void submitAuth(event, 'signup')}
    >
      <h2 className="font-headline-lg text-headline-lg text-primary sm:text-[30px]">
        Buat Akun
      </h2>
      <p className="mt-2 font-body-sm text-body-sm text-text-muted">
        Mulai kelola keuanganmu dengan lebih rapi
      </p>

      <div className="mt-6 w-full space-y-3">
        <label className="flex h-12 items-center gap-3 rounded-xl bg-surface-container-low/80 px-3.5 ring-1 ring-transparent transition focus-within:bg-surface-card focus-within:ring-primary/40">
          <span className="material-symbols-outlined text-[19px] text-text-muted">
            person
          </span>
          <input
            aria-label="Nama lengkap"
            autoComplete="name"
            className="h-full min-w-0 flex-1 bg-transparent font-body-md text-body-md text-text-primary outline-none placeholder:text-text-muted"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Nama lengkap"
            required
            tabIndex={isActive ? 0 : -1}
            value={fullName}
          />
        </label>

        <label className="flex h-12 items-center gap-3 rounded-xl bg-surface-container-low/80 px-3.5 ring-1 ring-transparent transition focus-within:bg-surface-card focus-within:ring-primary/40">
          <span className="material-symbols-outlined text-[19px] text-text-muted">
            mail
          </span>
          <input
            aria-label="Email"
            autoComplete="email"
            className="h-full min-w-0 flex-1 bg-transparent font-body-md text-body-md text-text-primary outline-none placeholder:text-text-muted"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            tabIndex={isActive ? 0 : -1}
            type="email"
            value={email}
          />
        </label>

        <label className="flex h-12 items-center gap-3 rounded-xl bg-surface-container-low/80 px-3.5 ring-1 ring-transparent transition focus-within:bg-surface-card focus-within:ring-primary/40">
          <span className="material-symbols-outlined text-[19px] text-text-muted">
            lock
          </span>
          <input
            aria-label="Kata sandi"
            autoComplete="new-password"
            className="h-full min-w-0 flex-1 bg-transparent font-body-md text-body-md text-text-primary outline-none placeholder:text-text-muted"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimal 8 karakter"
            required
            tabIndex={isActive ? 0 : -1}
            type={showPassword ? 'text' : 'password'}
            value={password}
          />
          <button
            aria-label={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
            className="text-text-muted transition hover:text-text-primary"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </label>
      </div>

      <div className="mt-4 w-full">{isActive && renderFeedback()}</div>

      <button
        className="mt-6 inline-flex h-11 min-w-[168px] items-center justify-center gap-2 rounded-full bg-primary px-8 font-label-md text-label-md uppercase tracking-[0.08em] text-on-primary shadow-[0_10px_24px_rgba(164,92,67,0.28)] transition hover:bg-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        tabIndex={isActive ? 0 : -1}
        type="submit"
      >
        {isSubmitting && isActive && (
          <span className="material-symbols-outlined animate-spin text-[17px]">
            progress_activity
          </span>
        )}
        {isSubmitting && isActive ? 'Memproses...' : 'Sign up'}
      </button>
    </form>
  );

  return (
    <div className="relative mx-auto flex w-full max-w-[920px] items-center justify-center">
      {/* Subtle decorative backdrop shapes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -left-10 hidden h-36 w-36 rounded-full bg-primary-fixed/80 blur-[1px] md:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 hidden h-28 w-28 rotate-12 rounded-3xl bg-tertiary-fixed/80 md:block"
      />

      {/* Desktop sliding card */}
      <div className="relative hidden min-h-[560px] w-full overflow-hidden rounded-3xl border border-border-subtle bg-surface-card shadow-[0_24px_60px_rgba(48,41,35,0.10)] md:block">
        {/* Top-left brand when Sign In is visible */}
        <div
          className={`pointer-events-none absolute left-8 top-7 z-20 transition-opacity duration-500 ${
            isSignUp ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {renderBrandBadge(false)}
        </div>

        {/* Sign In panel (left half) */}
        <div
          className={`absolute left-0 top-0 flex h-full w-1/2 items-center justify-center px-10 transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
            isSignUp
              ? 'pointer-events-none translate-x-full opacity-0'
              : 'pointer-events-auto z-20 translate-x-0 opacity-100'
          }`}
        >
          {renderSignInForm(!isSignUp)}
        </div>

        {/* Sign Up panel (slides from left to right half) */}
        <div
          className={`absolute left-0 top-0 flex h-full w-1/2 items-center justify-center px-10 transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
            isSignUp
              ? 'pointer-events-auto z-20 translate-x-full opacity-100'
              : 'pointer-events-none z-10 translate-x-0 opacity-0'
          }`}
        >
          {renderSignUpForm(isSignUp)}
        </div>

        {/* Sliding Overlay */}
        <div
          className={`absolute left-1/2 top-0 z-30 h-full w-1/2 overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
            isSignUp ? '-translate-x-full' : 'translate-x-0'
          }`}
        >
          <div
            className={`relative -left-full flex h-full w-[200%] bg-gradient-to-br from-primary via-primary to-primary-container text-on-primary transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
              isSignUp ? 'translate-x-1/2' : 'translate-x-0'
            }`}
          >
            {/* Geometric accents inside overlay */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-14 top-16 h-20 w-20 rotate-45 rounded-2xl bg-white/[0.06]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-14 left-1/3 h-28 w-28 rounded-full bg-white/[0.06]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-14 top-12 h-24 w-24 rotate-12 rounded-full border border-white/15"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-12 right-16 h-16 w-16 rotate-45 rounded-xl bg-white/[0.07]"
            />

            {/* Overlay Left (visible when Sign Up is active -> switch back to Sign In) */}
            <div className="relative flex h-full w-1/2 flex-col items-center justify-center px-12 text-center">
              <div className="absolute left-8 top-7">{renderBrandBadge(true)}</div>
              <h2 className="font-headline-lg text-headline-lg sm:text-[32px]">
                Selamat Datang!
              </h2>
              <p className="mt-3 max-w-[260px] font-body-md text-body-md leading-relaxed text-on-primary/80">
                Sudah punya akun? Masuk dengan data akunmu untuk melanjutkan.
              </p>
              <button
                className="mt-7 inline-flex h-11 min-w-[160px] items-center justify-center rounded-full border border-white/80 px-8 font-label-md text-label-md uppercase tracking-[0.08em] text-on-primary transition hover:bg-white/15 active:scale-[0.98]"
                onClick={() => changeMode('signin')}
                tabIndex={isSignUp ? 0 : -1}
                type="button"
              >
                Sign in
              </button>
            </div>

            {/* Overlay Right (visible when Sign In is active -> switch to Sign Up) */}
            <div className="relative flex h-full w-1/2 flex-col items-center justify-center px-12 text-center">
              <h2 className="font-headline-lg text-headline-lg sm:text-[32px]">
                Halo, Teman!
              </h2>
              <p className="mt-3 max-w-[260px] font-body-md text-body-md leading-relaxed text-on-primary/80">
                Belum punya akun? Daftar sekarang dan mulai atur keuanganmu.
              </p>
              <button
                className="mt-7 inline-flex h-11 min-w-[160px] items-center justify-center rounded-full border border-white/80 px-8 font-label-md text-label-md uppercase tracking-[0.08em] text-on-primary transition hover:bg-white/15 active:scale-[0.98]"
                onClick={() => changeMode('signup')}
                tabIndex={isSignUp ? -1 : 0}
                type="button"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile clean sliding card */}
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border-subtle bg-surface-card shadow-[0_18px_48px_rgba(48,41,35,0.09)] md:hidden">
        <div className="bg-gradient-to-br from-primary to-primary-container px-6 py-6 text-on-primary">
          {renderBrandBadge(true)}
          <div
            aria-label="Pilih mode akun"
            className="mt-5 grid grid-cols-2 rounded-full bg-black/15 p-1"
            role="group"
          >
            <button
              aria-pressed={!isSignUp}
              className={`rounded-full py-2 font-label-md text-label-md transition ${
                !isSignUp
                  ? 'bg-surface-card text-primary shadow-sm'
                  : 'text-on-primary/85 hover:text-on-primary'
              }`}
              onClick={() => changeMode('signin')}
              type="button"
            >
              Sign in
            </button>
            <button
              aria-pressed={isSignUp}
              className={`rounded-full py-2 font-label-md text-label-md transition ${
                isSignUp
                  ? 'bg-surface-card text-primary shadow-sm'
                  : 'text-on-primary/85 hover:text-on-primary'
              }`}
              onClick={() => changeMode('signup')}
              type="button"
            >
              Sign up
            </button>
          </div>
        </div>

        <div className="overflow-hidden py-8">
          <div
            className={`flex w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] ${
              isSignUp ? '-translate-x-1/2' : 'translate-x-0'
            }`}
          >
            <div className="flex w-1/2 justify-center px-6">
              {renderSignInForm(!isSignUp)}
            </div>
            <div className="flex w-1/2 justify-center px-6">
              {renderSignUpForm(isSignUp)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
