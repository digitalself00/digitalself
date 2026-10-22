import apiClient from './client';

export const taskApi = {
  getTasks: async (params = {}) => {
    const response = await apiClient.get('/api/tasks', { params });
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await apiClient.post('/api/tasks', taskData);
    return response.data;
  },

  getSingleTask: async (taskId) => {
    const response = await apiClient.get(`/api/tasks/${taskId}`);
    return response.data;
  },

  updateTask: async (taskId, taskData) => {
    const response = await apiClient.put(`/api/tasks/${taskId}`, taskData);
    return response.data;
  },

  toggleTask: async (taskId) => {
    const response = await apiClient.patch(`/api/tasks/${taskId}/toggle`);
    return response.data;
  },

  deleteTask: async (taskId) => {
    await apiClient.delete(`/api/tasks/${taskId}`);
  },

  getMomentum: async (params = {}) => {
    const response = await apiClient.get('/api/tasks/momentum', { params });
    return response.data;
  },
};
