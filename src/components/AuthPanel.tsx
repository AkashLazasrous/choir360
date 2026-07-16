import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { User } from 'firebase/auth';
import { Language, Role } from '../types';
import type { SignInResult } from '../hooks/useFirebaseAuth';
import { t } from '../i18n/ui';

interface AuthPanelProps {
  lang?: Language;
  user: User | null;
  isConfigured: boolean;
  authError: string | null;
  effectiveRole: Role;
  onSignIn: (identifier: string, password: string) => Promise<SignInResult | void>;
  onLogout: () => Promise<void>;
  onRefreshToken: () => Promise<void>;
  onOpenRegistration?: () => void;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({
  lang = 'en',
  user,
  isConfigured,
  authError,
  effectiveRole,
  onSignIn,
  onLogout,
  onOpenRegistration,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError('');
    setInfoMessage('');
    setIsSubmitting(true);
    try {
      const result = await onSignIn(identifier.trim(), password);
      setPassword('');
      if (result?.pendingApproval || result?.role === 'public_user') {
        setInfoMessage(result.message || t(lang, 'awaitingApproval'));
      }
    } catch {
      // authError / local errors surface below
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="apple-card font-apple p-4 text-[13px] text-[#8a6a10]" style={{ background: 'rgba(245,194,76,0.14)' }}>
        {t(lang, 'demoMode')}
      </div>
    );
  }

  if (user && !user.isAnonymous) {
    return (
      <div className="apple-card font-apple p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(14,61,76,0.1)] text-[#0e3d4c]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-[#1d1d1f]">{user.displayName || user.email}</p>
            <p className="text-[12px] text-[#86868b]">
              {effectiveRole.replace(/_/g, ' ')} · {t(lang, 'liveSyncActive')}
            </p>
          </div>
        </div>
        {effectiveRole === 'public_user' && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-900">
            {t(lang, 'awaitingApproval')}
          </p>
        )}
        <button
          type="button"
          onClick={() => void onLogout()}
          className="btn-pill btn-pill-secondary mt-3 w-full !text-[13px]"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t(lang, 'signOut')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="apple-card font-apple p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">{t(lang, 'signIn')}</p>
          <p className="mt-0.5 text-[12px] text-[#86868b]">
            {t(lang, 'signInHint')}
          </p>
        </div>
        {onOpenRegistration && (
          <button
            type="button"
            onClick={onOpenRegistration}
            className="btn-pill-link !text-[13px]"
          >
            {t(lang, 'register')}
          </button>
        )}
      </div>
      <input
        type="text"
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        placeholder={t(lang, 'emailOrMobile')}
        autoComplete="username"
        className="apple-input mb-2 !text-[15px]"
        required
      />
      <div className="relative mb-2">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t(lang, 'passwordDob')}
          autoComplete="current-password"
          inputMode="numeric"
          className="apple-input !pr-12 !text-[15px]"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="absolute right-1.5 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#0e3d4c] hover:bg-black/[0.04]"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {(localError || authError) && (
        <p className="mb-2 text-[13px] font-medium text-[#d70015]">{localError || authError}</p>
      )}
      {infoMessage && (
        <p className="mb-2 text-[13px] font-medium text-amber-800">{infoMessage}</p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-pill btn-pill-primary mt-1 w-full !text-[15px]"
      >
        <LogIn className="h-4 w-4" />
        {isSubmitting ? t(lang, 'signingIn') : t(lang, 'signIn')}
      </button>
      {onOpenRegistration && (
        <p className="mt-3 text-center text-[12px] text-[#86868b]">
          {t(lang, 'newToChoir')}{' '}
          <button type="button" onClick={onOpenRegistration} className="font-semibold text-[#0e3d4c] underline-offset-2 hover:underline">
            {t(lang, 'submitRegistration')}
          </button>
        </p>
      )}
    </form>
  );
};
