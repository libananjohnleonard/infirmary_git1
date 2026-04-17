import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ReactCalendar from 'react-calendar';
import { appointmentService } from '../services/appointmentService';
import 'react-calendar/dist/Calendar.css';
import { format, isBefore, startOfToday, getDay, addMonths, isAfter, isValid, parseISO, isSameDay } from 'date-fns';
import { Clock, User, FileText, CheckCircle2, AlertCircle, Calendar as CalendarIcon, ClipboardList, Tag, X, Ticket, MapPin, CalendarDays, Building2, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const safeFormat = (date, formatStr) => {
  if (!date) return 'N/A';
  try {
    let dateObj = date;
    if (typeof date === 'string') {
      dateObj = parseISO(date);
      if (!isValid(dateObj)) {
        dateObj = new Date(date);
      }
    }
    if (!isValid(dateObj)) return 'Invalid Date';
    return format(dateObj, formatStr);
  } catch (error) {
    return 'Invalid Date';
  }
};

const services = [
  { id: 'Dental', label: 'Dental', description: 'Oral health & hygiene' },
  { id: 'Medical', label: 'Medical', description: 'General health' },
  { id: 'Nutrition', label: 'Nutrition', description: 'Dietary & wellness' }
];

const FIXED_SUBCATEGORY = 'Consultation';

const commonPurposesByService = {
  Dental: ['Tooth Extraction'],
  Medical: ['OJT', 'Sports', 'Educational Tours'],
  Nutrition: ['Dietary Counseling'],
};

const MAX_SLOTS = 50;
const DEFAULT_TIME_SLOTS = ['8:00 AM - 11:00 AM', '1:00 PM - 4:00 PM', '4:00 PM - 7:00 PM', '7:00 PM - 11:00 PM'];
const MEDICAL_REQUIREMENT_NOTICE = 'All submitted files are for initial review only. Please bring the original documents to the infirmary office, otherwise your request will not be processed and no medical certification will be issued.';

const parseTimeSlotEndMinutes = (slotLabel) => {
  const match = String(slotLabel || '').match(/-\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || '0');
  const meridiem = String(match[3] || '').toUpperCase();
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (meridiem === 'AM') {
    hours = hours === 12 ? 0 : hours;
  } else if (meridiem === 'PM') {
    hours = hours === 12 ? 12 : hours + 12;
  }
  return (hours * 60) + minutes;
};

const ConfirmationModal = ({ isOpen, appointment, onClose, user }) => {
  if (!appointment) return null;
  const showDepartment = Boolean(user?.college?.trim());
  const showProgram = Boolean(user?.program?.trim());

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden relative my-4"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
            >
              <X size={24} />
            </button>

            <div className="bg-primary p-5 sm:p-8 text-white text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 backdrop-blur-md">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">Booking Confirmed!</h2>
              <p className="text-white/80 mt-2 text-sm sm:text-base">Your appointment has been successfully scheduled.</p>
            </div>

            <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between p-4 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-3xl border border-dashed border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <Ticket size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ticket Number</p>
                    <p className="text-2xl font-black text-slate-800 tracking-tight">{appointment.appointmentCode}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">Patient</p>
                  <p className="font-bold text-slate-800">{appointment.patientName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">Service</p>
                  <p className="font-bold text-slate-800">{appointment.service} - {appointment.subcategory}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">Date</p>
                  <p className="font-bold text-slate-800 flex items-center gap-2">
                    <CalendarDays size={14} className="text-primary" />
                    {safeFormat(appointment.date, 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">Time</p>
                  <p className="font-bold text-slate-800 flex items-center gap-2">
                    <Clock size={14} className="text-primary" />
                    {appointment.time}
                  </p>
                </div>
              </div>

              {(showDepartment || showProgram) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                  {showDepartment && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase">Department</p>
                      <p className="font-bold text-slate-800 flex items-start gap-2">
                        <Building2 size={14} className="text-primary shrink-0 mt-0.5" />
                        <span className="min-w-0">{user.college}</span>
                      </p>
                    </div>
                  )}
                  {showProgram && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase">Program</p>
                      <p className="font-bold text-slate-800 flex items-start gap-2">
                        <GraduationCap size={14} className="text-primary shrink-0 mt-0.5" />
                        <span className="min-w-0">{user.program}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-start gap-3 text-sm text-slate-500">
                  <MapPin size={16} className="text-slate-400 mt-0.5" />
                  <p>Infirmary Building</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const initialFormData = (user) => ({
  patientName: user?.name || '',
  service: '',
  subcategory: FIXED_SUBCATEGORY,
  purpose: '',
  timeSlot: '',
  notes: '',
});

export const BookingForm = ({ onBook, appointments, user }) => {
  const navigate = useNavigate();
  const [date, setDate] = useState(startOfToday());
  const [formData, setFormData] = useState(() => initialFormData(user));
  const [requirementFiles, setRequirementFiles] = useState([]);
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (user?.name) {
      setFormData(prev => ({ ...prev, patientName: user.name }));
    }
  }, [user]);

  const availablePurposes = formData.service ? (commonPurposesByService[formData.service] || []) : [];
  const isMedicalService = formData.service === 'Medical';
  const hasNotCompletedAppointment = (appointments || []).some((apt) => apt.status === 'Not Completed');

  useEffect(() => {
    if (!formData.service) {
      if (formData.purpose) {
        setFormData((prev) => ({ ...prev, purpose: '' }));
      }
      return;
    }

    if (availablePurposes.length && !availablePurposes.includes(formData.purpose)) {
      setFormData((prev) => ({ ...prev, purpose: availablePurposes[0] }));
    }
  }, [formData.service, formData.purpose, availablePurposes]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastBooked, setLastBooked] = useState(null);

  const handleConfirmationDone = () => {
    setShowConfirmation(false);
    setLastBooked(null);
    setDate(startOfToday());
    setFormData(initialFormData(user));
    setRequirementFiles([]);
    navigate('/app/appointments');
  };

  // Fetch all slot availabilities for the selected date from API (single request)
  const [slotAvailability, setSlotAvailability] = useState(
    DEFAULT_TIME_SLOTS.map((t) => ({ time: t, remaining: MAX_SLOTS, maxCapacity: MAX_SLOTS }))
  );
  const [slotsLoading, setSlotsLoading] = useState(false);
  const loadSlotAvailability = async (selectedDate) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    setSlotsLoading(true);
    try {
      const res = await appointmentService.getSlotsForDate(dateStr);
      const slots = res?.slots ?? [];
      setSlotAvailability(
        slots.length
          ? slots.map((s) => ({
            time: s.timeSlot,
            remaining: s.remaining ?? 0,
            maxCapacity: s.maxCapacity ?? MAX_SLOTS,
          }))
          : DEFAULT_TIME_SLOTS.map((t) => ({ time: t, remaining: MAX_SLOTS, maxCapacity: MAX_SLOTS }))
      );
    } catch {
      setSlotAvailability(
        DEFAULT_TIME_SLOTS.map((t) => ({ time: t, remaining: MAX_SLOTS, maxCapacity: MAX_SLOTS }))
      );
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    loadSlotAvailability(date);
  }, [date]);

  const isDayDisabled = ({ date: calendarDate }) => {
    const day = getDay(calendarDate);
    const isWeekend = day === 0 || day === 6;
    const isPast = isBefore(calendarDate, startOfToday());
    const isTooFar = isAfter(calendarDate, addMonths(startOfToday(), 1));
    return isWeekend || isPast || isTooFar;
  };

  const isInfirmaryClosedOnDate = (d) => {
    const day = getDay(d);
    return day === 0 || day === 6; // Sunday and Saturday
  };

  const isClosedDate = isInfirmaryClosedOnDate(date);
  const isSelectedDateToday = isSameDay(date, startOfToday());
  const currentMinutes = (() => {
    const now = new Date();
    return (now.getHours() * 60) + now.getMinutes();
  })();
  const isSlotPastCutoff = (slotTime) => {
    if (!isSelectedDateToday) return false;
    const slotEndMinutes = parseTimeSlotEndMinutes(slotTime);
    if (slotEndMinutes == null) return false;
    return currentMinutes > slotEndMinutes;
  };
  const isSlotUnavailable = (slotTime) => {
    const slot = slotAvailability.find((item) => item.time === slotTime);
    const isFull = slot ? slot.remaining <= 0 : false;
    return isFull || isSlotPastCutoff(slotTime);
  };

  useEffect(() => {
    if (!formData.timeSlot) return;
    if (!isSlotUnavailable(formData.timeSlot)) return;
    setFormData((prev) => ({ ...prev, timeSlot: '' }));
  }, [formData.timeSlot, slotAvailability, date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    if (!formData.service) {
      toast.error('Please select a service.');
      return;
    }
    if (!formData.timeSlot) {
      toast.error('Please select a time slot.');
      return;
    }
    if (isSlotUnavailable(formData.timeSlot)) {
      toast.error('Selected time slot is no longer available.');
      return;
    }
    if (isMedicalService && requirementFiles.length === 0) {
      toast.error('Please upload at least one medical requirement file.');
      return;
    }

    if (isInfirmaryClosedOnDate(date)) {
      toast.error('The infirmary is closed on this day. Please select a weekday (Monday–Friday).');
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      const appointment = await onBook({
        ...formData,
        patientName: user?.name || formData.patientName,
        date: format(date, 'yyyy-MM-dd'),
        time: formData.timeSlot,
        notes: [
          formData.notes?.trim() || '',
          isMedicalService && requirementFiles.length > 0
            ? `Submitted requirement files: ${requirementFiles.map((file) => file.name).join(', ')}`
            : '',
        ]
          .filter(Boolean)
          .join('\n'),
      });

      await loadSlotAvailability(date);
      setLastBooked(appointment);
      setShowConfirmation(true);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to book appointment. Please try again.';
      toast.error(message);
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ConfirmationModal
        isOpen={showConfirmation}
        appointment={lastBooked}
        onClose={handleConfirmationDone}
        user={user}
      />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 px-0">
        <div className="space-y-4 sm:space-y-8 min-w-0">
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
              <CalendarIcon size={20} className="text-primary shrink-0" />
              1. Select Date
            </h2>
            <ReactCalendar
              onChange={setDate}
              value={date}
              tileDisabled={isDayDisabled}
              className="rounded-xl sm:rounded-2xl border-none w-full max-w-full"
              minDate={startOfToday()}
              maxDate={addMonths(startOfToday(), 1)}
            />
            <div className="mt-4 sm:mt-8 p-4 sm:p-6 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                Availability for {safeFormat(date, 'MMMM d, yyyy')}
              </h3>
              {isClosedDate ? (
                <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <AlertCircle size={14} />
                  Infirmary is closed on weekends.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {slotsLoading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50 animate-pulse flex justify-between items-center"
                      >
                        <div className="h-4 w-32 bg-slate-200 rounded-full" />
                        <div className="h-6 w-24 bg-slate-200 rounded-full" />
                      </div>
                    ))
                  ) : (
                    slotAvailability.map((slot) => (
                      (() => {
                        const isPastCutoff = isSlotPastCutoff(slot.time);
                        const isUnavailable = slot.remaining <= 0 || isPastCutoff;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={isUnavailable}
                            onClick={() => setFormData({ ...formData, timeSlot: slot.time })}
                            className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${formData.timeSlot === slot.time
                              ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                              : 'border-slate-200 bg-white hover:border-primary/50 text-slate-600'
                              } ${isUnavailable ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                          >
                            <span className="font-bold">{slot.time}</span>
                            <span
                              className={`text-xs font-bold px-3 py-1 rounded-full ${isPastCutoff
                                ? 'bg-slate-200 text-slate-600'
                                : slot.remaining > 10
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-red-100 text-red-600'
                                }`}
                            >
                              {isPastCutoff ? 'Not available' : `${slot.remaining} slots left`}
                            </span>
                          </button>
                        );
                      })()
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-w-0">
          <div className="bg-primary p-5 sm:p-6 md:p-8 text-white">
            <h2 className="text-xl sm:text-2xl font-bold">2. Patient Details</h2>
            <p className="text-white/80 text-xs sm:text-sm mt-1">Tell us more about your visit on {safeFormat(date, 'MMM d')}.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-8">
            {hasNotCompletedAppointment && (
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold">
                You have a missed/not-attended appointment. Submitting this form will reschedule that appointment instead of creating a new one.
              </div>
            )}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                <User size={16} className="text-primary" />
                Patient Name
              </label>
              <div className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-lg font-medium text-slate-800">
                {user?.name || formData.patientName || '—'}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                <FileText size={16} className="text-primary" />
                Select Service
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, service: s.id, subcategory: FIXED_SUBCATEGORY, purpose: '' });
                      if (s.id !== 'Medical') {
                        setRequirementFiles([]);
                      }
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all ${formData.service === s.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-slate-200 hover:border-primary/30'
                      }`}
                  >
                    <p className={`font-bold ${formData.service === s.id ? 'text-primary' : 'text-slate-700'}`}>{s.label}</p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">{s.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                <Tag size={16} className="text-primary" />
                Sub-category
              </label>
              <div className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50">
                <p className="font-bold text-slate-700">{FIXED_SUBCATEGORY}</p>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  Fixed sub-category for all appointments
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                <ClipboardList size={16} className="text-primary" />
                Purpose of Appointment
              </label>
              <select
                required
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-white font-medium"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                disabled={!formData.service}
              >
                <option value="" disabled>
                  {formData.service ? 'Select purpose' : 'Select a service first'}
                </option>
                {availablePurposes.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Additional Notes</label>
              <textarea
                rows={2}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none font-medium"
                placeholder="Any specific concerns..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {isMedicalService && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Medical Requirements Upload
                </label>
                <input
                  type="file"
                  multiple
                  required={isMedicalService}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setRequirementFiles(Array.from(e.target.files || []))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                />
                {requirementFiles.length > 0 && (
                  <p className="text-xs text-slate-500">
                    Uploaded: {requirementFiles.map((file) => file.name).join(', ')}
                  </p>
                )}
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold">
                  {MEDICAL_REQUIREMENT_NOTICE}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !formData.service || !formData.purpose || !formData.timeSlot || (isMedicalService && requirementFiles.length === 0)}
              className={`w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg text-white transition-all flex items-center justify-center gap-3 shadow-xl ${isSubmitting ? 'bg-emerald-500' : 'bg-primary hover:bg-primary-hover shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
            >
              {isSubmitting ? (
                <>
                  <CheckCircle2 size={24} />
                  Processing...
                </>
              ) : (
                'Confirm Appointment'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
