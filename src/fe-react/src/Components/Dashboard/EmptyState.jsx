import React from 'react';

export default function EmptyState({ message, submessage }) {
  return (
    <div className="py-space-2xl flex flex-col items-center justify-center text-center space-y-space-sm">
      <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary shadow-sm">
        <span className="material-symbols-outlined text-[32px]">task_alt</span>
      </div>
      <p className="font-semibold text-title-md text-on-surface">
        {message || 'All clear for this view!'}
      </p>
      <p className="text-sm text-on-surface-variant max-w-[240px]">
        {submessage || 'No tasks found under this filter. Tap "+ Form" to add a new task.'}
      </p>
    </div>
  );
}
