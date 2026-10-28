import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeTaskModal, setModalTab } from '../../Redux/slices/uiSlice';
import { aiApi } from '../../API/aiApi';

export default function TaskModal({ onSubmit, isLoading }) {
  const dispatch = useDispatch();
  const { isTaskModalOpen, editingTask, modalTab } = useSelector((state) => state.ui);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('10:30 AM');
  const [priority, setPriority] = useState('Medium');
  const [reminderMinutes, setReminderMinutes] = useState(10);
  const [locationOrTag, setLocationOrTag] = useState('');

  // Voice Recording & AI State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [extractedAiData, setExtractedAiData] = useState(null);
  const [voiceError, setVoiceError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Sync form fields if editing an existing task
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

  // Clean up media recorder and timers when modal closes
  useEffect(() => {
    if (!isTaskModalOpen) {
      stopRecordingCleanup();
      setExtractedAiData(null);
      setVoiceError(null);
    }
  }, [isTaskModalOpen]);

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Start Voice Recording
  const startRecording = async () => {
    setVoiceError(null);
    setExtractedAiData(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Stop audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        if (audioBlob.size > 0) {
          await processVoiceWithAI(audioBlob);
        }
      };

      recorder.start(250); // collect chunks every 250ms
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[Voice Recording Error]', err);
      setVoiceError(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
          : `Could not access microphone: ${err.message}`
      );
    }
  };

  // Stop Recording Trigger
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Send Audio to Speech-to-Task API
  const processVoiceWithAI = async (audioBlob) => {
    setIsAiProcessing(true);
    setVoiceError(null);

    try {
      const result = await aiApi.speechToTask(audioBlob, 'voice_command.webm');
      setExtractedAiData(result);

      // Pre-fill form fields with extracted data
      if (result.title) setTitle(result.title);
      if (result.description) setDescription(result.description);
      if (result.start_time) setStartTime(result.start_time);
      if (result.end_time) setEndTime(result.end_time);
      if (result.priority) {
        const normPriority = result.priority.charAt(0).toUpperCase() + result.priority.slice(1).toLowerCase();
        setPriority(['Low', 'Medium', 'High'].includes(normPriority) ? normPriority : 'Medium');
      }
    } catch (err) {
      console.error('[Speech to Task Error]', err);
      const detail = err.response?.data?.detail || err.message || 'Failed to extract task from speech';
      setVoiceError(detail);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Format MM:SS for recording timer
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Confirm & Create Task directly from Voice Extraction
  const handleConfirmVoiceTask = () => {
    if (!title.trim() && !extractedAiData?.title) return;

    onSubmit({
      title: title.trim() || extractedAiData?.title || 'Voice Task',
      description: description.trim() || extractedAiData?.description || null,
      start_time: startTime || extractedAiData?.start_time || '09:00 AM',
      end_time: endTime || extractedAiData?.end_time || '10:30 AM',
      priority: priority || extractedAiData?.priority || 'Medium',
      reminder_minutes: reminderMinutes,
      location_or_tag: locationOrTag.trim() || null,
    });
  };

  // Form submit handler
  const handleFormSubmit = (e) => {
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

  if (!isTaskModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-on-background/40 backdrop-blur-sm transition-opacity"
        onClick={() => dispatch(closeTaskModal())}
      />

      {/* Bottom Sheet Drawer */}
      <div className="relative z-50 w-full max-w-md bg-surface-container-lowest rounded-t-[28px] shadow-[0_-12px_40px_rgba(26,27,32,0.14)] max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
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
                <span className="material-symbols-outlined text-[24px]">
                  {modalTab === 'voice' ? 'mic' : 'task_alt'}
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-headline-md text-on-surface tracking-tight">
                    {editingTask ? 'Edit Task' : modalTab === 'voice' ? 'Voice Task' : 'New Task'}
                  </h2>
                  {modalTab === 'voice' && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold rounded-full">
                      AI 2.0
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant">
                  {modalTab === 'voice'
                    ? 'Speak naturally to schedule or orchestrate'
                    : 'Fill in task details below'}
                </p>
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

          {/* Segmented Mode Switcher */}
          <div className="bg-surface-container-low p-1 rounded-full flex items-center gap-1 shadow-inner">
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
              <span>Voice Input</span>
            </button>

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
          </div>

          {/* Tab 1: Voice Input Mode (Stitch Screen 5 Implementation) */}
          {modalTab === 'voice' ? (
            <div className="flex flex-col gap-space-md">
              {/* Error Notice */}
              {voiceError && (
                <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                  <div className="flex-1">
                    <p>{voiceError}</p>
                    <p className="font-normal text-[11px] mt-1 opacity-90">
                      Check your OPENAI_API_KEY and SPEECH_TO_TASK_URL in .env
                    </p>
                  </div>
                </div>
              )}

              {/* Live Voice Recording Zone */}
              <div className="w-full bg-surface-container-low rounded-2xl p-space-lg flex flex-col items-center justify-center relative overflow-hidden border border-surface-container-high/60">
                {/* Radial Glow */}
                <div className="absolute w-48 h-48 rounded-full bg-primary/10 blur-2xl pointer-events-none -top-10" />

                {/* Status Indicator Tag */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest shadow-sm mb-space-md z-10">
                  {isRecording ? (
                    <>
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error" />
                      </span>
                      <span className="text-xs font-semibold text-on-surface tracking-wide">
                        Listening... <span className="font-mono text-primary">{formatTimer(recordingSeconds)}</span>
                      </span>
                    </>
                  ) : isAiProcessing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-primary">
                        Extracting Task with AI...
                      </span>
                    </>
                  ) : extractedAiData ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-700">
                        Task Extracted with {extractedAiData.model_used || 'AI'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-xs font-semibold text-on-surface-variant">
                        Tap microphone to speak
                      </span>
                    </>
                  )}
                </div>

                {/* Central Mic Button with Pulsing Wave Aura */}
                <div className="relative flex items-center justify-center my-2 z-10">
                  {isRecording && (
                    <>
                      <div className="absolute w-24 h-24 rounded-full bg-error/20 animate-ping" style={{ animationDuration: '1.8s' }} />
                      <div className="absolute w-20 h-20 rounded-full bg-error/30 animate-pulse" />
                    </>
                  )}

                  <button
                    type="button"
                    aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
                    disabled={isAiProcessing}
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`relative z-10 w-16 h-16 rounded-full text-on-primary flex items-center justify-center shadow-lg active:scale-95 transition-all ${
                      isRecording
                        ? 'bg-error shadow-error/40 animate-pulse'
                        : isAiProcessing
                        ? 'bg-outline-variant opacity-70 cursor-not-allowed'
                        : 'bg-gradient-to-tr from-primary to-primary-container shadow-primary/40 hover:scale-105'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[32px]">
                      {isRecording ? 'stop' : isAiProcessing ? 'hourglass_top' : 'mic'}
                    </span>
                  </button>
                </div>

                {/* Audio Waveform Bars */}
                <div className="flex items-center gap-1.5 h-8 mt-space-md z-10">
                  {[3, 5, 8, 4, 9, 6, 4, 7, 3].map((height, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-200 ${
                        isRecording
                          ? 'bg-primary animate-pulse'
                          : extractedAiData
                          ? 'bg-emerald-500/60'
                          : 'bg-outline-variant/40'
                      }`}
                      style={{
                        height: isRecording ? `${height * 3}px` : '6px',
                        animationDelay: `${i * 120}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Live Speech-to-Text Stream Card */}
              {extractedAiData?.raw_transcription && (
                <div className="bg-surface-container-low rounded-xl p-space-md flex items-start gap-space-sm border border-surface-container-high/60 animate-in fade-in">
                  <div className="w-7 h-7 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                      Transcription
                    </span>
                    <p className="text-sm text-on-surface mt-1 leading-relaxed italic">
                      “{extractedAiData.raw_transcription}”
                    </p>
                  </div>
                </div>
              )}

              {/* AI Structured Data Extraction Preview Card */}
              {extractedAiData && (
                <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-surface-container-high/60 flex flex-col gap-space-sm animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between pb-1 border-b border-surface-container-low">
                    <div className="flex items-center gap-1.5 text-primary">
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      <span className="text-xs font-bold uppercase tracking-wider">AI Auto-Extracted</span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        priority === 'High'
                          ? 'bg-error-container text-on-error-container'
                          : priority === 'Medium'
                          ? 'bg-secondary-fixed text-on-secondary-fixed'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {priority} Priority
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-secondary font-medium">Task Title</span>
                    <p className="font-bold text-base text-on-surface">{title || extractedAiData.title}</p>
                  </div>

                  {description && (
                    <div>
                      <span className="text-[11px] text-secondary font-medium">Context & Details</span>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{description}</p>
                    </div>
                  )}

                  {/* Schedule & Metadata Badges */}
                  <div className="flex flex-wrap items-center gap-space-xs pt-1">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-on-surface text-xs font-medium">
                      <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                      <span>{startTime} – {endTime}</span>
                    </div>
                    {extractedAiData.model_used && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-secondary text-xs">
                        <span className="material-symbols-outlined text-[14px]">psychology</span>
                        <span>{extractedAiData.model_used}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Voice Tab Interactive Action Buttons */}
              <div className="flex items-center gap-space-sm pt-2">
                {extractedAiData ? (
                  <>
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={isAiProcessing}
                      className="h-11 px-4 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">replay</span>
                      <span>Re-record</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => dispatch(setModalTab('form'))}
                      className="h-11 px-4 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      <span>Edit in Form</span>
                    </button>

                    <button
                      type="button"
                      disabled={isLoading || isAiProcessing}
                      onClick={handleConfirmVoiceTask}
                      className="h-11 flex-1 rounded-full bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>{isLoading ? 'Creating...' : 'Confirm & Create'}</span>
                    </button>
                  </>
                ) : isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="w-full h-11 rounded-full bg-error text-on-error text-xs font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">stop</span>
                    <span>Done Speaking (Process Audio)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isAiProcessing}
                    className="w-full h-11 rounded-full bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">mic</span>
                    <span>Start Speaking</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Tab 2: Manual Form Mode View */
            <form id="task-form" onSubmit={handleFormSubmit} className="flex flex-col gap-space-md">
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
                  placeholder="e.g. Bike Repair Appointment"
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
                      placeholder="Saturday at 10:00 AM"
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
                      placeholder="Saturday at 12:00 PM"
                      className="w-full bg-transparent text-sm text-on-surface focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Field 4: Priority Level Segmented Radios */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-on-surface">Priority Level</label>
                <div className="grid grid-cols-3 gap-space-sm" role="radiogroup">
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

                  <button
                    type="button"
                    onClick={() => setPriority('Medium')}
                    className={`h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-95 ${
                      priority === 'Medium'
                        ? 'bg-secondary-container text-on-secondary-container shadow-sm border border-secondary-container font-semibold'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-surface-container-high'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-tertiary" />
                    <span>Medium</span>
                  </button>

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
                    placeholder="e.g. Workshop, Office, Zoom"
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
          )}
        </div>

        {/* Modal Sticky Bottom Actions (For Form Mode) */}
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
