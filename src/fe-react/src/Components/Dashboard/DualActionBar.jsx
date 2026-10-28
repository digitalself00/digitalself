import React from 'react';
import { useDispatch } from 'react-redux';
import { openCreateTaskModal } from '../../Redux/slices/uiSlice';

export default function DualActionBar() {
  const dispatch = useDispatch();

  const handleVoiceClick = () => {
    dispatch(openCreateTaskModal('voice'));
  };

  const handleFormClick = () => {
    dispatch(openCreateTaskModal('form'));
  };

  return (
    <div className="grid grid-cols-2 gap-space-md">
      {/* Voice Action Button */}
      <button
        type="button"
        aria-label="Create task via voice"
        onClick={handleVoiceClick}
        className="h-12 flex items-center justify-center gap-space-sm bg-surface-container-lowest text-primary rounded-full shadow-sm border border-surface-container-high/60 active:scale-[0.98] transition-all hover:bg-surface-container-low group relative"
      >
        <span className="material-symbols-outlined text-[20px] text-primary">mic</span>
        <span className="font-semibold text-title-md text-primary">Voice</span>
        <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">
          AI 2.0
        </span>
      </button>

      {/* Form Action Button */}
      <button
        type="button"
        aria-label="Add task using form"
        onClick={handleFormClick}
        className="h-12 flex items-center justify-center gap-space-sm bg-primary text-on-primary rounded-full shadow-md active:scale-[0.98] transition-all hover:bg-primary-container"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
        <span className="font-semibold text-title-md text-on-primary">+ Form</span>
      </button>
    </div>
  );
}
