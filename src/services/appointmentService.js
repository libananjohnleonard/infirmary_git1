import { api } from './api';

export const appointmentService = {
  book: async (payload) => {
    const { data } = await api.post('/api/appointments', {
      patientName: payload.patientName,
      service: payload.service,
      subcategory: payload.subcategory,
      purpose: payload.purpose,
      date: payload.date,
      time: payload.time,
      notes: payload.notes || '',
    });
    return data;
  },

  reschedule: async (id, payload) => {
    const { data } = await api.patch(`/api/appointments/${id}/reschedule`, {
      patientName: payload.patientName,
      service: payload.service,
      subcategory: payload.subcategory,
      purpose: payload.purpose,
      date: payload.date,
      time: payload.time,
      notes: payload.notes || '',
    });
    return data;
  },

  getMyAppointments: async () => {
    const { data } = await api.get('/api/appointments');
    return data;
  },

  getAllAppointments: async () => {
    const { data } = await api.get('/api/appointments/all');
    return data;
  },

  updateStatus: async (id, status) => {
    const { data } = await api.patch(`/api/appointments/${id}/status`, { status });
    return data;
  },

  cancel: async (id, reason) => {
    const { data } = await api.post(`/api/appointments/${id}/cancel`, {
      reason: reason || '',
    });
    return data;
  },

  getSlotAvailability: async (date, timeSlot) => {
    const { data } = await api.get('/api/appointments/slots', {
      params: { date, timeSlot },
    });
    return data;
  },

  /** Get all time slots with remaining capacity for a given date (for book appointment schedule). */
  getSlotsForDate: async (date) => {
    const { data } = await api.get('/api/appointments/slots', {
      params: { date },
    });
    return data;
  },
};
