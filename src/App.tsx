import React, { useState, useEffect } from 'react';
import { Student, Installment, CashTransaction, Lesson, Teacher } from './types';
import { getStoredData, saveStoredData, recalculateInstallmentStatus, getTodayDateString, formatTurkishDate } from './data/mockData';
import { loadFirestoreData, syncStateWithFirestore, forceUploadLocalDataToFirestore, clearAllFirestoreData, AppDatabaseState } from './data/firebaseService';
import { db, getFirebaseProvider, setFirebaseProvider, FirebaseProvider } from './data/firebase';
import Dashboard from './components/Dashboard';
import StudentManager from './components/StudentManager';
import InstallmentsManager from './components/InstallmentsManager';
import CalendarManager from './components/CalendarManager';
import TeacherManager from './components/TeacherManager';
import AcademyLogo from './components/AcademyLogo';
import { GraduationCap, LayoutDashboard, CreditCard, ChevronDown, CheckSquare, Sparkles, Building2, Landmark, PhoneCall, Calendar, Users, RefreshCw, AlertCircle, Smartphone, Download, X, Share2, Lock, LogOut, Key } from 'lucide-react';

export default function App() {
  // Database State
  const [students, setStudents] = useState<Student[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dbMode, setDbMode] = useState<'firebase' | 'local'>('firebase');
  const [dbError, setDbError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [provider, setProvider] = useState<FirebaseProvider>(getFirebaseProvider());
  const [errorPanelCollapsed, setErrorPanelCollapsed] = useState<boolean>(false);
  const [migrating, setMigrating] = useState<boolean>(false);
  const [migrationSuccess, setMigrationSuccess] = useState<string | null>(null);
  const [wiping, setWiping] = useState<boolean>(false);
  const [autoWiped, setAutoWiped] = useState<boolean>(false);

  // PWA Support States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [showPwaGuide, setShowPwaGuide] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (localStorage.getItem('or_pwa_dismissed') !== 'true') {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if launching from installed/standalone app
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      setShowInstallBanner(false);
    } else {
      // Force trigger the install indicator banner for mobile devices if not dismissed
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile && localStorage.getItem('or_pwa_dismissed') !== 'true') {
        setShowInstallBanner(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstallPrompt = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA installation response outcome: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } else {
      // Show manual multi-device guided popup
      setShowPwaGuide(true);
    }
  };

  const dismissPwaBanner = () => {
    localStorage.setItem('or_pwa_dismissed', 'true');
    setShowInstallBanner(false);
  };

  const handleWipeDatabase = async () => {
    if (!window.confirm("DİKKAT: Öğrenci, Eğitmen, Taksit, Ders ve Kasa kayıtlarının TÜMÜ kalıcı olarak silinecektir. Bu işlem geri alınamaz!\n\nSeçilmiş tüm örnek veriler temizlenecek ve boş bir veritabanı kurulacaktır. Devam etmek istiyor musunuz?")) {
      return;
    }
    
    setWiping(true);
    setLoading(true);
    try {
      if (dbMode === 'firebase') {
        await clearAllFirestoreData();
      }
      
      // Update local storage empty slate as well
      localStorage.setItem("or_initialized", "true");
      saveStoredData([], [], [], [], []);
      
      setStudents([]);
      setTeachers([]);
      setInstallments([]);
      setTransactions([]);
      setLessons([]);
      
      setMigrationSuccess("Tüm veriler başarıyla sıfırlandı! Artık sisteminiz tamamen temiz bir sayfaya sahip. Kendi öğrenci ve eğitmen kadronuzu eklemeye başlayabilirsiniz.");
    } catch (err) {
      console.error("Wipe failed:", err);
      alert("Veritabanı temizlenirken hata oluştu: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setWiping(false);
      setLoading(false);
    }
  };

  const handleMigrateLocalData = async () => {
    setMigrating(true);
    setMigrationSuccess(null);
    try {
      const localData = getStoredData();
      await forceUploadLocalDataToFirestore(localData);
      setMigrationSuccess("Tebrikler! Yerel verileriniz başarıyla bulut veritabanına aktarıldı. Artık cep telefonunuzdan ve tüm diğer cihazlardan aynı ortak verileri görebilirsiniz!");
      setRetryCount(prev => prev + 1); // trigger state sync from Firestore to update local view
    } catch (err) {
      console.error(err);
      setMigrationSuccess(`Aktarım başarısız oldu: ${err instanceof Error ? err.message : String(err)}. Lütfen bulut bağlantınızın kurulduğunu (Internet / Firebase) kontrol edip tekrar deneyin.`);
    } finally {
      setMigrating(false);
    }
  };

  const handleSwitchProvider = (newProvider: FirebaseProvider) => {
    setFirebaseProvider(newProvider);
    setProvider(newProvider);
    localStorage.removeItem('app_cached_data');
    window.location.reload();
  };

  // Active UI Navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'installments' | 'calendar' | 'teachers'>('dashboard');

  // Load and initialize from Firestore (falls back to localStorage or seeded mock data)
  useEffect(() => {
    async function initDatabase() {
      setLoading(true);
      if (dbMode === 'local') {
        console.log("Local offline mode: loading from localStorage...");
        try {
          const data = getStoredData();
          const hasMockStudents = data.students.some(s => s.id === 'std-1') || data.teachers.some(t => t.id === 'tch-1');
          if (hasMockStudents) {
            console.log("Mock data detected locally. Auto-wiping...");
            localStorage.setItem("or_initialized", "true");
            saveStoredData([], [], [], [], []);
            setStudents([]);
            setInstallments([]);
            setTransactions([]);
            setLessons([]);
            setTeachers([]);
            setAutoWiped(true);
          } else {
            const alignedInstallments = recalculateInstallmentStatus(data.installments, getTodayDateString());
            setStudents(data.students);
            setInstallments(alignedInstallments);
            setTransactions(data.transactions);
            setLessons(data.lessons || []);
            setTeachers(data.teachers || []);
          }
          setDbError(null);
        } catch (err) {
          console.error("Local data initialization failed:", err);
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        console.log("Fetching live data from Firestore...");
        
        // Wrap with a guaranteed 25000ms timeout race so the app never gets stuck 
        // if user's custom Firestore is slow, locked, or unconfigured.
        const data = await Promise.race([
          loadFirestoreData(),
          new Promise<AppDatabaseState>((_, reject) => 
            setTimeout(() => reject(new Error("Firestore connection timed out")), 25000)
          )
        ]);

        const hasMockStudents = data.students.some(s => s.id === 'std-1') || data.teachers.some(t => t.id === 'tch-1');
        if (hasMockStudents) {
          console.log("Mock data detected in Firestore. Auto-wiping as requested for clean slate...");
          await clearAllFirestoreData();
          localStorage.setItem("or_initialized", "true");
          saveStoredData([], [], [], [], []);
          setStudents([]);
          setInstallments([]);
          setTransactions([]);
          setLessons([]);
          setTeachers([]);
          setAutoWiped(true);
        } else {
          const alignedInstallments = recalculateInstallmentStatus(data.installments, getTodayDateString());

          setStudents(data.students);
          setInstallments(alignedInstallments);
          setTransactions(data.transactions);
          setLessons(data.lessons);
          setTeachers(data.teachers);
          
          // Pre-cache to localStorage as well for instant-responsiveness
          saveStoredData(data.students, alignedInstallments, data.transactions, data.lessons, data.teachers);
        }
        setDbMode('firebase');
        setDbError(null);

      } catch (err) {
        console.warn("Could not load from Firestore, using offline storage fallback:", err);
        const errVal = err instanceof Error ? err.message : String(err);
        let friendlyError = errVal;
        try {
          if (errVal.startsWith("{")) {
            const parsed = JSON.parse(errVal);
            if (parsed && parsed.error) {
              friendlyError = parsed.error;
            }
          }
        } catch (_) {}

        if (friendlyError.includes("timed out")) {
          friendlyError = "Bulut sunucusuna bağlantı zaman aşımına uğradı. Lütfen internetinizi kontrol edip yeniden bağlanmayı deneyin.";
        } else if (friendlyError.includes("Missing or insufficient permissions") || friendlyError.includes("permission-denied")) {
          friendlyError = "Erişim yetkisi reddedildi. Firestore güvenlik kurallarınızı kontrol edin.";
        } else if (friendlyError.includes("Unavailable") || friendlyError.includes("network") || friendlyError.includes("offline")) {
          friendlyError = "Bulut sunucularına ulaşılamıyor (Ağ hatası). Tarayıcınız çevrimdışı çalışmaya devam ediyor.";
        }

        setDbError(friendlyError);
        setDbMode('local');
        const data = getStoredData();
        const alignedInstallments = recalculateInstallmentStatus(data.installments, getTodayDateString());

        setStudents(data.students);
        setInstallments(alignedInstallments);
        setTransactions(data.transactions);
        setLessons(data.lessons || []);
        setTeachers(data.teachers || []);
      } finally {
        setLoading(false);
      }
    }
    initDatabase();
  }, [retryCount]);

  // Sync to database layer
  const syncAndSave = (
    nextStudents: Student[], 
    nextInstallments: Installment[], 
    nextTransactions: CashTransaction[],
    nextLessons: Lesson[] = lessons,
    nextTeachers: Teacher[] = teachers
  ) => {
    const aligned = recalculateInstallmentStatus(nextInstallments, getTodayDateString());
    
    // Save previous snapshot for diffing
    const oldState: AppDatabaseState = { students, installments, transactions, lessons, teachers };
    const newState: AppDatabaseState = { 
      students: nextStudents, 
      installments: aligned, 
      transactions: nextTransactions, 
      lessons: nextLessons, 
      teachers: nextTeachers 
    };

    setStudents(nextStudents);
    setInstallments(aligned);
    setTransactions(nextTransactions);
    setLessons(nextLessons);
    setTeachers(nextTeachers);

    // Save to localStorage immediately so student is updated on UI inside iframe instantly with zero latency
    saveStoredData(nextStudents, aligned, nextTransactions, nextLessons, nextTeachers);

    // Sync incrementally with Firestore in the background, catch errors gracefully
    if (dbMode === 'firebase') {
      syncStateWithFirestore(oldState, newState).catch(err => {
        console.warn("Background cloud syncing error, running in hybrid cache mode:", err);
      });
    }
  };

  // Add Student Handler
  const handleAddStudent = (newStudent: Student, generatedInstallments: Installment[]) => {
    const nextStudents = [newStudent, ...students];
    const nextInstallments = [...generatedInstallments, ...installments];
    
    // Add down payment as an automatic incoming transaction if it's > 0
    let nextTransactions = [...transactions];
    if (newStudent.downPayment > 0) {
      const downPaymentTx: CashTransaction = {
        id: `tx-down-${newStudent.id}-${Date.now()}`,
        studentId: newStudent.id,
        studentName: newStudent.name,
        amount: newStudent.downPayment,
        type: "incoming",
        category: "Peşinat",
        date: newStudent.registrationDate,
        paymentMethod: "Bank Transfer",
        description: `${newStudent.name} - Başlangıç Kayıt Peşinatı`
      };
      nextTransactions = [downPaymentTx, ...nextTransactions];
    }

    syncAndSave(nextStudents, nextInstallments, nextTransactions);
  };

  // Update Student Handler
  const handleUpdateStudent = (updated: Student) => {
    const nextStudents = students.map(s => s.id === updated.id ? updated : s);
    // Propagate student name change if edited
    const nextInstallments = installments.map(inst => {
      if (inst.studentId === updated.id) {
        return { ...inst, studentName: updated.name };
      }
      return inst;
    });
    const nextLessons = lessons.map(l => {
      if (l.studentId === updated.id) {
        return { ...l, studentName: updated.name };
      }
      return l;
    });

    syncAndSave(nextStudents, nextInstallments, transactions, nextLessons);
  };

  // Delete Student Handler (Cascading delete to respect relational model)
  const handleDeleteStudent = (studentId: string) => {
    const nextStudents = students.filter(s => s.id !== studentId);
    const nextInstallments = installments.filter(inst => inst.studentId !== studentId);
    const nextTransactions = transactions.filter(tx => tx.studentId !== studentId);
    const nextLessons = lessons.filter(l => l.studentId !== studentId);
    syncAndSave(nextStudents, nextInstallments, nextTransactions, nextLessons);
  };

  // Teacher Handlers
  const handleAddTeacher = (newTch: Teacher) => {
    const nextTeachers = [newTch, ...teachers];
    syncAndSave(students, installments, transactions, lessons, nextTeachers);
  };

  const handleUpdateTeacher = (updatedTch: Teacher) => {
    const nextTeachers = teachers.map(t => t.id === updatedTch.id ? updatedTch : t);
    const nextStudents = students.map(s => {
      if (s.teacherId === updatedTch.id) {
        return { ...s, teacherName: updatedTch.name };
      }
      return s;
    });
    syncAndSave(nextStudents, installments, transactions, lessons, nextTeachers);
  };

  const handleDeleteTeacher = (tchId: string) => {
    const nextTeachers = teachers.filter(t => t.id !== tchId);
    const nextStudents = students.map(s => {
      if (s.teacherId === tchId) {
        return { ...s, teacherId: undefined, teacherName: undefined };
      }
      return s;
    });
    syncAndSave(nextStudents, installments, transactions, lessons, nextTeachers);
  };

  // Receive/Record Installment Payment Handler
  const handlePayInstallment = (installmentId: string, paidAmount: number, paymentMethod: string, date: string) => {
    const nextInstallments = installments.map(inst => {
      if (inst.id === installmentId) {
        const nextPaid = inst.paidAmount + paidAmount;
        const isFullyPaid = nextPaid >= inst.amount;
        return {
          ...inst,
          paidAmount: nextPaid,
          paymentDate: date,
          paymentMethod: paymentMethod,
          status: isFullyPaid ? ('paid' as const) : inst.status
        };
      }
      return inst;
    });

    // Create tracking journal entry
    const targetInst = installments.find(inst => inst.id === installmentId);
    let nextTransactions = [...transactions];
    if (targetInst) {
      const paymentTx: CashTransaction = {
        id: `tx-inst-${installmentId}-${Date.now()}`,
        studentId: targetInst.studentId,
        studentName: targetInst.studentName,
        installmentId: installmentId,
        amount: paidAmount,
        type: "incoming",
        category: "Taksit Tahsilatı",
        date: date,
        paymentMethod: paymentMethod,
        description: `${targetInst.studentName} - ${targetInst.installmentNumber}. Taksit Ödeme Tahsilatı`
      };
      nextTransactions = [paymentTx, ...nextTransactions];
    }

    syncAndSave(students, nextInstallments, nextTransactions);
  };

  // Reset Installment Payment Handler
  const handleResetInstallment = (installmentId: string) => {
    const nextInstallments = installments.map(inst => {
      if (inst.id === installmentId) {
        return {
          ...inst,
          paidAmount: 0,
          paymentDate: undefined,
          paymentMethod: undefined,
          status: 'pending' as const
        };
      }
      return inst;
    });

    // Delete corresponding transactions to balance cashier
    const nextTransactions = transactions.filter(tx => tx.installmentId !== installmentId);
    syncAndSave(students, nextInstallments, nextTransactions);
  };

  // Modify Specific Installment Handler (Amount and Due Date)
  const handleUpdateInstallment = (updatedInst: Installment) => {
    const nextInstallments = installments.map(inst => inst.id === updatedInst.id ? updatedInst : inst);
    syncAndSave(students, nextInstallments, transactions);
  };

  const handleAddInstallment = (newInst: Installment) => {
    const nextInstallments = [newInst, ...installments];
    syncAndSave(students, nextInstallments, transactions);
  };

  const handleAddTransaction = (newTx: CashTransaction) => {
    const nextTransactions = [newTx, ...transactions];
    syncAndSave(students, installments, nextTransactions);
  };

  const handleDeleteTransaction = (txId: string) => {
    const nextTransactions = transactions.filter(tx => tx.id !== txId);
    syncAndSave(students, installments, nextTransactions);
  };

  const netKasaBalance = transactions.reduce((sum, tx) => {
    return tx.type === 'incoming' ? sum + tx.amount : sum - tx.amount;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-990 bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans" id="db-loader-screen">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <AcademyLogo size="lg" />
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400">Bulut veritabanı (Firebase cloud) senkronizasyonu gerçekleştiriliyor...</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 text-amber-500 font-bold text-[10px] rounded-full border border-slate-800 mt-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" /> Veriler Yükleniyor
          </div>
        </div>
      </div>
    );
  }

  // Database layout starts immediately here

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="app-container">
      {/* Upper Navigation Brand Header */}
      <header className="bg-slate-900 text-white border-b border-slate-950 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <AcademyLogo size="md" />
        </div>

         {/* Action Widgets */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto text-xs font-semibold">
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <Landmark className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Aktif Kasa:</span>
            <span className="text-emerald-400 font-bold font-mono">
              {netKasaBalance.toLocaleString('tr-TR')} ₺
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${dbMode === 'firebase' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-[11px] text-slate-300 font-medium">
              {dbMode === 'firebase' ? 'Bulut Aktif' : 'Yerel (Offline)'}
            </span>
          </div>

          <div className="hidden md:flex text-slate-400 font-medium items-center gap-1.5">
            <span className="text-slate-300">Tarih: {formatTurkishDate(getTodayDateString())}</span>
          </div>
        </div>
      </header>

      {/* Main Framework Layout Grid */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side Navigation Sidebar - Adaptive Horizontal on Mobile, Vertical on Desktop */}
        <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-150 p-3 sm:p-4 shrink-0" id="aside-navigation-sidebar">
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase px-3 py-2 hidden lg:block">Ana Modüller</p>
          
          <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 gap-1.5 lg:space-y-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 sm:py-2.5 rounded-xl text-left text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700 font-black shadow-3xs'
                  : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Özet Paneli</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-3.5 py-2 sm:py-2.5 rounded-xl text-left text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-indigo-50 text-indigo-700 font-black shadow-3xs'
                  : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Öğrenci Kayıt</span>
            </button>

            <button
              onClick={() => setActiveTab('installments')}
              className={`flex items-center gap-2 px-3.5 py-2 sm:py-2.5 rounded-xl text-left text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'installments'
                  ? 'bg-indigo-50 text-indigo-700 font-black shadow-3xs'
                  : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <CheckSquare className="w-4 h-4 shrink-0" />
              <span>Taksit Takip</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3.5 py-2 sm:py-2.5 rounded-xl text-left text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-indigo-50 text-indigo-700 font-black shadow-3xs'
                  : 'text-gray-655 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Ders Takvimi</span>
            </button>

            <button
              onClick={() => setActiveTab('teachers')}
              className={`flex items-center gap-2 px-3.5 py-2 sm:py-2.5 rounded-xl text-left text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'teachers'
                  ? 'bg-indigo-50 text-indigo-700 font-black shadow-3xs'
                  : 'text-gray-655 hover:bg-gray-50 hover:text-gray-900'
              }`}
              id="sidebar-nav-teachers"
            >
              <Users className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Eğitmenler</span>
            </button>
          </nav>

          <div className="pt-6 hidden lg:block text-center text-[10px] text-gray-400 font-medium">
            <p>Yağmur Yüksel Sanat Akademisi v1.4.0</p>
            <p className="mt-0.5">Yönetici Paneli</p>
          </div>
        </aside>

        {/* Dynamic Inner Router Workspace */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full">

          {/* PWA Install Banner */}
          {showInstallBanner && (
            <div className="mb-6 bg-gradient-to-r from-indigo-950 to-[#0e1726] border border-indigo-900 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md animate-fade-in text-white relative overflow-hidden" id="pwa-install-app-banner">
              {/* Soft decorative golden glow blur circles */}
              <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="p-1.5 bg-gradient-to-tr from-amber-400 to-amber-200 rounded-xl text-indigo-950 shrink-0 shadow-md">
                  <img src="/icon-192.png" alt="Logo" className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-350 font-sans tracking-wide flex items-center gap-1.5">
                    YY Akademiyi Telefona Yükle!
                    <span className="text-[9px] bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Hızlı Erişim</span>
                  </h3>
                  <p className="text-xs text-indigo-150 mt-0.5 leading-relaxed">
                    Telefonunuzda tam ekran bir uygulama olarak açın; kayıtlarınıza ve ders planınıza anında ulaşın.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto relative z-10">
                <button
                  onClick={triggerInstallPrompt}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-indigo-950 rounded-xl text-xs font-black transition-all shadow-sm shadow-amber-400/10 hover:shadow-amber-400/20 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Şimdi Yükle
                </button>
                <button
                  onClick={dismissPwaBanner}
                  className="flex items-center justify-center p-2 hover:bg-white/10 rounded-xl text-indigo-300 hover:text-white transition-colors cursor-pointer"
                  title="Yükleme uyarısını gizle"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Auto-wipe Clean Slate Banner */}
          {autoWiped && (
            <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-fade-in" id="autowipe-success-banner">
              <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-indigo-950 font-sans">Kayıtlar Başarıyla Sıfırlandı (Temiz Başlangıç)!</h3>
                  <button 
                    onClick={() => setAutoWiped(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Kapat
                  </button>
                </div>
                <p className="text-xs text-indigo-900 mt-1">
                  Öğrenci ve eğitmen kadrosundaki tüm örnek veriler isteğiniz üzerine başarıyla temizlendi. Sisteminiz artık tamamen boş ve kendi öğrenci ve eğitmen kayıtlarınızı girmeye hazır durumda!
                </p>
              </div>
            </div>
          )}

          {/* Bulut Bağlantısı ve Veri Eşitleme Paneli */}
          {dbMode === 'local' ? (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-fade-in" id="firebase-connection-banner">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-600 shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 font-sans">Yerel Çevrimdışı Çalışma Modu</h3>
                  <p className="text-xs text-slate-600">Uygulamanız şu anda verileri tarayıcınıza kaydediyor. Senkronizasyon için Bulut bağlantısına geçin.</p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Aktif Bulut Altyapısı: <span className="font-bold text-slate-700">{provider === 'aistudio' ? "Yapay Zeka (AI Studio) Hazır Bulutu" : "Özel Firebase Projeniz"}</span>
                  </p>
                  {dbError && (
                    <div className="mt-1 text-[10px] text-rose-600 font-semibold bg-rose-50/50 px-2 py-1 rounded border border-rose-100/50 inline-block text-left max-w-full leading-relaxed">
                      Bağlantı hatası: {dbError}
                    </div>
                  )}
                  {provider === 'custom' && (
                    <div className="pt-1">
                      <button
                        onClick={() => handleSwitchProvider('aistudio')}
                        className="cursor-pointer text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline block"
                        title="AI Studio tarafından kurulan, sıfır yapılandırma gerektiren ve anında aktif olan varsayılan veri tabanına dönün."
                      >
                        Sistem Hazır Bulutuna (AI Studio) Dön ve Sayfayı Yeniden Başlat
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto mt-2 md:mt-0">
                <button
                  onClick={() => {
                    setDbError(null);
                    setDbMode('firebase');
                    setRetryCount(prev => prev + 1);
                  }}
                  className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Buluta Bağlanmayı Dene
                </button>
                <button
                  onClick={handleMigrateLocalData}
                  disabled={migrating}
                  className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  {migrating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Aktarılıyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Yerel Verileri Buluta Eşitle (Yükle)
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Eşitleme Başarılı Mesaj Paneli */
            migrationSuccess && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-fade-in" id="migration-success-banner">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 font-sans">Bulut Senkronizasyonu Başarılı!</h3>
                    <button 
                      onClick={() => setMigrationSuccess(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Kapat
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{migrationSuccess}</p>
                </div>
              </div>
            )
          )}

          {activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase">AKADEMİ KASA RAPORU</span>
                <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight mt-0.5">Finansal Göstergeler & Geciken Ödemeler</h2>
                <p className="text-xs text-gray-500">Mevcut cari tahsilat durumları, yaklaşan senetler ve gecikmiş vadelerin anlık dökümü.</p>
              </div>
              <Dashboard 
                students={students} 
                installments={installments} 
                transactions={transactions}
                onSelectTab={setActiveTab}
                onPayInstallmentClick={(installmentId) => {
                  const target = installments.find(inst => inst.id === installmentId);
                  if (target) {
                    setActiveTab('installments');
                    // Opens the installments pane so they can view and pay
                  }
                }}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </div>
          )}

          {activeTab === 'students' && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase">KAYIT VERİTABANI (CRUD)</span>
                <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight mt-0.5">Öğrenci Kayıt ve Otomatik Taksitlendirme</h2>
                <p className="text-xs text-gray-500">Yeni öğrenci kaydedin, toplam bütçesine göre otomatik vadeli ödeme planı ve peşinat tablolaması oluşturun.</p>
              </div>
              <StudentManager 
                students={students} 
                installments={installments}
                teachers={teachers}
                onAddStudent={handleAddStudent}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
              />
            </div>
          )}

          {activeTab === 'installments' && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase">ÖDEME PLANI DEPOSU</span>
                <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight mt-0.5">Vadelendirme Cetveli & Tahsilat Girişleri</h2>
                <p className="text-xs text-gray-500">Öğrencilerin aylık vadesi gelen borçlarını görün, ödeme kaydedin, veliye otomatik WhatsApp hatırlatması hazırlayın.</p>
              </div>
              <InstallmentsManager 
                installments={installments} 
                students={students}
                onPayInstallment={handlePayInstallment}
                onResetInstallment={handleResetInstallment}
                onUpdateInstallment={handleUpdateInstallment}
                onAddInstallment={handleAddInstallment}
              />
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase">DERS AKIŞ PLANI</span>
                <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight mt-0.5">Haftalık Ders Programı & Düzenleme</h2>
                <p className="text-xs text-gray-500">Öğrencilerinizin düzenli ders gün ve saatlerini belirleyin, öğretmen atayın ve çakışma uyarılarını denetleyin.</p>
              </div>
              <CalendarManager 
                students={students}
                lessons={lessons}
                teachers={teachers}
                onAddLesson={(newLesson) => syncAndSave(students, installments, transactions, [newLesson, ...lessons])}
                onUpdateLesson={(updatedLesson) => syncAndSave(students, installments, transactions, lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l))}
                onDeleteLesson={(lessonId) => syncAndSave(students, installments, transactions, lessons.filter(l => l.id !== lessonId))}
              />
            </div>
          )}

          {activeTab === 'teachers' && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase">AKADEMİ KADROSU</span>
                <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight mt-0.5">Eğitmen Kadrosu & Branş Yönetimi</h2>
                <p className="text-xs text-gray-500">Akademi eğitmenlerin uzmanlık alanlarını görün, yeni eğitmen kaydedin, dilediğiniz gibi gruptan çıkarın veya düzenleyin.</p>
              </div>
              <TeacherManager 
                teachers={teachers}
                onAddTeacher={handleAddTeacher}
                onUpdateTeacher={handleUpdateTeacher}
                onDeleteTeacher={handleDeleteTeacher}
              />
            </div>
          )}


        </main>
      </div>

      {/* PWA Instruction Guide Modal */}
      {showPwaGuide && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="pwa-guide-overlay">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-100 shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-sans">YY Akademiyi Telefonunuza Ekleyin</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Uygulama Kurulum Kılavuzu</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPwaGuide(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="bg-indigo-50/50 border border-indigo-100/40 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                  <img src="/icon-192.png" alt="Academy App Icon" className="w-6 h-6 rounded-md object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Yağmur Yüksel Sanat Akademisi</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">Uygulama simgesi telefonunuzun ana ekranına bu gold amblem logosuyla yerleşecektir.</p>
                </div>
              </div>

              {/* iOS Guide */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-sm font-sans font-bold">1</span>
                  <span>Apple (iPhone / iPad) Telefonlar İçin:</span>
                </div>
                <div className="pl-6 text-xs text-slate-600 space-y-2">
                  <p className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-indigo-600 font-bold shrink-0">a.</span>
                    <span>Safari tarayıcınızın alt barındaki <strong>Paylaş/Yönlendir</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-indigo-600 inline-block align-text-bottom" /> simgesine tıklayın.</span>
                  </p>
                  <p className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-indigo-600 font-bold shrink-0">b.</span>
                    <span>Açılan menüyü yukarı kaydırarak <strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin.</span>
                  </p>
                  <p className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-indigo-600 font-bold shrink-0">c.</span>
                    <span>Açılan pencerenin sağ üst köşesinden <strong>"Ekle"</strong> butonuna dokunarak kurulumu tamamlayın.</span>
                  </p>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Android Guide */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-sm font-sans font-bold">2</span>
                  <span>Android (Chrome / Samsung) Telefonlar İçin:</span>
                </div>
                <div className="pl-6 text-xs text-slate-600 space-y-2">
                  <p className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-indigo-600 font-bold shrink-0">a.</span>
                    <span>Sağ üstteki <strong>Üç Nokta (...)</strong> menüsüne tıklayın.</span>
                  </p>
                  <p className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-indigo-600 font-bold shrink-0">b.</span>
                    <span>Menüden <strong>"Ana ekrana ekle"</strong> ya da <strong>"Uygulamayı yükle"</strong> seçeneğine dokunuş yapın.</span>
                  </p>
                  <p className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-indigo-600 font-bold shrink-0">c.</span>
                    <span>Çıkan kurulum onay kutusunda <strong>"Yükle"</strong> butonuna tıklayarak işlemi tamamlayın.</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowPwaGuide(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-indigo-600/10"
              >
                Anladım, Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deep Footer */}
      <footer className="bg-white border-t border-gray-150 py-4 px-6 text-center text-xs text-gray-400 font-medium">
        © 2026 Yağmur Yüksel Sanat Akademisi. Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
