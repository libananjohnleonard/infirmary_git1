import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { UserPlus, GraduationCap, Building2, Briefcase, ChevronLeft } from 'lucide-react';
import { authService } from '../services/authService';

const userTypes = [
  { id: 'new', label: 'New Student', icon: GraduationCap, color: 'bg-blue-500' },
  { id: 'old', label: 'Old Student', icon: Building2, color: 'bg-emerald-500' },
  { id: 'employee', label: 'Employee', icon: Briefcase, color: 'bg-orange-500' }
];

export const SignupPage = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    email: '',
    address: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userType) {
      toast.error('Please select your status (New Student, Old Student, or Employee).');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        userType,
        lastName: formData.lastName,
        firstName: formData.firstName,
        middleName: formData.middleName,
        email: formData.email,
        address: formData.address,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      await authService.signup(payload);

      toast.success('Account created successfully! Please sign in to continue.');
      navigate('/login');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Signup failed:', err);
      const message = err.response?.data?.message || 'Signup failed. Please check your details and try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 py-6 sm:py-12 md:py-20 relative overflow-hidden min-h-0">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 via-slate-50 to-primary/10 -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 sm:bg-white/80 backdrop-blur-2xl p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-white w-full max-w-4xl space-y-6 sm:space-y-8 relative my-6 sm:my-8 max-h-[calc(100vh-2rem)] overflow-y-auto"
      >
        <div className="text-center space-y-2 sm:space-y-3">
          <div className="bg-gradient-to-br from-primary to-primary-hover w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white mx-auto mb-4 sm:mb-6 shadow-xl shadow-primary/30 transform rotate-6">
            <UserPlus className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">Create Account</h2>
          <p className="text-slate-500 font-medium text-sm sm:text-base">Join the University Infirmary</p>
        </div>

        {!userType ? (
          <div className="space-y-5 sm:space-y-8">
            <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.1em] block text-center">Select your status to continue</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {userTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setUserType(t.id)}
                  className="p-5 sm:p-8 bg-white border-2 border-slate-100 rounded-2xl sm:rounded-3xl hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-4 sm:gap-6 group relative overflow-hidden shadow-lg shadow-slate-200/50 min-h-[120px] sm:min-h-0"
                >
                  <div className={`p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl text-slate-400 group-hover:text-white group-hover:bg-primary transition-all duration-500 shadow-inner group-hover:shadow-xl group-hover:shadow-primary/40 flex items-center justify-center`}>
                    <t.icon className="w-8 h-8 sm:w-9 sm:h-9" />
                  </div>
                  <span className="font-black text-base sm:text-xl text-slate-800 group-hover:text-primary transition-colors text-center">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-primary/5 rounded-xl sm:rounded-2xl border border-primary/10 flex-wrap">
              <button type="button" onClick={() => setUserType(null)} className="p-2 bg-white hover:bg-slate-100 rounded-xl text-primary shadow-lg shadow-primary/10 transition-all shrink-0" aria-label="Back">
                <ChevronLeft size={20} />
              </button>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">Step 02: Information</span>
                <span className="font-black text-slate-900 text-base sm:text-xl tracking-tight truncate">Registering as {userTypes.find(t => t.id === userType).label}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.1em] ml-2">Last Name</label>
                <input
                  required
                  className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-base font-medium min-h-[48px]"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.1em] ml-2">First Name</label>
                <input
                  required
                  className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-base font-medium min-h-[48px]"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.1em] ml-2">Middle Name</label>
                <input
                  className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-base font-medium min-h-[48px]"
                  placeholder="Quincy"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.1em] ml-2">Email Address</label>
                <input
                  required
                  type="email"
                  className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-base font-medium min-h-[48px]"
                  placeholder="john.doe@school.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.1em] ml-2">Address</label>
                <input
                  required
                  className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-base font-medium min-h-[48px]"
                  placeholder="123 School St, City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.1em] ml-2">Phone Number</label>
                <input
                  required
                  className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-base font-medium min-h-[48px]"
                  placeholder="+63 912 345 6789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.1em] ml-2">Password</label>
                <input
                  required
                  type="password"
                  className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-base font-medium min-h-[48px]"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.1em] ml-2">Confirm Password</label>
                <input
                  required
                  type="password"
                  className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-base font-medium min-h-[48px]"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 sm:py-4 bg-primary text-white font-black rounded-xl sm:rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/30 text-base sm:text-lg mt-2 sm:mt-4 disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
            >
              {loading ? 'Creating account...' : 'Complete Registration'}
            </button>
          </form>
        )}

        <div className="text-center pt-2 sm:pt-4">
          <p className="text-slate-500 font-medium text-sm sm:text-base md:text-lg">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-black hover:underline">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
