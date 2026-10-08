import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  QrCode,
  Calendar,
  UserCheck,
  Award,
  BookMarked,
  HeartHandshake,
  FolderDown,
  Sparkles,
  FileCheck,
  Heart,
  Target,
  FileQuestion,
  BookCheck,
  BookOpen,
  PenTool,
  Presentation,
  Bot,
  FileText,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ShieldCheck,
  Wifi,
  ChevronRight,
  Layers,
  Camera,
  Building2,
  Upload,
  Check,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { dbService } from './services/db';
import { showToast } from './utils/toast';
import { Siswa, Mapel, Jadwal, Absensi, Nilai, Agenda, Bimbingan, Pengaturan, UserSession } from './types';

// Academic Components
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { SiswaManager } from './components/academic/SiswaManager';
import { KartuSiswaView } from './components/academic/KartuSiswaView';
import { JadwalManager } from './components/academic/JadwalManager';
import { AbsensiManager } from './components/academic/AbsensiManager';
import { NilaiManager } from './components/academic/NilaiManager';
import { AgendaManager } from './components/academic/AgendaManager';
import { BimbinganManager } from './components/academic/BimbinganManager';
import { DownloadPerangkat } from './components/academic/DownloadPerangkat';

// AI Suite Components
import { ModulAjarGenerator } from './components/ai/ModulAjarGenerator';
import { PerangkatAjarGenerator } from './components/ai/PerangkatAjarGenerator';
import { KbcGenerator } from './components/ai/KbcGenerator';
import { KokurikulerGenerator } from './components/ai/KokurikulerGenerator';
import { SoalUjianGenerator } from './components/ai/SoalUjianGenerator';
import { KartuSoalGenerator } from './components/ai/KartuSoalGenerator';
import { LkpdGenerator } from './components/ai/LkpdGenerator';
import { PptGenerator } from './components/ai/PptGenerator';
import { ChatAsistenGuru } from './components/ai/ChatAsistenGuru';
import { MediaInteraktifGenerator } from './components/ai/MediaInteraktifGenerator';

// Reports & Settings Components
import { PusatLaporan } from './components/reports/PusatLaporan';
import { PengaturanManager } from './components/settings/PengaturanManager';
import { LoginModal } from './components/auth/LoginModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => dbService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('tongguru_dark') === 'true';
  });

  // Mobile BottomSheet state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bottomSheetType, setBottomSheetType] = useState<'akademik' | 'ai' | null>(null);

  // Upload Logo Modal state
  const [isUploadLogoModalOpen, setIsUploadLogoModalOpen] = useState(false);
  const [logoFileUrl, setLogoFileUrl] = useState('');
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<string | null>(null);

  // Reactive DB state
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [absensiList, setAbsensiList] = useState<Absensi[]>([]);
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [agendaList, setAgendaList] = useState<Agenda[]>([]);
  const [bimbinganList, setBimbinganList] = useState<Bimbingan[]>([]);
  const [pengaturan, setPengaturan] = useState<Pengaturan>(() => dbService.getPengaturan());

  const refreshData = () => {
    setSiswaList(dbService.getSiswa());
    setMapelList(dbService.getMapel());
    setJadwalList(dbService.getJadwal());
    setAbsensiList(dbService.getAbsensi());
    setNilaiList(dbService.getNilai());
    setAgendaList(dbService.getAgenda());
    setBimbinganList(dbService.getBimbingan());
    setPengaturan(dbService.getPengaturan());
    setCurrentUser(dbService.getCurrentUser());
  };

  useEffect(() => {
    dbService.init();
    refreshData();
    const unsubscribe = dbService.subscribe(refreshData);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tongguru_dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tongguru_dark', 'false');
    }
  }, [darkMode]);

  const handleLogout = () => {
    Swal.fire({
      title: 'Keluar dari Aplikasi?',
      text: 'Anda akan keluar dari sesi akun guru.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
    }).then((res) => {
      if (res.isConfirmed) {
        dbService.setAuthUser(null);
        setCurrentUser(null);
        setActiveTab('dashboard');
      }
    });
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginModal onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  // Block-Style Navigation Data with Sharp Saturated Colors (Menu Biru, Hijau, Orange, Kuning)
  const NAV_GROUPS = [
    {
      groupTitle: 'MENU UTAMA',
      categoryBadge: 'BIRU TAJAM',
      themeKey: 'blue',
      headerBg: 'bg-blue-700 text-white border-2 border-blue-400 shadow-md',
      activeBlock: 'bg-blue-600 text-white border-2 border-blue-300 shadow-lg shadow-blue-600/30 ring-2 ring-blue-400 font-extrabold scale-[1.02]',
      inactiveBlock: 'bg-blue-50/90 dark:bg-blue-950/70 text-blue-950 dark:text-blue-100 border-2 border-blue-300 dark:border-blue-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 font-bold transition-all hover:scale-[1.01]',
      iconActive: 'bg-white text-blue-700 font-black',
      iconInactive: 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      accentColor: '#2563eb',
      items: [{ id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard }],
    },
    {
      groupTitle: 'MENU AKADEMIK',
      categoryBadge: 'MULTI WARNA',
      themeKey: 'green',
      headerBg: 'bg-emerald-800 text-white border-2 border-emerald-400 shadow-md',
      activeBlock: 'bg-emerald-600 text-white border-2 border-emerald-300 shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400 font-extrabold scale-[1.02]',
      inactiveBlock: 'bg-emerald-50/90 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 border-2 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 font-bold transition-all hover:scale-[1.01]',
      iconActive: 'bg-white text-emerald-700 font-black',
      iconInactive: 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
      accentColor: '#059669',
      items: [
        {
          id: 'siswa',
          label: 'Kelola Peserta Didik',
          icon: Users,
          colorBadge: 'CYAN',
          customActiveBlock: 'bg-cyan-600 text-white border-2 border-cyan-300 shadow-lg shadow-cyan-600/30 ring-2 ring-cyan-400 font-extrabold scale-[1.02]',
          customInactiveBlock: 'bg-cyan-50/90 dark:bg-cyan-950/70 text-cyan-950 dark:text-cyan-100 border-2 border-cyan-300 dark:border-cyan-700 hover:bg-cyan-600 hover:text-white dark:hover:bg-cyan-600 font-bold transition-all hover:scale-[1.01]',
          customIconActive: 'bg-white text-cyan-700 font-black',
          customIconInactive: 'bg-cyan-200 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200',
        },
        {
          id: 'mapel',
          label: 'Materi & Mata Pelajaran',
          icon: BookOpen,
          colorBadge: 'UNGU',
          customActiveBlock: 'bg-purple-600 text-white border-2 border-purple-300 shadow-lg shadow-purple-600/30 ring-2 ring-purple-400 font-extrabold scale-[1.02]',
          customInactiveBlock: 'bg-purple-50/90 dark:bg-purple-950/70 text-purple-950 dark:text-purple-100 border-2 border-purple-300 dark:border-purple-700 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 font-bold transition-all hover:scale-[1.01]',
          customIconActive: 'bg-white text-purple-700 font-black',
          customIconInactive: 'bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
        },
        {
          id: 'jadwal',
          label: 'Jadwal Pelajaran KBM',
          icon: Calendar,
          colorBadge: 'ROSE',
          customActiveBlock: 'bg-rose-600 text-white border-2 border-rose-300 shadow-lg shadow-rose-600/30 ring-2 ring-rose-400 font-extrabold scale-[1.02]',
          customInactiveBlock: 'bg-rose-50/90 dark:bg-rose-950/70 text-rose-950 dark:text-rose-100 border-2 border-rose-300 dark:border-rose-700 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 font-bold transition-all hover:scale-[1.01]',
          customIconActive: 'bg-white text-rose-700 font-black',
          customIconInactive: 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200',
        },
        {
          id: 'presensi',
          label: 'Kehadiran Siswa (Presensi)',
          icon: UserCheck,
          colorBadge: 'HIJAU',
          customActiveBlock: 'bg-emerald-600 text-white border-2 border-emerald-300 shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400 font-extrabold scale-[1.02]',
          customInactiveBlock: 'bg-emerald-50/90 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 border-2 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 font-bold transition-all hover:scale-[1.01]',
          customIconActive: 'bg-white text-emerald-700 font-black',
          customIconInactive: 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
        },
        { id: 'kartu-siswa', label: 'Cetak Kartu Siswa QR', icon: QrCode },
        { id: 'nilai', label: 'Asesmen & Leger Nilai', icon: Award },
        { id: 'agenda', label: 'Jurnal Agenda Mengajar', icon: BookMarked },
        { id: 'bimbingan', label: 'Bimbingan Wali / BK', icon: HeartHandshake },
        { id: 'perangkat-unduh', label: 'Unduh Perangkat Ajar', icon: FolderDown },
      ],
    },
    {
      groupTitle: 'MENU SUITE AI',
      categoryBadge: 'ORANGE TAJAM',
      themeKey: 'orange',
      headerBg: 'bg-orange-600 text-white border-2 border-orange-400 shadow-md',
      activeBlock: 'bg-orange-500 text-white border-2 border-orange-300 shadow-lg shadow-orange-500/30 ring-2 ring-orange-300 font-extrabold scale-[1.02]',
      inactiveBlock: 'bg-orange-50/90 dark:bg-orange-950/70 text-orange-950 dark:text-orange-100 border-2 border-orange-300 dark:border-orange-700 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 font-bold transition-all hover:scale-[1.01]',
      iconActive: 'bg-white text-orange-600 font-black',
      iconInactive: 'bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      accentColor: '#ea580c',
      items: [
        { id: 'ai-modul', label: 'Rencana Pembelajaran Mendalam', icon: Sparkles, badge: 'HOT' },
        { id: 'ai-media', label: 'Media Pembelajaran Interaktif', icon: Presentation, badge: 'BARU' },
        { id: 'ai-perangkat', label: 'CP, TP, ATP, Prota, KKTP', icon: FileCheck },
        { id: 'ai-kbc', label: 'Perangkat Berbasis Cinta', icon: Heart },
        { id: 'ai-kokurikuler', label: 'Kokurikuler & 7 Kebiasaan Anak', icon: Target, badge: '7 KEBIASAAN' },
        { id: 'ai-soal', label: 'Paket Soal Ujian & LJS', icon: FileQuestion },
        { id: 'ai-kartu-soal', label: 'Kartu Soal & Kisi-Kisi', icon: BookCheck },
        { id: 'ai-lkpd', label: 'Generator LKPD AI', icon: PenTool },
        { id: 'ai-ppt', label: 'Generator Presentasi PPT', icon: Presentation },
        { id: 'ai-chat', label: 'Asisten Chat Konsultan AI', icon: Bot },
      ],
    },
    {
      groupTitle: 'MENU LAPORAN',
      categoryBadge: 'KUNING TAJAM',
      themeKey: 'amber',
      headerBg: 'bg-amber-500 text-slate-950 border-2 border-yellow-300 shadow-md font-black',
      activeBlock: 'bg-amber-400 text-slate-950 border-2 border-amber-600 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 font-black scale-[1.02]',
      inactiveBlock: 'bg-amber-50/90 dark:bg-amber-950/70 text-amber-950 dark:text-amber-100 border-2 border-amber-300 dark:border-amber-700 hover:bg-amber-400 hover:text-slate-950 dark:hover:bg-amber-400 dark:hover:text-slate-950 font-bold transition-all hover:scale-[1.01]',
      iconActive: 'bg-slate-950 text-amber-300 font-black',
      iconInactive: 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200',
      accentColor: '#d97706',
      items: [
        { id: 'laporan', label: 'Pusat Laporan & Cetak', icon: FileText },
        { id: 'pengaturan', label: 'Pengaturan & Database', icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Sleek Top Multi-Color Accent Ribbon (Biru, Hijau, Orange, Kuning) */}
      <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-emerald-500 via-orange-500 to-amber-400 no-print shadow-xs" />

      {/* Top Header Bar with Rich Saturated Colors & Title */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-[#071328] via-[#0d2240] to-[#0a182e] text-white shadow-2xl border-b-2 border-blue-800 px-4 sm:px-6 py-3.5 no-print">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Mobile Menu Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white bg-blue-700/80 hover:bg-blue-600 rounded-xl transition-colors border border-blue-400/50 shadow-sm"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* School Logo (Left of Title) & Title */}
            <div className="flex items-center gap-3">
              <div
                onClick={() => {
                  setLogoFileUrl(pengaturan.logoSekolahUrl || '');
                  setIsUploadLogoModalOpen(true);
                }}
                className="relative group w-12 h-12 rounded-2xl bg-white border-2 border-amber-400 p-1 flex items-center justify-center shadow-xl shrink-0 cursor-pointer transition-all hover:scale-105"
                title="Klik untuk Unggah / Ganti Logo Sekolah Custom"
              >
                {pengaturan.logoSekolahUrl ? (
                  <img src={pengaturan.logoSekolahUrl} alt="Logo Sekolah" className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#1a3a5c] to-blue-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-amber-300" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 p-1 bg-amber-400 text-slate-950 rounded-full shadow-md group-hover:scale-110 transition-transform">
                  <Camera className="w-2.5 h-2.5 font-bold" />
                </div>
              </div>

              {/* Title Text */}
              <div onClick={() => setActiveTab('dashboard')} className="cursor-pointer group text-left">
                <span className="block font-extrabold text-[10px] sm:text-xs md:text-xs tracking-wider uppercase text-blue-200 leading-tight">
                  DASHBOARD ADMINISTRASI
                </span>
                <span className="block font-black text-xs sm:text-sm md:text-base tracking-wide uppercase text-amber-300 group-hover:text-amber-200 transition-colors drop-shadow-md leading-tight">
                  TONGGURU YUSAK YOKOYAMA
                </span>
                <p className="text-[10px] sm:text-[11px] text-blue-200 hidden sm:block truncate max-w-sm font-semibold mt-0.5">
                  {pengaturan.namaSekolah} • {pengaturan.namaGuru.split(',')[0]}
                </p>
              </div>
            </div>
          </div>

          {/* Teacher Profile & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Menu Status Tags (Desktop View) */}
            <div className="hidden xl:flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-black border border-blue-400 shadow-xs">
                🟦 BIRU
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black border border-emerald-400 shadow-xs">
                🟩 HIJAU
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-orange-600 text-white text-[10px] font-black border border-orange-400 shadow-xs">
                🟧 ORANGE
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black border border-amber-300 shadow-xs">
                🟨 KUNING
              </span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-100 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
              title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-200" />}
            </button>

            {/* Teacher Badge */}
            <div className="hidden md:flex items-center gap-2.5 pl-2 border-l-2 border-white/20">
              <div
                onClick={() => setActiveTab('pengaturan')}
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-400 shadow-md cursor-pointer bg-slate-800 flex items-center justify-center font-bold text-xs text-white"
                title="Klik untuk ubah foto profil"
              >
                {pengaturan.fotoProfil ? (
                  <img src={pengaturan.fotoProfil} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-xs text-white">
                    {pengaturan.namaGuru.charAt(0)}
                  </div>
                )}
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-white leading-tight">
                  {pengaturan.namaGuru.split(',')[0]}
                </span>
                <span className="block text-[10px] text-blue-200 font-semibold">
                  {currentUser.role}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-rose-300 hover:bg-rose-600/30 rounded-xl transition-colors border border-rose-500/30"
              title="Keluar Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar (Left) with Solid Card Tiles & Tajam Colors */}
        <aside className="hidden lg:block w-80 shrink-0 border-r-2 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-68px)] sticky top-[68px] no-print">
          
          {/* Header Menu Navigation Notice */}
          <div className="p-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl border-2 border-blue-500/50 shadow-md flex items-center justify-between">
            <div>
              <span className="block text-[11px] font-black uppercase tracking-wider text-amber-300">
                MENU NAVIGASI TAJAM
              </span>
              <span className="text-[10px] text-slate-200 font-medium">
                Pilih modul menu warna di bawah ini:
              </span>
            </div>
            <Layers className="w-5 h-5 text-blue-400" />
          </div>

          {NAV_GROUPS.map((grp, idx) => (
            <div key={idx} className="space-y-2.5">
              {/* Category Menu Header Card */}
              <div className={`px-3 py-2 rounded-xl flex items-center justify-between uppercase font-extrabold tracking-wide text-[11px] ${grp.headerBg}`}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-white shadow-xs"></span>
                  <span>{grp.groupTitle}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-black/30 text-white font-mono text-[9px]">
                  {grp.categoryBadge}
                </span>
              </div>

              {/* Menu Grid Buttons */}
              <div className="space-y-1.5">
                {grp.items.map((item: any) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const activeBlock = item.customActiveBlock || grp.activeBlock;
                  const inactiveBlock = item.customInactiveBlock || grp.inactiveBlock;
                  const iconActive = item.customIconActive || grp.iconActive;
                  const iconInactive = item.customIconInactive || grp.iconInactive;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold tracking-tight transition-all duration-150 ${
                        isActive ? activeBlock : inactiveBlock
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-xs ${
                            isActive ? iconActive : iconInactive
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-left leading-snug">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.colorBadge && (
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-black ${
                            isActive ? 'bg-white/30 text-white' : 'bg-black/10 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                          }`}>
                            {item.colorBadge}
                          </span>
                        )}
                        {item.badge && (
                          <span className={`text-[9px] px-2 py-0.5 rounded-md font-mono font-black shrink-0 shadow-xs ${
                            isActive ? 'bg-white text-rose-600' : 'bg-red-600 text-white animate-pulse'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Mobile Full Sidebar Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-80 max-w-[88%] bg-slate-900 text-white h-full p-5 overflow-y-auto z-10 space-y-5 shadow-2xl border-r-2 border-blue-500">
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
                  <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                  <span className="w-3 h-3 rounded-sm bg-orange-500"></span>
                  <span className="w-3 h-3 rounded-sm bg-amber-400"></span>
                  <span className="font-black text-sm text-white ml-1">MENU NAVIGASI</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {NAV_GROUPS.map((grp, idx) => (
                <div key={idx} className="space-y-2">
                  <div className={`px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] font-extrabold ${grp.headerBg}`}>
                    <span>{grp.groupTitle}</span>
                    <span className="text-[9px] font-mono">{grp.categoryBadge}</span>
                  </div>

                  <div className="space-y-1.5">
                    {grp.items.map((item: any) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const activeBlock = item.customActiveBlock || grp.activeBlock;
                      const inactiveBlock = item.customInactiveBlock || grp.inactiveBlock;
                      const iconActive = item.customIconActive || grp.iconActive;
                      const iconInactive = item.customIconInactive || grp.iconInactive;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold ${
                            isActive ? activeBlock : inactiveBlock
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? iconActive : iconInactive}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-left">{item.label}</span>
                          </div>
                          {item.colorBadge && (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-black ${
                              isActive ? 'bg-white/30 text-white' : 'bg-black/20 text-slate-200'
                            }`}>
                              {item.colorBadge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Body with Smooth Fade-In Animation on Tab Change */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          <div key={activeTab} className="animate-fade-in-tab">
            {activeTab === 'dashboard' && (
              <DashboardOverview
                siswaList={siswaList}
                mapelList={mapelList}
                jadwalList={jadwalList}
                absensiList={absensiList}
                nilaiList={nilaiList}
                agendaList={agendaList}
                pengaturan={pengaturan}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'siswa' && (
              <SiswaManager
                siswaList={siswaList}
                onOpenCardPrinter={(siswaId?: string) => {
                  setSelectedStudentForCard(siswaId || null);
                  setActiveTab('kartu-siswa');
                }}
              />
            )}

            {activeTab === 'kartu-siswa' && (
              <KartuSiswaView
                siswaList={siswaList}
                pengaturan={pengaturan}
                initialSelectedStudentId={selectedStudentForCard}
              />
            )}

            {activeTab === 'mapel' && (
              <JadwalManager
                mapelList={mapelList}
                jadwalList={jadwalList}
                siswaList={siswaList}
                initialTab="mapel"
              />
            )}

            {activeTab === 'jadwal' && (
              <JadwalManager
                mapelList={mapelList}
                jadwalList={jadwalList}
                siswaList={siswaList}
                initialTab="jadwal"
              />
            )}

            {activeTab === 'presensi' && (
              <AbsensiManager siswaList={siswaList} absensiList={absensiList} />
            )}

            {activeTab === 'nilai' && (
              <NilaiManager
                siswaList={siswaList}
                mapelList={mapelList}
                nilaiList={nilaiList}
                absensiList={absensiList}
                pengaturan={pengaturan}
              />
            )}

            {activeTab === 'agenda' && (
              <AgendaManager agendaList={agendaList} pengaturan={pengaturan} />
            )}

            {activeTab === 'bimbingan' && (
              <BimbinganManager bimbinganList={bimbinganList} siswaList={siswaList} />
            )}

            {activeTab === 'perangkat-unduh' && <DownloadPerangkat />}

            {/* AI Suite Modules */}
            {activeTab === 'ai-modul' && <ModulAjarGenerator />}
            {activeTab === 'ai-media' && <MediaInteraktifGenerator />}
            {activeTab === 'ai-perangkat' && <PerangkatAjarGenerator />}
            {activeTab === 'ai-kbc' && <KbcGenerator />}
            {activeTab === 'ai-kokurikuler' && <KokurikulerGenerator />}
            {activeTab === 'ai-soal' && <SoalUjianGenerator />}
            {activeTab === 'ai-kartu-soal' && <KartuSoalGenerator />}
            {activeTab === 'ai-lkpd' && <LkpdGenerator />}
            {activeTab === 'ai-ppt' && <PptGenerator />}
            {activeTab === 'ai-chat' && <ChatAsistenGuru />}

            {/* Reports & Settings */}
            {activeTab === 'laporan' && (
              <PusatLaporan
                siswaList={siswaList}
                mapelList={mapelList}
                absensiList={absensiList}
                nilaiList={nilaiList}
                agendaList={agendaList}
                pengaturan={pengaturan}
              />
            )}

            {activeTab === 'pengaturan' && <PengaturanManager pengaturan={pengaturan} />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Bawah - Solid Block Tile Menu Buttons) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t-2 border-slate-700 p-2 grid grid-cols-4 gap-1.5 no-print shadow-2xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-black uppercase transition-all border ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white border-blue-300 shadow-md scale-105'
              : 'bg-slate-800 text-blue-300 border-blue-900/50 hover:bg-slate-700'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>UTAMA</span>
        </button>

        <button
          onClick={() => setBottomSheetType(bottomSheetType === 'akademik' ? null : 'akademik')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-black uppercase transition-all border ${
            ['siswa', 'kartu-siswa', 'jadwal', 'presensi', 'nilai', 'agenda', 'bimbingan'].includes(activeTab)
              ? 'bg-emerald-600 text-white border-emerald-300 shadow-md scale-105'
              : 'bg-slate-800 text-emerald-300 border-emerald-900/50 hover:bg-slate-700'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span>AKADEMIK</span>
        </button>

        <button
          onClick={() => setBottomSheetType(bottomSheetType === 'ai' ? null : 'ai')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-black uppercase transition-all border ${
            activeTab.startsWith('ai-')
              ? 'bg-orange-600 text-white border-orange-300 shadow-md scale-105'
              : 'bg-slate-800 text-orange-300 border-orange-900/50 hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span>SUITE AI</span>
        </button>

        <button
          onClick={() => setActiveTab('laporan')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-black uppercase transition-all border ${
            activeTab === 'laporan' || activeTab === 'pengaturan'
              ? 'bg-amber-500 text-slate-950 border-yellow-300 shadow-md scale-105 font-black'
              : 'bg-slate-800 text-amber-300 border-amber-900/50 hover:bg-slate-700'
          }`}
        >
          <FileText className="w-4 h-4 mb-0.5" />
          <span>LAPORAN</span>
        </button>
      </nav>

      {/* Mobile BottomSheets */}
      {bottomSheetType && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setBottomSheetType(null)} />
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-3xl p-5 z-10 shadow-2xl border-t border-slate-200 dark:border-slate-800 max-h-[70vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {bottomSheetType === 'akademik' ? 'Menu Administrasi Akademik' : 'Suite Generator AI Kurikulum Merdeka'}
              </span>
              <button onClick={() => setBottomSheetType(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {bottomSheetType === 'akademik' && (
                <>
                  <button
                    onClick={() => {
                      setActiveTab('siswa');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-800 rounded-xl text-xs font-bold text-cyan-900 dark:text-cyan-200 flex items-center justify-between"
                  >
                    <span>👥 Peserta Didik</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-600 text-white font-mono">CYAN</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('mapel');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 rounded-xl text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center justify-between"
                  >
                    <span>📚 Materi Pelajaran</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-600 text-white font-mono">UNGU</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('jadwal');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center justify-between"
                  >
                    <span>📅 Jadwal KBM</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono">ROSE</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('presensi');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between"
                  >
                    <span>📷 Kehadiran Siswa</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono">HIJAU</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('kartu-siswa');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                  >
                    📇 Cetak Kartu Siswa QR
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('nilai');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                  >
                    🎖️ Asesmen Nilai Rapor
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('agenda');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                  >
                    📖 Jurnal Harian Guru
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('bimbingan');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                  >
                    🤝 Bimbingan Wali / BK
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('perangkat-unduh');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                  >
                    📂 Unduh Perangkat Ajar
                  </button>
                </>
              )}

              {bottomSheetType === 'ai' && (
                <>
                  <button
                    onClick={() => {
                      setActiveTab('ai-modul');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold text-blue-600"
                  >
                    ✨ Rencana Pembelajaran Mendalam
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('ai-media');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold text-amber-600"
                  >
                    🎮 Media Pembelajaran Interaktif
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('ai-perangkat');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                  >
                    📑 CP, TP, ATP, Prota, KKTP
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('ai-soal');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                  >
                    📝 Paket Soal Ujian & LJS
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('ai-ppt');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                  >
                    📊 Slide Bahan Tayang PPT
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('ai-kbc');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                  >
                    ❤️ Perangkat Berbasis Cinta
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('ai-kokurikuler');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                  >
                    🎯 Kokurikuler & 7 Kebiasaan Anak
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('ai-kartu-soal');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                  >
                    🗂️ Kartu Soal & Kisi-Kisi
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('ai-lkpd');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                  >
                    ✏️ Generator LKPD AI
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('ai-chat');
                      setBottomSheetType(null);
                    }}
                    className="p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold text-emerald-600 col-span-2"
                  >
                    🤖 Chat Asisten Konsultan Guru AI
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL UNGGAH LOGO SEKOLAH */}
      {isUploadLogoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative">
            <button
              onClick={() => setIsUploadLogoModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center mb-2">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Unggah Logo Sekolah Baru
              </h3>
              <p className="text-xs text-slate-500">
                Logo sekolah akan ditampilkan di samping judul dashboard, kop surat resmi, dan cetakan kartu siswa.
              </p>
            </div>

            {/* Live Preview */}
            <div className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white p-2 border-2 border-blue-500 shadow-md flex items-center justify-center">
                {logoFileUrl ? (
                  <img src={logoFileUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <span className="text-[11px] font-semibold text-slate-500">Pratinjau Logo Sekolah</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                dbService.savePengaturan({ logoSekolahUrl: logoFileUrl.trim() });
                setIsUploadLogoModalOpen(false);
                showToast('Logo Sekolah Diperbarui!', 'success', 'Logo sekolah berhasil disimpan dan disinkronkan ke seluruh aplikasi.');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Unggah Berkas Gambar (PNG/JPG)
                </label>
                <label className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 dark:bg-blue-950/50 border border-dashed border-blue-300 dark:border-blue-800 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 cursor-pointer hover:bg-blue-100 transition-all">
                  <Upload className="w-4 h-4" /> Pilih File Gambar Logo Sekolah
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(evt) => {
                      const file = evt.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          Swal.fire('File Terlalu Besar', 'Maksimal ukuran file logo adalah 2MB.', 'warning');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setLogoFileUrl(e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. Atau Tempelkan Tautan URL Logo
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={logoFileUrl}
                  onChange={(e) => setLogoFileUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {logoFileUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoFileUrl('')}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Reset Logo
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsUploadLogoModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Simpan Logo Sekolah
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
