import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { queueService } from '../../services/queueService';
import { Clock, Users, Filter } from 'lucide-react';

const STATUS_OPTIONS = ['All', 'Waiting', 'Serving', 'Completed', 'Skipped'];

export const AdminQueuePage = () => {
  const [queues, setQueues] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Waiting');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadQueues = async () => {
    setLoading(true);
    try {
      const data = await queueService.list({
        status: statusFilter,
        date: dateFilter || undefined,
      });
      setQueues(data || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load queues', err);
      setQueues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueues();
  }, [statusFilter, dateFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      await queueService.updateStatus(id, newStatus);
      setQueues((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to update queue status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Queue Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            View and manage current kiosk queues.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-600">
            <Users size={14} />
            <span>{queues.length} queued</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={loadQueues}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-50"
          >
            <Filter size={12} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-xs text-slate-500 font-semibold">
            Loading queues...
          </div>
        ) : queues.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 font-semibold">
            No queues found for the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3">
            {queues.map((q) => (
              <div
                key={q.id}
                className="p-3 sm:p-4 rounded-xl border border-slate-100 bg-slate-50/80 flex flex-col gap-2 hover:bg-white hover:border-primary/20 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-sm">
                      {q.queueNumber || '—'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {q.user?.name || 'Unknown'}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {q.user?.studentNumber || q.user?.employeeNumber || 'No ID'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock size={12} />
                    <span>
                      {q.createdAt
                        ? new Date(q.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                </div>
                {q.appointment && (
                  <div className="mt-1 p-2 rounded-lg bg-white border border-slate-100 space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.16em]">
                      Appointment
                    </p>
                    <p className="text-[11px] font-semibold text-slate-800">
                      {q.appointment.code}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {q.appointment.service}
                      {q.appointment.subcategory ? ` · ${q.appointment.subcategory}` : ''}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {q.appointment.time} ({q.appointment.status})
                    </p>
                  </div>
                )}
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.16em]">
                    Status
                  </p>
                  <select
                    value={q.status}
                    disabled={updatingId === q.id}
                    onChange={(e) => handleStatusChange(q.id, e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
                  >
                    {STATUS_OPTIONS.filter((s) => s !== 'All').map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

