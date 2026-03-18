import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  ShieldCheck,
  Apple,
  ArrowRight,
  QrCode,
  Keyboard,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import logoImg from '../assets/logo.jpg';
import infirmaryBg from '../assets/infirmary_bg.jpg';
import essuBg from '../assets/essu_bg.jpg';
import vaccinationBg from '../assets/vaccination_bg.png';
import { authService } from '../services/authService';

const news = [
  {
    title: "First Aid & Health Checks",
    description: "The University Infirmary is here for bumps, fevers, and minor injuries. Students and staff can book a visit anytime.",
    image: infirmaryBg
  },
  {
    title: "Flu Shots for Students & Staff",
    description: "Annual flu vaccinations are available. Book a slot for your child or yourself and stay healthy this term.",
    // image: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&q=80&w=1000"
    image: vaccinationBg
  },
  {
    title: "Wellness at School",
    description: "From minor aches to health advice, our school nurse and team are here to support every student and staff member.",
    // image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1000"
    // image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000"
    image: essuBg
    
  }
];

export const LandingPage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [ready, setReady] = useState(false);
  const intervalRef = useRef(null);
  const [showKioskModal, setShowKioskModal] = useState(false);
  const [kioskMode, setKioskMode] = useState(null); // 'qr' | 'id'
  const [scanValue, setScanValue] = useState('');
  const [kioskLoading, setKioskLoading] = useState(false);
  const [kioskResult, setKioskResult] = useState(null);
  const [kioskError, setKioskError] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const scanInputRef = useRef(null);

  const formatIdInput = (raw) => {
    // Keep formatting simple to avoid blocking deletion:
    // - Uppercase letters
    // - Trim spaces at the ends
    // The pattern (e.g. NS-00001 or 12-00001) is guided by the placeholder only.
    return raw.toUpperCase().trimStart();
  };

  // Preload carousel images to avoid lag on switch
  useEffect(() => {
    news.forEach(({ image }) => {
      const img = new Image();
      img.src = image;
    });
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % news.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [ready]);

  const goToSlide = (i) => {
    setCurrentSlide(i);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % news.length);
      }, 5000);
    }
  };

  const resetKioskState = () => {
    setKioskMode(null);
    setScanValue('');
    setKioskLoading(false);
    setKioskResult(null);
    setKioskError(null);
  };

  const handleOpenKiosk = () => {
    resetKioskState();
    setShowKioskModal(true);
  };

  const handleCloseKiosk = () => {
    setShowKioskModal(false);
    resetKioskState();
  };

  const handleSelectMode = (mode) => {
    setKioskMode(mode);
    setScanValue('');
    setKioskResult(null);
    setKioskError(null);
    setShowReceipt(false);
    setTimeout(() => {
      if (scanInputRef.current) {
        scanInputRef.current.focus();
      }
    }, 0);
  };

  const handleKioskSubmit = async (e) => {
    e.preventDefault();
    if (!kioskMode) return;
    if (!scanValue.trim()) return;
    try {
      setKioskLoading(true);
      setKioskResult(null);
      setKioskError(null);
      const payload =
        kioskMode === 'qr'
          ? { mode: 'qr', payload: scanValue.trim() }
          : { mode: 'id', id: scanValue.trim() };
      const data = await authService.kioskCheckIn(payload);
      setKioskResult(data);
      setShowReceipt(true);
    } catch (err) {
      const resp = err?.response?.data;
      const message = resp?.message || 'Failed to check in. Please try again.';
      setKioskError({
        message,
        code: resp?.code || null,
        user: resp?.user || null,
      });
    } finally {
      setKioskLoading(false);
    }
  };

  // Auto-submit when scanning QR code (scanner types full payload then Enter)
  useEffect(() => {
    if (kioskMode !== 'qr') return;
    if (kioskLoading) return;
    const value = scanValue;
    const trimmed = value.trim();
    if (!trimmed) return;

    // Heuristic: QR payload is our JSON string. When it contains both '{' and '}', treat as complete.
    const hasJsonBraces = trimmed.includes('{') && trimmed.includes('}');
    if (!hasJsonBraces) return;

    (async () => {
      try {
        setKioskLoading(true);
        setKioskResult(null);
        setKioskError(null);
        const payload = { mode: 'qr', payload: trimmed };
        const data = await authService.kioskCheckIn(payload);
        setKioskResult(data);
        setShowReceipt(true);
        // Clear field so scanner can be used again without double-submitting same payload
        setScanValue('');
      } catch (err) {
        const resp = err?.response?.data;
        const message = resp?.message || 'Failed to check in. Please try again.';
        setKioskError({
          message,
          code: resp?.code || null,
          user: resp?.user || null,
        });
      } finally {
        setKioskLoading(false);
      }
    })();
  }, [kioskMode, scanValue, kioskLoading]);

  return (
    <div className="flex-1">
      <main>
        <section className="relative min-h-[85vh] sm:min-h-[700px] sm:h-[700px] overflow-hidden">
          {/* CSS-only crossfade carousel — no heavy motion, smooth and performant */}
          {news.map((item, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-500 ease-out"
              style={{
                opacity: currentSlide === i ? 1 : 0,
                pointerEvents: currentSlide === i ? 'auto' : 'none',
              }}
              aria-hidden={currentSlide !== i}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${item.image})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/60 sm:to-transparent" />
              </div>
              <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-center py-20 sm:py-0">
                <div className="max-w-2xl space-y-4 sm:space-y-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/20 backdrop-blur-md border border-primary/30 text-white text-[10px] font-black rounded-full uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-pulse" />
                    University Infirmary Updates
                  </div>
                  <h1 className="text-3xl sm:text-5xl md:text-8xl font-black text-white leading-[1.1] tracking-tighter">
                    {item.title}
                  </h1>
                  <p className="text-base sm:text-xl text-slate-300 leading-relaxed font-medium">
                    {item.description}
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4">
                    <button onClick={() => navigate('/signup')} className="w-full sm:w-auto px-6 py-4 sm:px-10 sm:py-5 bg-primary text-white font-black rounded-2xl hover:bg-primary-hover transition-all shadow-2xl shadow-primary/40 flex items-center justify-center gap-3 group">
                      Book Appointment <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform shrink-0" />
                    </button>
                    <button
                      onClick={handleOpenKiosk}
                      className="w-full sm:w-auto px-6 py-4 sm:px-10 sm:py-5 bg-white/10 backdrop-blur-md border border-white/30 text-white font-black rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center gap-3 group"
                    >
                      Kiosk Check-in
                      <QrCode size={20} className="shrink-0" />
                    </button>
                    {/* <button className="w-full sm:w-auto px-6 py-4 sm:px-10 sm:py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-all">
                      View News
                    </button> */}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="absolute bottom-6 sm:bottom-12 left-1/2 -translate-x-1/2 flex gap-3 sm:gap-4 z-20">
            {news.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${currentSlide === i ? 'bg-primary w-16' : 'bg-white/20 w-4 hover:bg-white/40'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </section>

        <section className="py-16 sm:py-24 md:py-32 relative">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-50 to-white -z-20"></div>
          <div className="absolute top-40 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 hidden sm:block"></div>
          <div className="absolute bottom-40 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 hidden sm:block"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 sm:space-y-6 mb-12 sm:mb-24">
              <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-black rounded-full uppercase tracking-widest">What We Offer</div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tight px-1">University Infirmary Services</h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-base sm:text-xl leading-relaxed">Care and support for students and staff — first aid, health checks, and a safe place when you need it.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
              {[
                { title: "First Aid & Care", icon: HeartPulse, desc: "Bumps, scrapes, fevers, and minor illnesses. Our school nurse and staff are here to help students and staff feel better quickly.", color: "from-blue-500/20 to-blue-600/10", iconBg: "bg-blue-500" },
                { title: "Health Checks", icon: ShieldCheck, desc: "Routine health checks, screenings, and support for managing medications or conditions during the school day.", color: "from-emerald-500/20 to-emerald-600/10", iconBg: "bg-emerald-500" },
                { title: "Wellness", icon: Apple, desc: "Health advice, rest when needed, and a quiet space so students can return to class ready to learn.", color: "from-orange-500/20 to-orange-600/10", iconBg: "bg-orange-500" }
              ].map((s, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -10 }}
                  className={`bg-white p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary/10 transition-all group relative overflow-hidden`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <div className="relative z-10">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 ${s.iconBg} rounded-2xl sm:rounded-3xl flex items-center justify-center text-white mb-6 sm:mb-10 group-hover:scale-110 transition-all duration-500 shadow-xl shadow-slate-200`}>
                      <s.icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-3 sm:mb-4">{s.title}</h3>
                    <p className="text-slate-500 leading-relaxed text-base sm:text-lg font-medium">{s.desc}</p>
                    {/* <div className="mt-6 sm:mt-8 flex items-center gap-2 text-primary font-bold opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      Learn more <ArrowRight size={16} className="shrink-0" />
                    </div> */}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 md:py-32 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="space-y-8 sm:space-y-10">
                <div className="space-y-3 sm:space-y-4">
                  <div className="text-primary font-black uppercase tracking-widest text-sm">Simple Steps</div>
                  <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter">How to book a visit</h2>
                </div>
                <div className="space-y-6 sm:space-y-8">
                  {[
                    { step: "01", title: "Sign Up", desc: "Register as a student or staff member to use the University Infirmary booking system." },
                    { step: "02", title: "Choose Reason", desc: "Select whether you need first aid, a health check, medication support, or rest." },
                    { step: "03", title: "Pick a Time", desc: "Choose a date and time that works for you during school hours." },
                    { step: "04", title: "Come to the Infirmary", desc: "Show up at your scheduled time — we’ll be ready for you." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 sm:gap-6 group">
                      <div className="text-2xl sm:text-4xl font-black text-white/10 group-hover:text-primary transition-colors duration-500 shrink-0">{item.step}</div>
                      <div className="space-y-1 sm:space-y-2 min-w-0">
                        <h4 className="text-lg sm:text-xl font-bold">{item.title}</h4>
                        <p className="text-slate-400 leading-relaxed text-sm sm:text-base">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative order-first lg:order-none flex flex-col items-center sm:block">
                <div className="aspect-square w-full max-w-sm sm:max-w-none bg-gradient-to-br from-primary to-primary-hover rounded-3xl sm:rounded-[4rem] rotate-0 sm:rotate-3 shadow-2xl shadow-primary/40 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1000"
                    alt="School nurse and student in infirmary"
                    className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="relative sm:absolute sm:-bottom-10 sm:-left-10 w-full sm:w-auto sm:max-w-xs bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-2xl text-slate-900 space-y-3 sm:space-y-4 sm:-rotate-3 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                      <ShieldCheck size={24} />
                    </div>
                    <span className="font-black text-lg">Safe & Private</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Health information is kept confidential and shared only with those who need to know.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {showKioskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 p-4 sm:p-6 space-y-4 relative">
            <button
              type="button"
              onClick={handleCloseKiosk}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <div className="space-y-2 pr-6">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">Kiosk Check-in</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Scan your QR code or enter your student/employee ID to get your queue number and view
                today&apos;s appointment.
              </p>
            </div>

            {!kioskMode && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleSelectMode('qr')}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-3 text-slate-800"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <QrCode size={24} />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-bold">Scan QR Code</p>
                    <p className="text-[11px] text-slate-500">
                      Focus the scanner and present your ID QR.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMode('id')}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-3 text-slate-800"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <Keyboard size={22} />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-bold">Enter ID</p>
                    <p className="text-[11px] text-slate-500">
                      Type your Student or Employee ID (e.g. NS-00001).
                    </p>
                  </div>
                </button>
              </div>
            )}

            {kioskMode && (
              <form onSubmit={handleKioskSubmit} className="space-y-4 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                    {kioskMode === 'qr' ? 'Scan QR Code' : 'Enter ID'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setKioskMode(null);
                      setKioskResult(null);
                      setScanValue('');
                    }}
                    className="text-[11px] font-bold text-primary hover:text-primary-hover"
                  >
                    Change mode
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    ref={scanInputRef}
                    type="text"
                    autoFocus
                    value={scanValue}
                    onChange={(e) =>
                      setScanValue(
                        kioskMode === 'id' ? formatIdInput(e.target.value) : e.target.value
                      )
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-sm font-medium"
                    placeholder={
                      kioskMode === 'qr'
                        ? 'Place cursor here and scan your QR code...'
                        : 'Enter NS-00001 or EM-00001'
                    }
                  />
                  <p className="text-[11px] text-slate-400">
                    {kioskMode === 'qr'
                      ? 'Most scanners act like a keyboard and will type the code here automatically.'
                      : 'Include the prefix (NS- / EM-) if possible for more accurate matching.'}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={kioskLoading || !scanValue.trim()}
                  className="w-full py-3 rounded-xl bg-primary text-white font-black text-sm hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {kioskLoading ? 'Checking in...' : 'Check in'}
                </button>
              </form>
            )}

            {kioskResult && (
              <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
                {kioskResult.queueNumber && (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      Queue Number
                    </p>
                    <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-black">
                      {kioskResult.queueNumber}
                    </span>
                  </div>
                )}
                <div className="text-xs text-slate-600 space-y-1.5">
                  <p className="font-semibold">
                    {kioskResult.user?.name || 'Guest'}
                  </p>
                  {kioskResult.user?.studentNumber && (
                    <p>Student No.: {kioskResult.user.studentNumber}</p>
                  )}
                  {kioskResult.user?.employeeNumber && (
                    <p>Employee No.: {kioskResult.user.employeeNumber}</p>
                  )}
                  {kioskResult.hasAppointmentToday && kioskResult.appointment ? (
                    <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                        Today&apos;s Appointment
                      </p>
                      <p className="text-xs">
                        <span className="font-semibold">Ticket No.:</span>{' '}
                        {kioskResult.appointment.code}
                      </p>
                      <p className="text-xs">
                        <span className="font-semibold">Time:</span> {kioskResult.appointment.time}
                      </p>
                      <p className="text-xs">
                        <span className="font-semibold">Service:</span> {kioskResult.appointment.service}{' '}
                        {kioskResult.appointment.subcategory
                          ? `- ${kioskResult.appointment.subcategory}`
                          : ''}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Status: {kioskResult.appointment.status}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
            {kioskError && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1">
                  <p className="font-bold">No appointment found</p>
                  <p>{kioskError.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showReceipt && kioskResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-5 sm:p-7 space-y-4 relative">
            <button
              type="button"
              onClick={() => setShowReceipt(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">
                Kiosk Check-in Receipt
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                You&apos;re in the queue
              </h3>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                Queue Number
              </p>
              <div className="px-5 py-2 rounded-full bg-slate-900 text-white text-lg font-black shadow-lg shadow-slate-900/40">
                {kioskResult.queueNumber}
              </div>
            </div>

            <div className="w-full h-px bg-slate-200" />

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-700">
                  {kioskResult.user?.name || 'Guest'}
                </p>
                {kioskResult.user?.studentNumber && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                    {kioskResult.user.studentNumber}
                  </span>
                )}
                {kioskResult.user?.employeeNumber && !kioskResult.user?.studentNumber && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                    {kioskResult.user.employeeNumber}
                  </span>
                )}
              </div>
              {kioskResult.hasAppointmentToday && kioskResult.appointment && (
                <div className="mt-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                      Today&apos;s Appointment
                    </p>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-black tracking-wide">
                      {kioskResult.appointment.code}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                        Time
                      </p>
                      <p className="text-xs font-semibold text-slate-800">
                        {kioskResult.appointment.time}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                        Status
                      </p>
                      <p className="text-xs font-semibold text-slate-800">
                        {kioskResult.appointment.status}
                      </p>
                    </div>
                    <div className="space-y-0.5 col-span-2">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                        Service
                      </p>
                      <p className="text-xs font-semibold text-slate-800">
                        {kioskResult.appointment.service}{' '}
                        {kioskResult.appointment.subcategory
                          ? `- ${kioskResult.appointment.subcategory}`
                          : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Please wait for your queue number to be called on the infirmary display.
            </p>
          </div>
        </div>
      )}

      <footer className="bg-slate-950 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10 pb-10 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 shadow-xl shrink-0 flex items-center justify-center">
                <img src={logoImg} alt="University Infirmary" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-black text-2xl tracking-tighter block">Infirmary Connect</span>
                <span className="text-primary font-bold text-xs uppercase tracking-[0.2em]">University Infirmary</span>
              </div>
            </div>
            <p className="text-slate-400 max-w-md text-base leading-relaxed">
              First aid, health checks, and a safe place to rest for students and staff.
            </p>
          </div>
          <p className="pt-8 text-slate-500 text-sm">© 2026 University Infirmary Booking.</p>
        </div>
      </footer>
    </div>
  );
};
