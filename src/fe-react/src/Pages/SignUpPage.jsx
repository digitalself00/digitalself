import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authApi } from '../API/authApi';
import { setAuthError, setAuthLoading, setAuthSuccess } from '../Redux/slices/authSlice';

export default function SignUpPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Real-time password strength calculation (0 to 4)
  const calculateStrength = (pass) => {
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strengthScore = calculateStrength(password);

  const getStrengthLabel = () => {
    if (strengthScore <= 1) return { text: 'Weak', color: 'text-error' };
    if (strengthScore <= 3) return { text: 'Medium', color: 'text-tertiary' };
    return { text: 'Strong', color: 'text-emerald-600' };
  };

  const strength = getStrengthLabel();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      dispatch(setAuthError('Password must be at least 6 characters'));
      return;
    }

    dispatch(setAuthLoading(true));
    try {
      const data = await authApi.register({
        full_name: fullName,
        email,
        password,
      });
      dispatch(setAuthSuccess(data));
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.detail || 'Registration failed';
      dispatch(setAuthError(message));
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between max-w-md mx-auto w-full px-margin pb-space-2xl">
      {/* Brand & Header */}
      <div className="flex flex-col items-center text-center mt-space-lg mb-space-xl">
        <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-center text-primary mb-space-md border border-surface-container-high/60">
          <span className="material-symbols-outlined text-[36px] font-bold">task_alt</span>
        </div>
        <h1 className="font-bold text-3xl text-on-surface tracking-tight mb-space-xs">
          Create Account
        </h1>
        <p className="text-sm text-on-surface-variant max-w-[280px]">
          Organize your day with AI-assisted productivity
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-space-lg w-full">
        {error && (
          <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface-variant ml-1" htmlFor="name">
            Full Name
          </label>
          <div className="relative flex items-center bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 focus-within:ring-2 focus-within:ring-primary/25">
            <span className="material-symbols-outlined text-outline ml-3.5 text-[20px]">
              person
            </span>
            <input
              id="name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex Morgan"
              className="w-full bg-transparent px-3 py-3 text-on-surface text-sm placeholder:text-outline-variant focus:outline-none"
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface-variant ml-1" htmlFor="email">
            Email Address
          </label>
          <div className="relative flex items-center bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 focus-within:ring-2 focus-within:ring-primary/25">
            <span className="material-symbols-outlined text-outline ml-3.5 text-[20px]">
              mail
            </span>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full bg-transparent px-3 py-3 text-on-surface text-sm placeholder:text-outline-variant focus:outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-on-surface-variant ml-1" htmlFor="password">
            Password
          </label>
          <div className="relative flex items-center bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 focus-within:ring-2 focus-within:ring-primary/25">
            <span className="material-symbols-outlined text-outline ml-3.5 text-[20px]">
              lock
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a secure password"
              className="w-full bg-transparent px-3 py-3 text-on-surface text-sm placeholder:text-outline-variant focus:outline-none pr-11"
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-outline hover:text-on-surface transition-colors p-1 flex items-center justify-center rounded-lg"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          {/* 4-Segment Strength Bar */}
          <div className="mt-2 px-1 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Password Strength</span>
              <span className={`font-semibold ${strength.color}`}>{strength.text}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
              {[1, 2, 3, 4].map((barIndex) => {
                const filled = strengthScore >= barIndex;
                return (
                  <div
                    key={barIndex}
                    className={`h-full rounded-full transition-all duration-300 ${
                      filled
                        ? strengthScore <= 1
                          ? 'bg-error'
                          : strengthScore <= 3
                          ? 'bg-primary'
                          : 'bg-emerald-500'
                        : 'bg-surface-container-high'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-space-sm flex flex-col gap-space-md">
          <button
            type="submit"
            disabled={isLoading || !email || !password || !fullName}
            className="w-full h-12 rounded-full bg-primary text-on-primary font-semibold text-sm shadow-md active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
          >
            <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-0.5">
              arrow_forward
            </span>
          </button>

          <p className="text-xs text-on-surface-variant text-center px-4 leading-relaxed">
            By signing up, you agree to our{' '}
            <a href="#terms" className="text-primary font-medium hover:underline">
              Terms
            </a>{' '}
            and{' '}
            <a href="#privacy" className="text-primary font-medium hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </form>

      {/* Log In Redirect */}
      <div className="mt-auto pt-space-2xl text-center">
        <p className="text-sm text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline ml-1">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
