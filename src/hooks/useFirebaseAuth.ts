import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, ensureFirebaseConfigured, isFirebaseConfigured } from '../services/firebase';
import { apiFetch } from '../services/apiClient';
import { Role } from '../types';

export interface AuthClaims {
  role?: Role;
  archdioceseId?: string;
  parishName?: string;
  tenantId?: string;
  parishId?: string;
  choirId?: string;
}

export function resolveAuthRole(claims: AuthClaims, user: User | null): Role {
  if (!user) return 'public_user';
  return claims.role ?? 'public_user';
}

export interface SignInResult {
  role?: Role;
  pendingApproval?: boolean;
  message?: string;
}

const ROLE_HIERARCHY: Role[] = [
  'public_user',
  'choir_member',
  'choir_admin',
  'parish_admin',
  'diocese_admin',
  'super_admin',
];

function getFriendlyAuthError(error: unknown, fallback: string) {
  const code = (
    error
    && typeof error === 'object'
    && 'code' in error
    && typeof error.code === 'string'
  ) ? error.code : '';

  const messageByCode: Record<string, string> = {
    'auth/email-already-in-use': 'An account already exists for this email. Sign in instead.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/network-request-failed': 'The sign-in service could not be reached. Check your connection and try again.',
    'auth/operation-not-allowed': 'Email and password sign-in is not enabled for this app.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/weak-password': 'Use a stronger password with at least 8 characters.',
  };

  return messageByCode[code] || fallback;
}

export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(requiredRole);
}

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [claims, setClaims] = useState<AuthClaims>({});
  const [isReady, setIsReady] = useState(false);
  const [isConfigured, setIsConfigured] = useState(isFirebaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    const initializeAuth = async () => {
      const configured = await ensureFirebaseConfigured();
      if (!isMounted) return;

      setIsConfigured(configured);
      if (!auth) {
        setIsReady(true);
        return;
      }

      unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        setAuthError(null);
        // Resolve claims before marking ready so deep links / role guards
        // do not bounce or flash Access Denied during session restore.
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdTokenResult();
            if (!isMounted) return;
            setClaims(token.claims as AuthClaims);
          } catch {
            if (!isMounted) return;
            setClaims({});
          }
        } else {
          setClaims({});
        }
        if (!isMounted) return;
        setIsReady(true);
      });
    };

    void initializeAuth();
    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  const signIn = async (identifier: string, password: string): Promise<SignInResult> => {
    if (!auth) throw new Error('Firebase Auth is not configured.');
    setAuthError(null);
    try {
      const resolveRes = await apiFetch('/api/auth/resolve-login', {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const resolveData = await resolveRes.json().catch(() => ({}));
      if (!resolveRes.ok || !resolveData?.email) {
        const message = resolveData?.error || 'No member found for that email or mobile number.';
        setAuthError(message);
        throw new Error(message);
      }

      await signInWithEmailAndPassword(auth, resolveData.email as string, password);

      // Sync claims from member status / admin allow-list. Non-fatal on outage.
      // Pass sidebar parish so parish admins are not forced onto DEFAULT parish.
      try {
        let selectedParishId = '';
        try {
          selectedParishId = localStorage.getItem('choir360_selected_parish_id') || '';
        } catch {
          selectedParishId = '';
        }
        const syncRes = await apiFetch('/api/auth/sync-role', {
          method: 'POST',
          body: JSON.stringify(selectedParishId ? { parishId: selectedParishId } : {}),
        });
        const syncData = await syncRes.json().catch(() => ({}));
        await auth.currentUser?.getIdToken(true);
        if (auth.currentUser) {
          const token = await auth.currentUser.getIdTokenResult(true);
          setClaims(token.claims as AuthClaims);
        }
        return {
          role: syncData?.role as Role | undefined,
          pendingApproval: Boolean(syncData?.pendingApproval),
          message: typeof syncData?.message === 'string' ? syncData.message : undefined,
        };
      } catch {
        return {};
      }
    } catch (error) {
      setAuthError((prev) => prev || getFriendlyAuthError(error, 'Sign in failed. Please try again.'));
      throw error;
    }
  };

  const createAccount = async (email: string, password: string, displayName: string) => {
    if (!auth) throw new Error('Firebase Auth is not configured.');
    setAuthError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(credential.user, { displayName });
    } catch (error) {
      setAuthError(getFriendlyAuthError(error, 'Account creation failed. Please try again.'));
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const refreshToken = async (): Promise<void> => {
    if (auth?.currentUser) {
      await auth.currentUser.getIdToken(true);
    }
  };

  const effectiveRole: Role = resolveAuthRole(claims, user);

  return {
    user,
    claims,
    isReady,
    authError,
    isConfigured,
    effectiveRole,
    signIn,
    createAccount,
    logout,
    refreshToken,
  };
}
