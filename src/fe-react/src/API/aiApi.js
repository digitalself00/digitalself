import apiClient from './client';

export const aiApi = {
  speechToTask: async (audioBlob, filename = 'voice_recording.webm') => {
    const formData = new FormData();
    formData.append('file', audioBlob, filename);

    const response = await apiClient.post('/api/ai/speech-to-task', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
