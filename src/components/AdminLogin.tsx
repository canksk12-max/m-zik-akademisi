import React, { useState } from 'react';
import { GraduationCap, Lock, User, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (rememberMe: boolean) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Dynamic feel: a tiny delay to simulate verification and look premium
    setTimeout(() => {
      const lowerUsername = username.trim().toLowerCase();
      const cleanPassword = password.trim();

      if (!lowerUsername || !cleanPassword) {
        setError('Lütfen kullanıcı adı ve şifreyi eksiksiz giriniz.');
        setLoading(false);
        return;
      }

      // Flex credentials: admin/316316 or yagmur/316316
      if (
        (lowerUsername === 'admin' && cleanPassword === '316316') ||
        (lowerUsername === 'yagmur' && cleanPassword === '316316')
      ) {
        onLoginSuccess(rememberMe);
      } else {
        setError('Hatalı kullanıcı adı veya şifre! Lütfen tekrar deneyiniz.');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans relative overflow-hidden select-none" id="admin-login-screen">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-505 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl p-8 transition-all hover:border-slate-700/80 z-10" id="login-container-card">
        
        {/* Brand/Logo Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl shadow-lg ring-1 ring-white/10 mb-4 transition-transform hover:scale-105 duration-350">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1.5 font-sans">
            Yağmur Yüksel Sanat Akademisi
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Öğretmen, Öğrenci & Taksit Otomasyonu Yönetici Girişi
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-5" id="login-form-element">
          
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-widest pl-1" htmlFor="username">
              Kullanıcı Adı
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                id="username"
                type="text"
                autoComplete="off"
                placeholder="Örn: admin"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all disabled:opacity-50 font-medium"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-widest pl-1" htmlFor="password">
              Yönetici Şifresi
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Şifreniz"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all disabled:opacity-50 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none p-1 rounded-md"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer group text-xs text-slate-400 font-medium select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 bg-slate-900 border border-slate-800 rounded-md accent-indigo-650 cursor-pointer text-indigo-600 focus:ring-0"
              />
              <span className="group-hover:text-slate-300 transition-colors">Beni bu tarayıcıda hatırla</span>
            </label>
          </div>

          {/* Display Notification Box if any error */}
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-start gap-2.5 text-rose-450 text-rose-400 text-xs animate-fade-in leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-550 to-violet-600 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-2xl transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Güvenli Giriş Yap
              </>
            )}
          </button>
        </form>

      </div>

      <footer className="mt-8 text-[11px] text-slate-500 font-medium">
        © 2026 Yağmur Yüksel Sanat Akademisi. Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
