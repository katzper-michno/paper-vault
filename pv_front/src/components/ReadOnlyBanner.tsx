import React, { FormEvent, useState } from 'react';

interface ReadOnlyBannerProps {
  authEnabled: boolean;
  readOnly: boolean;
  onUnlock: (secret: string) => Promise<boolean>;
  onLock: () => Promise<void>;
}

export const ReadOnlyBanner: React.FC<ReadOnlyBannerProps> = ({
  authEnabled,
  readOnly,
  onUnlock,
  onLock,
}) => {
  const [secret, setSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!authEnabled) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!secret.trim() || submitting) return;

    setSubmitting(true);
    const success = await onUnlock(secret.trim());
    setSubmitting(false);

    if (success) setSecret('');
  };

  if (!readOnly) {
    return (
      <div className="readonly-banner unlocked">
        <span className="readonly-banner-text">✓ Full access unlocked</span>
        <button className="readonly-lock-btn" onClick={onLock}>
          Back to read-only
        </button>
      </div>
    );
  }

  return (
    <div className="readonly-banner">
      <span className="readonly-banner-text">
        🔒 Read-only mode — browse and search freely, but changes are disabled.
      </span>
      <form className="readonly-unlock-form" onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Access code"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <button type="submit" disabled={submitting || !secret.trim()}>
          {submitting ? 'Unlocking…' : 'Unlock full access'}
        </button>
      </form>
    </div>
  );
};
