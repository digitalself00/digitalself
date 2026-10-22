import React from 'react';
import { useDispatch } from 'react-redux';
import { openEditTaskModal } from '../../Redux/slices/uiSlice';

export default function TaskCard({ task, onToggle, onDelete }) {
  const dispatch = useDispatch();
  const isCompleted = task.status === 'completed';

  const getPriorityBadge = () => {
    if (isCompleted) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-on-surface-variant opacity-70 flex-shrink-0">
          Done
        </span>
      );
    }

    switch (task.priority) {
      case 'High':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-error-container text-on-error-container flex-shrink-0">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-secondary-fixed text-on-secondary-fixed flex-shrink-0">
            Medium
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-on-surface-variant flex-shrink-0">
            Low
          </span>
        );
    }
  };

  const timeDisplay =
    task.start_time && task.end_time
      ? `${task.start_time} - ${task.end_time}`
      : task.start_time || 'Anytime';

  return (
    <div
      className={`group relative bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-container-high/40 transition-all duration-200 hover:shadow-md ${
        isCompleted ? 'bg-surface-container-lowest/80' : ''
      }`}
    >
      <div className="flex items-start gap-space-md">
        {/* Custom Interactive Checkbox */}
        <button
          type="button"
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          onClick={() => onToggle(task.id)}
          className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
            isCompleted
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-low border border-outline-variant/60 hover:border-primary'
          }`}
        >
          {isCompleted && (
            <span className="material-symbols-outlined text-[16px] font-bold">check</span>
          )}
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={`font-semibold text-title-md truncate transition-all ${
                isCompleted
                  ? 'text-on-surface-variant line-through opacity-70'
                  : 'text-on-surface'
              }`}
            >
              {task.title}
            </h3>
            {getPriorityBadge()}
          </div>

          {task.description && (
            <p
              className={`text-sm text-on-surface-variant line-clamp-2 leading-relaxed ${
                isCompleted ? 'opacity-60' : ''
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Time & Action Row */}
          <div className="flex items-center justify-between pt-space-xs">
            <div
              className={`flex items-center gap-1.5 text-secondary text-xs ${
                isCompleted ? 'opacity-60' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>{timeDisplay}</span>
              {task.location_or_tag && (
                <>
                  <span className="text-outline-variant">•</span>
                  <span className="truncate max-w-[120px]">{task.location_or_tag}</span>
                </>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                aria-label="Edit task"
                onClick={() => dispatch(openEditTaskModal(task))}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button
                type="button"
                aria-label="Delete task"
                onClick={() => onDelete(task.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
