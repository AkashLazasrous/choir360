import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, LogOut, ShieldCheck, UserPlus } from 'lucide-react';
import { User } from 'firebase/auth';
import { Role } from '../types';

interface AuthPanelProps {
  user: User | null;
  isConfigured: boolean;
  authError: string | null;
  effectiveRole: Role;
  onSignIn: (email: string, password: string) => Promise<void>;
  onCreateAccount: (email: string, password: string, displayName: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onRefreshToken: () => Promise<void>;
  onOpenRegistration?: () => void;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({
  user,
  isConfigured,
  authError,
  effectiveRole,
  onSignIn,
  onCreateAccount,
  onLogout,
  onOpenRegistration,
}) => {
  const [mode, setMode] = useState<'signin' | 'create'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError('');
    if (mode === 'create' && password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await onSignIn(email, password);
      } else {
        const displayName = [firstName, lastName].filter(Boolean).join(' ').trim();
        await onCreateAccount(email, password, displayName);
        onOpenRegistration?.();
      }
      setPassword('');
      setConfirmPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'create' : 'signin');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setLocalError('');
  };

  if (!isConfigured) {
    return (
      <div className="apple-card font-apple p-4 text-[13px] text-[#8a6a10]" style={{ background: 'rgba(245,194,76,0.14)' }}>
        Live sign in is not configured. The app is running in local demo mode.
      </div>
    );
  }

  if (user && !user.isAnonymous) {
    return (
      <div className="apple-card font-apple p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(24,57,47,0.1)] text-[#18392f]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-[#1d1d1f]">{user.displayName || user.email}</p>
            <p className="text-[12px] text-[#86868b]">
              {effectiveRole.replace(/_/g, ' ')} · live sync active
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="btn-pill btn-pill-secondary mt-3 w-full !text-[13px]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="apple-card font-apple p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </p>
          <p className="mt-0.5 text-[12px] text-[#86868b]">
            {mode === 'signin' ? 'Use your registered choir email' : 'Create login, then complete member form'}
          </p>
        </div>
        <button
          type="button"
          onClick={switchMode}
          className="btn-pill-link !text-[13px]"
        >
          {mode === 'signin' ? 'Create account' : 'Sign in'}
        </button>
      </div>
      {mode === 'create' && (
        <div className="mb-2 grid grid-cols-2 gap-2">
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="First name"
            autoComplete="given-name"
            className="apple-input !text-[15px]"
            required
          />
          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Last name"
            autoComplete="family-name"
            className="apple-input !text-[15px]"
            required
          />
        </div>
      )}
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Registered email address"
        autoComplete="email"
        className="apple-input mb-2 !text-[15px]"
        required
      />
      <div className="relative mb-2">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          minLength={mode === 'create' ? 8 : undefined}
          className="apple-input !pr-12 !text-[15px]"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="absolute right-1.5 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#18392f] hover:bg-black/[0.04]"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {mode === 'create' && (
        <div className="relative mb-2">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
            minLength={8}
            className="apple-input !pr-12 !text-[15px]"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((value) => !value)}
            className="absolute right-1.5 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#18392f] hover:bg-black/[0.04]"
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      )}
      {(localError || authError) && (
        <p className="mb-2 text-[13px] font-medium text-[#d70015]">{localError || authError}</p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-pill btn-pill-primary mt-1 w-full !text-[15px]"
      >
        {mode === 'signin' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        {isSubmitting ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Create account'}
      </button>
    </form>
  );
};
