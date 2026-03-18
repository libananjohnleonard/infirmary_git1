import { api } from './api';

export const medicalRecordService = {
  getPatients: async () => {
    const { data } = await api.get('/api/medical-records/patients');
    return data;
  },

  getRecordsByUserId: async (userId) => {
    const { data } = await api.get(`/api/medical-records/${userId}/records`);
    return data;
  },

  /**
   * Create a medical record. If imageFile is provided, sends multipart/form-data
   * with title, notes, and images; otherwise sends JSON.
   * @param {string} userId
   * @param {{ title: string, notes?: string, imageFiles?: File[] }} payload
   */
  createRecord: async (userId, payload) => {
    const { title, notes, imageFiles } = payload || {};
    const files = Array.isArray(imageFiles) ? imageFiles : [];

    if (files.length > 0) {
      const form = new FormData();
      form.append('title', title ?? '');
      form.append('notes', notes ?? '');
      files.forEach((file) => form.append('images', file));

      const { data } = await api.post(`/api/medical-records/${userId}/records`, form, {
        headers: { 'Content-Type': undefined },
      });
      return data;
    }
    const { data } = await api.post(`/api/medical-records/${userId}/records`, {
      title: title ?? '',
      notes: notes ?? '',
    });
    return data;
  },
};

