import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserSearch,
  Search,
  User,
  FolderOpen,
  LayoutGrid,
  FileText,
  FileUp,
  Plus,
  Save,
  X,
  UserCircle2,
  ChevronRight,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { medicalRecordService } from '../../services/medicalRecordService';
import { baseURL } from '../../services/api';

const toastStyle = {
  borderRadius: '12px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '12px',
};

function formatRecordDate(recordedAt) {
  if (!recordedAt) return '—';
  const d = new Date(recordedAt);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export const AdminRecordsPage = () => {
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [recordsSearchQuery, setRecordsSearchQuery] = useState('');
  const [selectedRecordUser, setSelectedRecordUser] = useState(null);
  const [apiRecords, setApiRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [selectedRecordTile, setSelectedRecordTile] = useState(null);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [recordTitle, setRecordTitle] = useState('');
  const [recordNotes, setRecordNotes] = useState('');
  const [recordFiles, setRecordFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadPatients = async () => {
      setPatientsLoading(true);
      try {
        const data = await medicalRecordService.getPatients();
        setPatients(data || []);
      } catch {
        setPatients([]);
      } finally {
        setPatientsLoading(false);
      }
    };
    loadPatients();
  }, []);

  const recordsSearchedUsers = useMemo(() => {
    const q = recordsSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return (patients || []).filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q)
    );
  }, [recordsSearchQuery, patients]);

  useEffect(() => {
    if (!selectedRecordUser) {
      setApiRecords([]);
      return;
    }
    let cancelled = false;
    setRecordsLoading(true);
    medicalRecordService
      .getRecordsByUserId(selectedRecordUser.id)
      .then((data) => {
        if (!cancelled) setApiRecords(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setApiRecords([]);
      })
      .finally(() => {
        if (!cancelled) setRecordsLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedRecordUser]);

  const userRecords = apiRecords;
  const isViewingRecord = selectedRecordTile && !isAddingRecord;
  const selectedRecordAttachments =
    selectedRecordTile?.attachments?.length > 0
      ? selectedRecordTile.attachments
      : selectedRecordTile?.attachmentPath
        ? [
            {
              id: null,
              attachmentPath: selectedRecordTile.attachmentPath,
              attachmentMime: selectedRecordTile.attachmentMime,
            },
          ]
        : [];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setRecordFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setRecordFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecord = async () => {
    if (!selectedRecordUser) return;
    if (!(recordTitle.trim() || recordNotes.trim())) {
      toast.error('Please add a title or notes before saving.', { style: toastStyle });
      return;
    }
    const imageFiles = recordFiles.filter((f) => f.type && f.type.startsWith('image/'));
    setIsSaving(true);
    try {
      await medicalRecordService.createRecord(selectedRecordUser.id, {
        title: recordTitle.trim(),
        notes: recordNotes,
        imageFiles,
      });
      toast.success('Medical record saved successfully!', { style: toastStyle });
      const data = await medicalRecordService.getRecordsByUserId(selectedRecordUser.id);
      setApiRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Failed to save medical record.';
      toast.error(message, { style: toastStyle });
    } finally {
      setIsSaving(false);
    }
    setSelectedRecordTile(null);
    setIsAddingRecord(false);
    setRecordTitle('');
    setRecordNotes('');
    setRecordFiles([]);
  };

  const goBackToTiles = () => {
    setSelectedRecordTile(null);
    setIsAddingRecord(false);
    setPreviewImageUrl(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Medical Records</h1>
        <p className="text-sm text-slate-500 font-medium">Data keeping and patient history management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
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
                value={recordsSearchQuery}
                onChange={(e) => setRecordsSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium"
              />
            </div>
          </div>
          <div className="space-y-2">
            {recordsSearchedUsers.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Results</p>
                {recordsSearchedUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedRecordUser(user);
                      setIsAddingRecord(false);
                      setSelectedRecordTile(null);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                      selectedRecordUser?.id === user.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-slate-100 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{user.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-all" />
                  </button>
                ))}
              </div>
            ) : recordsSearchQuery.trim() !== '' ? (
              <div className="text-center py-6 text-slate-400 font-bold text-sm">No patients found.</div>
            ) : (
              <div className="text-center py-6 text-slate-400 font-bold text-sm">Start typing to search for a patient.</div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedRecordUser ? (
            !selectedRecordTile && !isAddingRecord ? (
              <motion.div
                key="record-tiles"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <LayoutGrid size={20} className="text-primary" />
                    Record Results
                  </h3>
                  <button
                    onClick={() => setSelectedRecordUser(null)}
                    className="text-xs font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ y: -4 }}
                    onClick={() => {
                      setIsAddingRecord(true);
                      setRecordTitle('');
                      setRecordNotes('');
                      setRecordFiles([]);
                    }}
                    className="p-5 bg-primary/5 border-2 border-dashed border-primary/20 rounded-xl flex flex-col items-center justify-center space-y-3 group hover:bg-primary/10 hover:border-primary transition-all"
                  >
                    <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                      <Plus size={24} />
                    </div>
                    <span className="text-xs font-black text-primary uppercase tracking-widest">New Record</span>
                  </motion.button>
                  {recordsLoading ? (
                    <div className="col-span-2 py-8 text-center text-slate-400 font-bold text-sm">Loading records…</div>
                  ) : (
                    userRecords.map((record) => (
                      <motion.button
                        key={record.id}
                        whileHover={{ y: -4 }}
                        onClick={() => setSelectedRecordTile(record)}
                        className="p-5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-start space-y-2 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary/20 transition-all text-left"
                      >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-all shadow-sm overflow-hidden">
                          {(record.attachmentPath || record.attachments?.[0]?.attachmentPath) ? (
                            <img
                              src={`${baseURL}/uploads/${record.attachmentPath || record.attachments?.[0]?.attachmentPath}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText size={20} />
                          )}
                        </div>
                        <div className="min-w-0 w-full">
                          <p className="text-xs font-black text-slate-800 line-clamp-1">{record.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formatRecordDate(record.recordedAt)}</p>
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              </motion.div>
            ) : isViewingRecord ? (
              <motion.div
                key="record-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <FileText size={20} className="text-primary" />
                    {selectedRecordTile.title}
                  </h3>
                  <button
                    onClick={goBackToTiles}
                    className="text-xs font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                  >
                    Back to list
                  </button>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                      <UserCircle2 size={28} />
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-800">{selectedRecordUser.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{selectedRecordUser.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date</p>
                    <p className="text-sm font-bold text-slate-800">{formatRecordDate(selectedRecordTile.recordedAt) || selectedRecordTile.date}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notes & observations</p>
                    <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-xl p-4 border border-slate-100 min-h-[80px]">
                      {selectedRecordTile.notes ?? '—'}
                    </p>
                  </div>
                  {selectedRecordAttachments.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Attachments</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedRecordAttachments.map((att, i) => {
                          const attachmentUrl = `${baseURL}/uploads/${att.attachmentPath}`;
                          return (
                            <div
                              key={att.id || `${att.attachmentPath}-${i}`}
                              className="relative aspect-square w-full rounded-xl border-2 border-slate-100 overflow-hidden bg-slate-50 group"
                            >
                              <button
                                type="button"
                                onClick={() => setPreviewImageUrl(attachmentUrl)}
                                className="absolute inset-0 w-full h-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded-xl"
                              >
                                <img
                                  src={attachmentUrl}
                                  alt="Record attachment"
                                  className="w-full h-full object-cover"
                                />
                              </button>
                              <a
                                href={attachmentUrl}
                                download={`record-attachment-${att.id || selectedRecordTile.id || 'image'}.jpg`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
                                aria-label="Download attachment"
                              >
                                <Download size={14} />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="record-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <FileText size={20} className="text-primary" />
                    New Entry
                  </h3>
                  <button
                    onClick={goBackToTiles}
                    className="text-xs font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                  >
                    Back to list
                  </button>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                      <UserCircle2 size={28} />
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-800">{selectedRecordUser.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{selectedRecordUser.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1">Record title</label>
                    <input
                      type="text"
                      placeholder="e.g. Initial Consultation, Lab Results..."
                      value={recordTitle}
                      onChange={(e) => setRecordTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1">Notes & observations</label>
                    <textarea
                      rows={4}
                      placeholder="Add detailed clinical notes..."
                      value={recordNotes}
                      onChange={(e) => setRecordNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1">Attachments (images)</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-100 rounded-xl p-5 flex flex-col items-center justify-center space-y-2 cursor-pointer hover:bg-slate-50 transition-all group"
                    >
                      <FileUp size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                      <p className="text-xs font-black text-slate-400 uppercase">Upload images</p>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
                    </div>
                    {recordFiles.length > 0 && (
                      <div className="space-y-2">
                        {recordFiles.map((file, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="text-xs font-bold text-slate-600 truncate max-w-[180px]">{file.name}</span>
                            <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSaveRecord}
                    disabled={isSaving || (!recordTitle.trim() && !recordNotes.trim())}
                    className="w-full py-3.5 bg-primary text-white font-black rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={14} />
                        Save medical record
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )
          ) : (
            <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-slate-200 shadow-sm">
                <FolderOpen size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-400">No patient selected</h3>
                <p className="text-sm text-slate-400 font-medium max-w-[200px] mx-auto">Select a patient from the search results to manage their medical records.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {previewImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setPreviewImageUrl(null)}
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close preview"
            >
              <X size={24} />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImageUrl}
                alt="Preview"
                className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
