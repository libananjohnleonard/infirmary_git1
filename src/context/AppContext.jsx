import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { appointmentService } from '../services/appointmentService';
import { notificationService } from '../services/notificationService';
import { consultationService } from '../services/consultationService';
import { queueService } from '../services/queueService';

const AppContext = createContext(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

const initialMockUsers = [
  { id: '1', name: 'John Doe', email: 'w3w2424@gmail.com', patientId: 'P-88291', bpHistory: [{ value: '120/80', date: '2026-03-10' }] },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', patientId: 'P-12345', bpHistory: [] },
  { id: '3', name: 'Robert Brown', email: 'robert@university.edu', patientId: 'P-67890', bpHistory: [{ value: '130/85', date: '2026-03-12' }] },
];

export const AppProvider = ({ children }) => {
  const [mockUsers, setMockUsers] = useState(initialMockUsers);
  const getAuthUser = () => {
    try {
      const stored = localStorage.getItem('authUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const authUser = getAuthUser();
  const userProfile = authUser
    ? {
        name: [authUser.firstName, authUser.middleName, authUser.lastName].filter(Boolean).join(' '),
        email: authUser.email,
        userType: authUser.userType || null,
        studentNumber: authUser.studentNumber || null,
        employeeNumber: authUser.employeeNumber || null,
        college: authUser.college || '',
        program: authUser.program || '',
        qrCode: authUser.qrCode || null,
        phone: authUser.phone || '',
        address: authUser.address || '',
        patientId: `P-${authUser.id?.slice(0, 8) || '00000'}`,
        bloodType: 'O+',
        weight: 75,
        height: 180,
        age: 28,
        allergies: []
      }
    : {
        name: 'Guest',
        email: '',
        userType: null,
        phone: '',
        address: '',
        patientId: '',
        bloodType: '',
        weight: 0,
        height: 0,
        age: 0,
        allergies: []
      };

  const [notifications, setNotifications] = useState([]);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setNotifications([]);
      setNotificationsUnreadCount(0);
      return;
    }
    try {
      const { notifications: list, unreadCount } = await notificationService.getMyNotifications();
      setNotifications(list || []);
      setNotificationsUnreadCount(unreadCount ?? 0);
    } catch {
      setNotifications([]);
      setNotificationsUnreadCount(0);
    }
  }, []);

  const markNotificationAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setNotificationsUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() }))
      );
      setNotificationsUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  const [consultationPatients, setConsultationPatients] = useState([]);
  const [consultationLogsByUser, setConsultationLogsByUser] = useState({});
  const [consultationLoading, setConsultationLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setAppointments([]);
      setAppointmentsLoading(false);
      return;
    }
    try {
      const [data, myQueues] = await Promise.all([
        appointmentService.getMyAppointments(),
        queueService.myToday().catch(() => []),
      ]);
      const queuesByApt = new Map();
      (myQueues || []).forEach((q) => {
        if (q.appointmentId) {
          queuesByApt.set(q.appointmentId, q);
        }
      });
      const enriched = (data || []).map((apt) => {
        const q = queuesByApt.get(apt.id);
        return q
          ? {
              ...apt,
              queueNumber: q.queueNumber,
              queueStatus: q.status,
            }
          : apt;
      });
      setAppointments(enriched);
    } catch {
      setAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  }, []);

  const fetchConsultationPatients = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setConsultationPatients([]);
      return;
    }
    try {
      const data = await consultationService.getPatients();
      setConsultationPatients(data || []);
    } catch {
      setConsultationPatients([]);
    }
  }, []);

  const fetchConsultationLogsForUser = useCallback(async (userId) => {
    if (!userId) return [];
    const token = localStorage.getItem('authToken');
    if (!token) return [];
    try {
      setConsultationLoading(true);
      const logs = await consultationService.getLogsByUserId(userId);
      setConsultationLogsByUser((prev) => ({ ...prev, [userId]: logs || [] }));
      return logs || [];
    } catch {
      setConsultationLogsByUser((prev) => ({ ...prev, [userId]: [] }));
      return [];
    } finally {
      setConsultationLoading(false);
    }
  }, []);

  const fetchAllAppointments = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return [];
    try {
      const data = await appointmentService.getAllAppointments();
      setAppointments(data);
      return data;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchConsultationPatients();
  }, [fetchConsultationPatients]);

  const handleBook = async (newApt) => {
    const appointment = await appointmentService.book({
      patientName: newApt.patientName,
      service: newApt.service,
      subcategory: newApt.subcategory,
      purpose: newApt.purpose,
      date: newApt.date,
      time: newApt.time,
      notes: newApt.notes,
    });
    setAppointments((prev) => [appointment, ...prev]);
    fetchNotifications();
    return appointment;
  };

  const handleCancel = async (id) => {
    try {
      await appointmentService.cancel(id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'Cancelled' } : a))
      );
      fetchNotifications();
      toast.success('Appointment cancelled.');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to cancel appointment.';
      toast.error(message);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await appointmentService.updateStatus(id, newStatus);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
      fetchNotifications();
      toast.success('Status updated.');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update status.';
      toast.error(message);
    }
  };

  const handleSaveBP = async (userId, { systolic, diastolic, notes }) => {
    await consultationService.createLog(userId, { systolic, diastolic, notes });
    await fetchConsultationLogsForUser(userId);
  };

  const [medicalRecords, setMedicalRecords] = useState(() => {
    const saved = localStorage.getItem('infirmary_medical_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [systemLogs, setSystemLogs] = useState(() => {
    const saved = localStorage.getItem('infirmary_system_logs');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addSystemLog = (entry) => {
    const log = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    setSystemLogs((prev) => [log, ...prev].slice(0, 500));
  };

  const addMedicalRecord = (userId, { title, notes, files }) => {
    const readFileAsDataUrl = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: reader.result });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const baseRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      title: (title || '').trim() || 'Untitled Record',
      notes: notes || '',
      date: format(new Date(), 'MMM d, yyyy'),
      dateISO: format(new Date(), 'yyyy-MM-dd'),
    };

    const user = mockUsers.find((u) => u.id === userId);
    const userName = user?.name || 'Unknown';

    const filesList = files || [];
    if (filesList.length === 0) {
      setMedicalRecords((prev) => [{ ...baseRecord, attachments: [] }, ...prev]);
      addSystemLog({
        type: 'record_added',
        message: `Medical record "${baseRecord.title}" added`,
        userId,
        userName,
        metadata: { recordId: baseRecord.id },
      });
      return;
    }
    Promise.all(filesList.map(readFileAsDataUrl)).then((attachments) => {
      setMedicalRecords((prev) => [{ ...baseRecord, attachments }, ...prev]);
      addSystemLog({
        type: 'record_added',
        message: `Medical record "${baseRecord.title}" added`,
        userId,
        userName,
        metadata: { recordId: baseRecord.id, attachmentCount: attachments.length },
      });
    });
  };

  const getRecordsByUser = (userId) => {
    return medicalRecords.filter((r) => r.userId === userId);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  }, []);

  useEffect(() => {
    localStorage.setItem('infirmary_medical_records', JSON.stringify(medicalRecords));
  }, [medicalRecords]);

  useEffect(() => {
    localStorage.setItem('infirmary_system_logs', JSON.stringify(systemLogs));
  }, [systemLogs]);

  const value = {
    userProfile,
    logout,
    consultationPatients,
    consultationLogsByUser,
    consultationLoading,
    fetchConsultationPatients,
    fetchConsultationLogsForUser,
    notifications,
    notificationsUnreadCount,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    appointments,
    appointmentsLoading,
    fetchAppointments,
    fetchAllAppointments,
    handleBook,
    handleCancel,
    handleUpdateStatus,
    mockUsers,
    handleSaveBP,
    medicalRecords,
    addMedicalRecord,
    getRecordsByUser,
    systemLogs,
    addSystemLog,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
