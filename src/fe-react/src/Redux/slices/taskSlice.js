import { createSlice } from '@reduxjs/toolkit';

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    filter: 'all', // 'all', 'high', 'today', 'completed'
    searchQuery: '',
    momentum: {
      total_today: 0,
      completed_today: 0,
      completion_rate: 0,
      remaining_count: 0,
      status_label: 'On Track',
    },
    isLoading: false,
    error: null,
  },
  reducers: {
    setTasksLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setTasksSuccess: (state, action) => {
      state.items = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setMomentumSuccess: (state, action) => {
      state.momentum = action.payload;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    addTaskOptimistic: (state, action) => {
      state.items.unshift(action.payload);
    },
    updateTaskSuccess: (state, action) => {
      const updated = action.payload;
      const index = state.items.findIndex((t) => t.id === updated.id);
      if (index !== -1) {
        state.items[index] = updated;
      }
    },
    toggleTaskOptimistic: (state, action) => {
      const taskId = action.payload;
      const task = state.items.find((t) => t.id === taskId);
      if (task) {
        task.status = task.status === 'completed' ? 'pending' : 'completed';
      }
    },
    deleteTaskOptimistic: (state, action) => {
      const taskId = action.payload;
      state.items = state.items.filter((t) => t.id !== taskId);
    },
    setTaskError: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const {
  setTasksLoading,
  setTasksSuccess,
  setMomentumSuccess,
  setFilter,
  setSearchQuery,
  addTaskOptimistic,
  updateTaskSuccess,
  toggleTaskOptimistic,
  deleteTaskOptimistic,
  setTaskError,
} = taskSlice.actions;

export default taskSlice.reducer;
