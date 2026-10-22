import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeTaskModal, setModalTab } from '../../Redux/slices/uiSlice';

export default function TaskModal({ onSubmit, isLoading }) {
  const dispatch = useDispatch();
  const { isTaskModalOpen, editingTask, modalTab } = useSelector((state) => state.ui);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('10:30 AM');
  const [priority, setPriority] = useState('Medium');
  const [reminderMinutes, setReminderMinutes] = useState(10);
  const [locationOrTag, setLocationOrTag] = useState('');

  // Sync state if editing an existing task
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '');
      setDescription(editingTask.description || '');
      setStartTime(editingTask.start_time || '09:00 AM');
      setEndTime(editingTask.end_time || '10:30 AM');
      setPriority(editingTask.priority || 'Medium');
      setReminderMinutes(editingTask.reminder_minutes ?? 10);
      setLocationOrTag(editingTask.location_or_tag || '');
    } else {
      setTitle('');
      setDescription('');
      setStartTime('09:00 AM');
      setEndTime('10:30 AM');
      setPriority('Medium');
      setReminderMinutes(10);
      setLocationOrTag('');
    }
  }, [editingTask, isTaskModalOpen]);

  if (!isTaskModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      start_time: startTime,
      end_time: endTime,
      priority,
      reminder_minutes: reminderMinutes,
      location_or_tag: locationOrTag.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end">
      {/* Backdrop with smooth blur */}
      <div
        className="fixed inset-0 bg-on-background/40 backdrop-blur-sm transition-opacity"
        onClick={() => dispatch(closeTaskModal())}
      />

      {/* Bottom Sheet Drawer */}
      <div className="relative z-50 w-full max-w-md bg-surface-container-lowest rounded-t-[28px] shadow-[0_-12px_40px_rgba(26,27,32,0.14)] max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Drag Handle */}
        <div className="w-full flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-outline-variant/60" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-margin-md pt-2 pb-6 flex flex-col gap-space-lg">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-space-md">
              <div className="w-11 h-11 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary shadow-sm">
                <span className="material-symbols-outlined text-[24px]">task_alt</span>
              </div>
              <div className="flex flex-col">
                <h2 className="font-bold text-headline-md text-on-surface tracking-tight">
                  {editingTask ? 'Edit Task' : 'New Task'}
                </h2>
                <p className="text-xs text-on-surface-variant">Fill in task details below</p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close dialog"
              onClick={() => dispatch(closeTaskModal())}
              className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Segmented Mode Switcher: Fill Form vs Voice Input */}
          <div className="bg-surface-container-low p-1 rounded-full flex items-center gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => dispatch(setModalTab('form'))}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                modalTab === 'form'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              <span>Fill Form</span>
            </button>

            <button
              type="button"
              onClick={() => dispatch(setModalTab('voice'))}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                modalTab === 'voice'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">mic</span>
              <span>Voice (Preview)</span>
            </button>
          </div>

          {/* Form Mode View */}
          {modalTab === 'form' ? (
            <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-space-md">
              {/* Field 1: Task Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                  <span>Task Name</span>
                  <span className="text-primary text-[11px] font-medium">Required</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Quarterly Strategic Review"
                  className="w-full h-11 px-space-md bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/25 border border-surface-container-high transition-all"
                />
              </div>

              {/* Field 2: Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes, deliverables, or agenda..."
                  className="w-full p-space-md bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/25 border border-surface-container-high resize-none transition-all"
                />
              </div>

              {/* Field 3: Time Range */}
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface">Start Time</label>
                  <div className="relative flex items-center bg-surface-container-low rounded-xl px-space-md h-11 border border-surface-container-high focus-within:ring-2 focus-within:ring-primary/25">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant mr-2">schedule</span>
                    <input
                      type="text"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="09:00 AM"
                      className="w-full bg-transparent text-sm text-on-surface focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface">End Time</label>
                  <div className="relative flex items-center bg-surface-container-low rounded-xl px-space-md h-11 border border-surface-container-high focus-within:ring-2 focus-within:ring-primary/25">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant mr-2">alarm_on</span>
                    <input
                      type="text"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="10:30 AM"
                      className="w-full bg-transparent text-sm text-on-surface focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Field 4: Priority Level Segmented Radios */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-on-surface">Priority Level</label>
                <div className="grid grid-cols-3 gap-space-sm" role="radiogroup">
                  {/* Low */}
                  <button
                    type="button"
                    onClick={() => setPriority('Low')}
                    className={`h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-95 ${
                      priority === 'Low'
                        ? 'bg-secondary text-on-secondary shadow-sm'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-surface-container-high'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-outline-variant" />
                    <span>Low</span>
                  </button>

                  {/* Medium */}
                  <button
                    type="button"
                    onClick={() => setPriority('Medium')}
                    className={`h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-95 ${
                      priority === 'Medium'
                        ? 'bg-secondary-container text-on-secondary-container shadow-sm border border-secondary-container'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-surface-container-high'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-tertiary" />
                    <span>Medium</span>
                  </button>

                  {/* High */}
                  <button
                    type="button"
                    onClick={() => setPriority('High')}
                    className={`h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-95 ${
                      priority === 'High'
                        ? 'bg-error-container text-on-error-container shadow-sm border border-error-container font-bold'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] text-error">flag</span>
                    <span>High</span>
                  </button>
                </div>
              </div>

              {/* Field 5: Location / Tag */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">Location / Tag</label>
                <div className="relative flex items-center bg-surface-container-low rounded-xl px-space-md h-11 border border-surface-container-high focus-within:ring-2 focus-within:ring-primary/25">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant mr-2">tag</span>
                  <input
                    type="text"
                    value={locationOrTag}
                    onChange={(e) => setLocationOrTag(e.target.value)}
                    placeholder="e.g. Executive Boardroom, Zoom, Notion"
                    className="w-full bg-transparent text-sm text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Reminder Selector */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low text-on-surface-variant border border-surface-container-high">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">notifications_active</span>
                  <span className="text-xs text-on-surface">Reminder: {reminderMinutes} mins before</span>
                </div>
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(Number(e.target.value))}
                  className="bg-transparent text-xs text-primary font-semibold focus:outline-none cursor-pointer"
                >
                  <option value={5}>5 mins</option>
                  <option value={10}>10 mins</option>
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                </select>
              </div>
            </form>
          ) : (
            /* Voice Preview View (Gracefully informs user that Voice AI is in Phase 2) */
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="relative flex items-center justify-center my-3">
                <div className="absolute w-24 h-24 rounded-full bg-primary/15 animate-ping" />
                <div className="absolute w-20 h-20 rounded-full bg-primary-fixed-dim/30 animate-pulse" />
                <div className="relative z-10 w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-[30px]">mic</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold">
                  <span>AI Voice Orchestrator 2.0</span>
                </div>
                <h3 className="font-bold text-lg text-on-surface">Voice Task Creation Coming Soon</h3>
                <p className="text-xs text-on-surface-variant max-w-xs">
                  We are finalizing the local whisper & NLP entity pipeline. In the meantime, use the Form mode to create tasks seamlessly!
                </p>
              </div>

              <button
                type="button"
                onClick={() => dispatch(setModalTab('form'))}
                className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold shadow-md active:scale-95 transition-all"
              >
                Switch to Fill Form
              </button>
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom Actions */}
        {modalTab === 'form' && (
          <div className="p-margin-md pt-3 pb-safe bg-surface-container-lowest border-t border-surface-container-high/60 flex items-center gap-space-sm">
            <button
              type="button"
              onClick={() => dispatch(closeTaskModal())}
              className="flex-1 h-12 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-semibold flex items-center justify-center transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="task-form"
              disabled={isLoading || !title.trim()}
              className="flex-[2] h-12 rounded-full bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">check</span>
              <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
