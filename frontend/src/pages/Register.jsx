import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Layers, AlertCircle, ArrowRight } from 'lucide-react';

const Register = () => {
  const { register, error: authError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!username || !email || !password) {
      setLocalError('Please fill in all details.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const success = await register(username, email, password);
    setLoading(false);

    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-darkBg">
      {/* Background visual graphics */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-accentBlue/10 blur-3xl animate-pulse-subtle"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accentPurple/10 blur-3xl animate-pulse-subtle"></div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-accentBlue to-accentTeal text-white shadow-xl shadow-teal-500/10 mb-4 border border-white/10">
            <Layers className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primaryText">SmartStock</h2>
          <p className="text-sm text-secondaryText font-medium mt-1.5">Configure access accounts locally</p>
        </div>

        {/* Register Panel */}
        <div className="glass-panel rounded-3xl p-8 border border-glassBorder shadow-2xl relative">
          <h3 className="text-xl font-bold mb-6 text-primaryText">Register Account</h3>

          {(localError || authError) && (
            <div className="flex items-center gap-3 rounded-xl bg-rose-950/20 border border-rose-900/30 p-4 mb-6 text-sm text-rose-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{localError || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Operator Name Field */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-semibold text-secondaryText tracking-wide uppercase">Operator Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondaryText">
                  <User className="h-4.5 w-4.5" />
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-secondaryText tracking-wide uppercase">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondaryText">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  placeholder="admin@test.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-secondaryText tracking-wide uppercase">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondaryText">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-secondaryText tracking-wide uppercase">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondaryText">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 rounded-xl glass-btn-primary font-bold text-sm flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  Register System Operator
                  <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Redirect Footer */}
        <div className="text-center mt-6 text-sm">
          <p className="text-secondaryText font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-accentBlue font-bold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
