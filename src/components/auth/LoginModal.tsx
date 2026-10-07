import React, { useState } from 'react';
import { Lock, User, ShieldCheck, Sparkles, LogIn, KeyRound } from 'lucide-react';
import Swal from 'sweetalert2';
import { dbService } from '../../services/db';
import { UserSession } from '../../types';

interface LoginModalProps {
  onLoginSuccess: (user: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('www.yusakyokoyama.id');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call backend auth API or fallback locally
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        dbService.setAuthUser(data.user);
        onLoginSuccess(data.user);
        Swal.fire({
          title: 'Login Berhasil!',
          text: `Selamat datang kembali, ${data.user.nama}`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
        return;
      }

      // Check against local settings credentials
      const currentPengaturan = dbService.getPengaturan();
      const inputUser = username.trim();
      if (
        (inputUser === currentPengaturan.username && password.trim() === currentPengaturan.password) ||
        ((inputUser === 'www.yusakyokoyama.id' || inputUser === 'www.yefriharyanto.id') && password.trim() === '123456')
      ) {
        const localUser: UserSession = {
          uid: 'master_guru_default',
          nama: currentPengaturan.namaGuru,
          nip: currentPengaturan.nipGuru,
          role: 'Master Administrator Guru',
          username: inputUser,
          sekolah: currentPengaturan.namaSekolah,
        };
        dbService.setAuthUser(localUser);
        onLoginSuccess(localUser);
        Swal.fire({
          title: 'Login Berhasil!',
          text: `Selamat datang, ${localUser.nama}`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
        return;
      }

      throw new Error('Username atau Password salah!');
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        title: 'Gagal Masuk',
        text: err.message || 'Kredensial login tidak cocok.',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('www.yusakyokoyama.id');
    setPassword('123456');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            Tongguru Aplikasi
          </h2>
          <p className="text-xs text-blue-300 font-medium">
            EdAdmin Pro • Sistem Manajemen Administrasi Guru Digital
          </p>
        </div>

        {/* Credentials Callout */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center justify-between font-semibold text-blue-400">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Kredensial Master Default:
            </span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[11px] underline hover:text-blue-300"
            >
              Isi Otomatis
            </button>
          </div>
          <div className="font-mono text-[11px] text-slate-400 space-y-0.5">
            <div>User: <span className="text-white font-semibold">www.yusakyokoyama.id</span></div>
            <div>Pass: <span className="text-white font-semibold">123456</span></div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Username Administrator Guru
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="www.yusakyokoyama.id"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="123456"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Memverifikasi...' : 'Masuk ke Sistem Administrasi'}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-800">
          Kurikulum Merdeka • Presensi QR Kamera • Deep Learning AI Suite
        </div>
      </div>
    </div>
  );
};
