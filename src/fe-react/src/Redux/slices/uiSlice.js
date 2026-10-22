import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    isTaskModalOpen: false,
    editingTask: null,
    modalTab: 'form', // 'form' | 'voice'
    toast: null,
  },
  reducers: {
    openCreateTaskModal: (state, action) => {
      state.isTaskModalOpen = true;
      state.editingTask = null;
      state.modalTab = action.payload || 'form';
    },
    openEditTaskModal: (state, action) => {
      state.isTaskModalOpen = true;
      state.editingTask = action.payload;
      state.modalTab = 'form';
    },
    closeTaskModal: (state) => {
      state.isTaskModalOpen = false;
      state.editingTask = null;
    },
    setModalTab: (state, action) => {
      state.modalTab = action.payload;
    },
    showToast: (state, action) => {
      state.toast = action.payload;
    },
    clearToast: (state) => {
      state.toast = null;
    },
  },
});

export const {
  openCreateTaskModal,
  openEditTaskModal,
  closeTaskModal,
  setModalTab,
  showToast,
  clearToast,
} = uiSlice.actions;

export default uiSlice.reducer;
