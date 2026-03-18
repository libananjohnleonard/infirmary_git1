import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserSearch, Search, Activity, User, Save, History, ClipboardList, ChevronRight, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';

const toastStyle = {
  borderRadius: '12px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '12px',
};

export const AdminConsultationPage = () => {
  const {
    consultationPatients,
    consultationLogsByUser,
    consultationLoading,
    fetchConsultationLogsForUser,
    handleSaveBP,
  } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const searchedUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return (consultationPatients || []).filter((user) => {
      const inName = user.name?.toLowerCase().includes(q);
      const inEmail = user.email?.toLowerCase().includes(q);
      const inStudent = user.studentNumber?.toLowerCase().includes(q);
      const inEmployee = user.employeeNumber?.toLowerCase().includes(q);
      return inName || inEmail || inStudent || inEmployee;
    });
  }, [searchQuery, consultationPatients]);

  useEffect(() => {
    if (!selectedUser) return;
    fetchConsultationLogsForUser(selectedUser.id);
  }, [selectedUser, fetchConsultationLogsForUser]);

  const handleSave = async () => {
    if (!selectedUser || !systolic || !diastolic) return;
    setIsSaving(true);
    try {
      await handleSaveBP(selectedUser.id, {
        systolic: Number(systolic),
        diastolic: Number(diastolic),
        notes: '',
      });
      setSystolic('');
      setDiastolic('');
      toast.success('BP Record saved successfully!', { style: toastStyle });
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to save BP record.';
      toast.error(message, { style: toastStyle });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6 min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Consultation Logs</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Record patient vitals and medical history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm space-y-4 sm:space-y-5 min-w-0">
          <div className="space-y-3">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <UserSearch size={20} className="text-primary" />
              Search Patient
            </h3>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium"
              />
            </div>
          </div>
          <div className="space-y-2">
            {searchedUsers.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Results</p>
                {searchedUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                      selectedUser?.id === user.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-slate-100 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{user.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                        {(user.studentNumber || user.employeeNumber) && (
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {user.studentNumber || user.employeeNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-all" />
                  </button>
                ))}
              </div>
            ) : searchQuery.trim() !== '' ? (
              <div className="text-center py-6 text-slate-400 font-bold text-sm">No patients found.</div>
            ) : (
              <div className="text-center py-6 text-slate-400 font-bold text-sm">Start typing to search for a patient.</div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedUser ? (
            <motion.div
              key="log-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Activity size={20} className="text-primary" />
                  Vitals Entry
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-xs font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-800">{selectedUser.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{selectedUser.email}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-1">
                      Systolic
                      <div className="group relative cursor-help">
                        <Info size={10} className="text-slate-400" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-slate-800 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                          The top number measures the pressure in your arteries when your heart beats.
                        </div>
                      </div>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-base font-black"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-1">
                      Diastolic
                      <div className="group relative cursor-help">
                        <Info size={10} className="text-slate-400" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-slate-800 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                          The bottom number measures the pressure in your arteries when your heart rests between beats.
                        </div>
                      </div>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 80"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-base font-black"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={!systolic || !diastolic || isSaving}
                  className="w-full py-3.5 bg-primary text-white font-black rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save size={18} />
                      Save BP Record
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <History size={14} className="text-slate-400" />
                  Recent BP History
                </h4>
                <div className="space-y-2">
                  {consultationLoading && (
                    <p className="text-xs text-slate-400 font-bold text-center py-2 italic">
                      Loading history...
                    </p>
                  )}
                  {!consultationLoading && (
                    <>
                      {(consultationLogsByUser[selectedUser.id] || []).length > 0 ? (
                        consultationLogsByUser[selectedUser.id].map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                          >
                            <span className="font-black text-slate-700 text-sm">
                              {record.systolic}/{record.diastolic}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">
                              {record.recordedAt
                                ? new Date(record.recordedAt).toLocaleString()
                                : ''}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 font-bold text-center py-2 italic">
                          No previous records found.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-slate-200 shadow-sm">
                <ClipboardList size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-400">No Patient Selected</h3>
                <p className="text-sm text-slate-400 font-medium max-w-[200px] mx-auto">Select a patient from the search results to record their vitals.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
