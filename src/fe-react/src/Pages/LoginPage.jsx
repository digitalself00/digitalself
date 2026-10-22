import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authApi } from '../API/authApi';
import { setAuthError, setAuthLoading, setAuthSuccess } from '../Redux/slices/authSlice';

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('alex@example.com');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setAuthLoading(true));

    try {
      const data = await authApi.login({
        email,
        password,
        remember_me: rememberMe,
      });
      dispatch(setAuthSuccess(data));
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.detail || 'Invalid email or password';
      dispatch(setAuthError(message));
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between max-w-md mx-auto w-full px-margin-lg py-space-xl">
      {/* Top Branding & Welcome Header */}
      <div className="flex flex-col items-center text-center mt-space-sm mb-space-2xl">
        {/* Brand Logo with soft blur aura */}
        <div className="relative flex items-center justify-center mb-space-lg">
          <div className="absolute w-20 h-20 bg-primary-fixed/50 rounded-full blur-xl" />
          <div className="relative w-16 h-16 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[36px] font-bold">task_alt</span>
          </div>
        </div>

        <h1 className="font-bold text-3xl text-on-surface tracking-tight mb-space-xs">
          Welcome Back
        </h1>
        <p className="text-sm text-on-surface-variant max-w-[260px]">
          Sign in to access your daily tasks
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-xl shadow-md border border-surface-container-high/60 flex flex-col gap-space-lg">
        {error && (
          <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-lg">
          {/* Email Field */}
          <div className="flex flex-col gap-space-xs text-left">
            <label className="text-xs font-semibold text-on-surface" htmlFor="email">
              Email Address
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px] pointer-events-none">
                mail
              </span>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 pl-11 pr-4 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-outline border border-surface-container-high transition-all focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/25"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-space-xs text-left">
            <label className="text-xs font-semibold text-on-surface" htmlFor="password">
              Password
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px] pointer-events-none">
                lock
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-11 pl-11 pr-11 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-outline border border-surface-container-high transition-all focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/25"
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 w-10 h-10 flex items-center justify-center text-outline hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-space-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary/25"
              />
              <span className="text-xs text-on-surface-variant">Remember me</span>
            </label>
            <a href="#forgot" className="text-xs font-semibold text-primary hover:underline">
              Forgot password?
            </a>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 mt-space-xs bg-primary text-on-primary rounded-full text-sm font-semibold tracking-normal shadow-sm hover:bg-primary-container active:scale-[0.985] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </form>
      </div>

      {/* Motivational Focus Card */}
      <div className="mt-space-xl p-space-md bg-surface-container-low rounded-xl border border-surface-container-high/40 flex items-center gap-space-md">
        <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0 text-primary">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
        </div>
        <p className="text-xs text-on-surface-variant">
          Organize priority tasks and protect deep work sessions effortlessly.
        </p>
      </div>

      {/* Minimal Footer Link */}
      <div className="pt-space-2xl pb-space-sm text-center">
        <p className="text-sm text-on-surface-variant">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline ml-1">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
