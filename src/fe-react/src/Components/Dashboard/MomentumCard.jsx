import React from 'react';

export default function MomentumCard({ momentum }) {
  const {
    total_today = 0,
    completed_today = 0,
    completion_rate = 0,
    remaining_count = 0,
    status_label = 'On Track',
  } = momentum || {};

  // Calculate SVG radial stroke dash
  const strokeDash = `${completion_rate}, 100`;

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high/40 relative overflow-hidden">
      {/* Soft Ambient Radial Tint */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
            <span className="font-semibold text-xs uppercase tracking-wider text-on-surface">Daily Momentum</span>
          </div>

          <p className="font-bold text-2xl text-on-surface tracking-tight">
            {completion_rate}% Completed
          </p>

          <p className="text-sm text-on-surface-variant">
            {total_today === 0
              ? 'No tasks scheduled for today'
              : `${remaining_count} task${remaining_count === 1 ? '' : 's'} remaining today`}
          </p>
        </div>

        {/* Sleek SVG Radial Meter */}
        <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-surface-container-high"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
            />
            <path
              className="text-primary transition-all duration-700 ease-out"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray={strokeDash}
              strokeLinecap="round"
              strokeWidth="3.5"
            />
          </svg>
          <span className="absolute font-bold text-xs text-primary">{completion_rate}%</span>
        </div>
      </div>

      {/* Linear Visual Progress Bar */}
      <div className="mt-space-md w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, completion_rate))}%` }}
        />
      </div>
    </div>
  );
}
