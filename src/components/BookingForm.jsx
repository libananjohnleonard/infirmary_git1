import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ReactCalendar from 'react-calendar';
import { appointmentService } from '../services/appointmentService';
import 'react-calendar/dist/Calendar.css';
import { format, isBefore, startOfToday, getDay, addMonths, isAfter, isValid, parseISO } from 'date-fns';
import { Clock, User, FileText, CheckCircle2, AlertCircle, Calendar as CalendarIcon, ClipboardList, Tag, X, Ticket, MapPin, CalendarDays } from 'lucide-react';
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

const subcategories = {
  'Dental': ['Tooth Extraction', 'Certification'],
  'Medical': ['Consultation', 'Certification'],
  'Nutrition': ['Consultation', 'Certification']
};

const commonPurposes = [
  'General Checkup',
  'Follow-up Visit',
  'Emergency / Urgent Care',
  'Medical Certification',
  'Laboratory Results Review',
  'Physical Examination',
  'Specific Pain / Concern',
  'Dietary Counseling'
];

const MAX_SLOTS = 50;
const DEFAULT_TIME_SLOTS = ['08:00 - 11:00', '13:00 - 16:00'];

const ConfirmationModal = ({ isOpen, appointment, onClose }) => {
  if (!appointment) return null;

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
  subcategory: '',
  purpose: 'General Checkup',
  timeSlot: '',
  notes: '',
});

export const BookingForm = ({ onBook, appointments, user }) => {
  const navigate = useNavigate();
  const [date, setDate] = useState(startOfToday());
  const [formData, setFormData] = useState(() => initialFormData(user));
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (user?.name) {
      setFormData(prev => ({ ...prev, patientName: user.name }));
    }
  }, [user]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastBooked, setLastBooked] = useState(null);

  const handleConfirmationDone = () => {
    setShowConfirmation(false);
    setLastBooked(null);
    setDate(startOfToday());
    setFormData(initialFormData(user));
    navigate('/app/appointments');
  };

  // Fetch all slot availabilities for the selected date from API (single request)
  const [slotAvailability, setSlotAvailability] = useState(
    DEFAULT_TIME_SLOTS.map((t) => ({ time: t, remaining: MAX_SLOTS, maxCapacity: MAX_SLOTS }))
  );
  const [slotsLoading, setSlotsLoading] = useState(false);
  useEffect(() => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setSlotsLoading(true);
    appointmentService
      .getSlotsForDate(dateStr)
      .then((res) => {
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
      })
      .catch(() => {
        setSlotAvailability(
          DEFAULT_TIME_SLOTS.map((t) => ({ time: t, remaining: MAX_SLOTS, maxCapacity: MAX_SLOTS }))
        );
      })
      .finally(() => setSlotsLoading(false));
  }, [date]);

  const isDayDisabled = ({ date: calendarDate }) => {
    const day = getDay(calendarDate);
    const isWeekendOrFri = day === 0 || day === 5 || day === 6;
    const isPast = isBefore(calendarDate, startOfToday());
    const isTooFar = isAfter(calendarDate, addMonths(startOfToday(), 1));
    return isWeekendOrFri || isPast || isTooFar;
  };

  const isInfirmaryClosedOnDate = (d) => {
    const day = getDay(d);
    return day === 0 || day === 5 || day === 6; // Sunday, Friday, Saturday
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    if (!formData.service) {
      toast.error('Please select a service.');
      return;
    }
    if (!formData.subcategory) {
      toast.error('Please select a sub-category.');
      return;
    }
    if (!formData.timeSlot) {
      toast.error('Please select a time slot.');
      return;
    }

    if (isInfirmaryClosedOnDate(date)) {
      toast.error('The infirmary is closed on this day. Please select a weekday (Monday–Thursday).');
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
      });

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
              <div className="grid grid-cols-1 gap-4">
                {slotsLoading ? (
                  // Skeleton loader while fetching available slots
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
                    <button
                      key={slot.time}
                      type="button"
                      disabled={slot.remaining <= 0}
                      onClick={() => setFormData({ ...formData, timeSlot: slot.time })}
                      className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${
                        formData.timeSlot === slot.time
                          ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                          : 'border-slate-200 bg-white hover:border-primary/50 text-slate-600'
                      } ${slot.remaining <= 0 ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                    >
                      <span className="font-bold">{slot.time}</span>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          slot.remaining > 10 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {slot.remaining} slots left
                      </span>
                    </button>
                  ))
                )}
              </div>
              {getDay(date) === 0 || getDay(date) >= 5 ? (
                <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <AlertCircle size={14} />
                  Infirmary is closed on Fridays and Weekends.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-w-0">
          <div className="bg-primary p-5 sm:p-6 md:p-8 text-white">
            <h2 className="text-xl sm:text-2xl font-bold">2. Patient Details</h2>
            <p className="text-white/80 text-xs sm:text-sm mt-1">Tell us more about your visit on {safeFormat(date, 'MMM d')}.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-8">
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
                    onClick={() => setFormData({ ...formData, service: s.id, subcategory: '' })}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      formData.service === s.id
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
              <div className="grid grid-cols-2 gap-3">
                {(!formData.service ? [] : subcategories[formData.service] || []).length === 0 ? (
                  <p className="col-span-2 text-xs text-slate-400">
                    Select a service first, then choose a sub-category.
                  </p>
                ) : (
                  (subcategories[formData.service] || []).map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setFormData({ ...formData, subcategory: sub })}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        formData.subcategory === sub
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-slate-200 hover:border-primary/30'
                      }`}
                    >
                      <p className={`font-bold ${formData.subcategory === sub ? 'text-primary' : 'text-slate-700'}`}>{sub}</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                        {sub === 'Certification' ? 'Official medical document' : 'Standard consultation'}
                      </p>
                    </button>
                  ))
                )}
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
              >
                {commonPurposes.map((p) => (
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

            <button
              type="submit"
              disabled={isSubmitting || !formData.service || !formData.subcategory || !formData.timeSlot}
              className={`w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg text-white transition-all flex items-center justify-center gap-3 shadow-xl ${
                isSubmitting ? 'bg-emerald-500' : 'bg-primary hover:bg-primary-hover shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed'
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

