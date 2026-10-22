import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { taskApi } from '../API/taskApi';
import {
  setTasksLoading,
  setTasksSuccess,
  setMomentumSuccess,
  addTaskOptimistic,
  updateTaskSuccess,
  toggleTaskOptimistic,
  deleteTaskOptimistic,
  setTaskError,
} from '../Redux/slices/taskSlice';
import { closeTaskModal, clearToast } from '../Redux/slices/uiSlice';

import Navbar from '../Components/Layout/Navbar';
import MomentumCard from '../Components/Dashboard/MomentumCard';
import DualActionBar from '../Components/Dashboard/DualActionBar';
import FilterTabs from '../Components/Dashboard/FilterTabs';
import TaskCard from '../Components/Dashboard/TaskCard';
import EmptyState from '../Components/Dashboard/EmptyState';
import TaskModal from '../Components/TaskModal/TaskModal';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { items, filter, searchQuery, momentum, isLoading } = useSelector((state) => state.tasks);
  const { editingTask, toast } = useSelector((state) => state.ui);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch tasks and momentum on load or when filter changes
  const fetchTasksAndMomentum = async () => {
    dispatch(setTasksLoading(true));
    try {
      const [tasksData, momentumData] = await Promise.all([
        taskApi.getTasks({
          filter: filter,
          search: searchQuery || undefined,
        }),
        taskApi.getMomentum(),
      ]);
      dispatch(setTasksSuccess(tasksData));
      dispatch(setMomentumSuccess(momentumData));
    } catch (err) {
      dispatch(setTaskError(err.message));
    }
  };

  useEffect(() => {
    fetchTasksAndMomentum();
  }, [filter, searchQuery]);

  // Auto clear toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        dispatch(clearToast());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  // Handle task completion toggle
  const handleToggleTask = async (taskId) => {
    dispatch(toggleTaskOptimistic(taskId));
    try {
      const updated = await taskApi.toggleTask(taskId);
      dispatch(updateTaskSuccess(updated));
      const momentumData = await taskApi.getMomentum();
      dispatch(setMomentumSuccess(momentumData));
    } catch (err) {
      fetchTasksAndMomentum();
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    dispatch(deleteTaskOptimistic(taskId));
    try {
      await taskApi.deleteTask(taskId);
      const momentumData = await taskApi.getMomentum();
      dispatch(setMomentumSuccess(momentumData));
    } catch (err) {
      fetchTasksAndMomentum();
    }
  };

  // Handle task creation or update from bottom sheet modal
  const handleModalSubmit = async (taskFormData) => {
    setModalLoading(true);
    try {
      if (editingTask) {
        const updated = await taskApi.updateTask(editingTask.id, taskFormData);
        dispatch(updateTaskSuccess(updated));
      } else {
        const created = await taskApi.createTask(taskFormData);
        dispatch(addTaskOptimistic(created));
      }
      dispatch(closeTaskModal());
      const momentumData = await taskApi.getMomentum();
      dispatch(setMomentumSuccess(momentumData));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save task');
    } finally {
      setModalLoading(false);
    }
  };

  // Format today's date (e.g., "Thursday, Oct 24")
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-full flex flex-col bg-surface pb-safe">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-md mx-auto w-full pt-20 px-margin pb-space-2xl space-y-space-lg">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 max-w-sm w-11/12 z-50 p-3 rounded-2xl bg-on-surface text-surface text-xs font-semibold shadow-xl flex items-center justify-between border border-surface-container-high animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">info</span>
              <span>{toast}</span>
            </div>
            <button
              type="button"
              onClick={() => dispatch(clearToast())}
              className="text-surface-dim hover:text-surface ml-2"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Top Date Header & Daily Status Badge */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary font-bold">Today's Focus</p>
            <p className="text-2xl text-on-surface font-bold tracking-tight">{todayFormatted}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-low rounded-full border border-surface-container-high/60 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-on-surface-variant font-medium">{momentum.status_label}</span>
          </div>
        </div>

        {/* Dual Action Bar: Voice + Form */}
        <DualActionBar />

        {/* Daily Momentum Radial Progress Card */}
        <MomentumCard momentum={momentum} />

        {/* Filter Chips Carousel */}
        <FilterTabs />

        {/* Tasks List */}
        <div className="space-y-space-md">
          {isLoading && items.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-on-surface-variant">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="mt-3 text-xs">Loading tasks...</p>
            </div>
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            items.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
              />
            ))
          )}
        </div>
      </main>

      {/* Task Creation & Editing Bottom Sheet */}
      <TaskModal onSubmit={handleModalSubmit} isLoading={modalLoading} />
    </div>
  );
}
