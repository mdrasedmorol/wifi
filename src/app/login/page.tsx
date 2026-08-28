'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAction } from '@/app/actions/auth-actions';
import { Wifi, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeError, setShakeError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await loginAction(username, password);
      if (result.success) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setError(result.error || 'Login failed.');
        setShakeError(true);
        setTimeout(() => setShakeError(false), 600);
      }
    } catch {
      setError('Connection error. Please try again.');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg-effects">
        <div className="login-glow glow-1" />
        <div className="login-glow glow-2" />
        <div className="login-glow glow-3" />
      </div>

      {/* Floating particles */}
      <div className="login-particles">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`} />
        ))}
      </div>

      <div className={`login-card ${shakeError ? 'shake' : ''}`}>
        {/* Top accent bar */}
        <div className="login-card-accent" />

        {/* Brand header */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <Wifi size={28} />
          </div>
          <h1 className="login-brand-title">NetManager</h1>
          <p className="login-brand-subtitle">ISP Administration Panel</p>
        </div>

        {/* Security badge */}
        <div className="login-security-badge">
          <ShieldCheck size={14} />
          <span>Secure Admin Access</span>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Error message */}
          {error && (
            <div className="login-error">
              <Lock size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Username field */}
          <div className="login-field">
            <label htmlFor="login-username" className="login-label">
              <User size={14} />
              <span>Username</span>
            </label>
            <div className="login-input-wrapper">
              <User size={18} className="login-input-icon" />
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="login-input"
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="login-field">
            <label htmlFor="login-password" className="login-label">
              <Lock size={14} />
              <span>Password</span>
            </label>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="login-input"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="login-submit-btn"
            id="login-submit"
          >
            {loading ? (
              <>
                <div className="login-spinner" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Sign In to Dashboard</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>Protected system — Authorized personnel only</p>
        </div>
      </div>

      {/* Bottom brand text */}
      <div className="login-bottom-brand">
        <Wifi size={16} />
        <span>NetManager Telecom — Admin Portal</span>
      </div>
    </div>
  );
}
