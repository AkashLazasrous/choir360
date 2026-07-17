import React from 'react';
import { ShieldX } from 'lucide-react';

interface AccessDeniedProps {
  requiredRole?: string;
  onSignIn?: () => void;
}

/**
 * Shown when a user navigates to a tab they do not have the claim-verified role for.
 */
export const AccessDenied: React.FC<AccessDeniedProps> = ({ requiredRole, onSignIn }) => (
  <div className="apple-empty apple-card website-access-denied min-h-[40vh] font-apple">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(255,59,48,0.12)]">
      <ShieldX className="h-7 w-7 text-[#d70015]" />
    </div>
    <h2 className="apple-title text-xl font-semibold">Access restricted</h2>
    <p>
      {requiredRole
        ? `This section requires the ${requiredRole} role or higher. Your access level is verified by Firebase Auth.`
        : 'Please sign in to access this section.'}
    </p>
    {onSignIn && (
      <button type="button" onClick={onSignIn} className="btn-pill btn-pill-primary mt-2">
        Sign in to continue
      </button>
    )}
  </div>
);
