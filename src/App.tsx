import React, { useState, useEffect } from 'react';
import { Student, Installment, CashTransaction, Lesson, Teacher } from './types';
import { getStoredData, saveStoredData, recalculateInstallmentStatus } from './data/mockData';
import { loadFirestoreData, syncStateWithFirestore, AppDatabaseState } from './data/firebaseService';
import Dashboard from './components/Dashboard';
import StudentManager from './components/StudentManager';
import InstallmentsManager from './components/InstallmentsManager';
import CalendarManager from './components/CalendarManager';
import TeacherManager from './components/TeacherManager';
import { GraduationCap, LayoutDashboard, CreditCard, ChevronDown, CheckSquare, Sparkles, Building2, Landmark, PhoneCall, Calendar, Users, RefreshCw } from 'lucide-react';

export default function App() {
  // Database State
  const [students, setStudents] = useState<Student[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active UI Navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'installments' | 'calendar' | 'teachers'>('dashboard');

  // Load and initialize from Firestore (falls back to localStorage or seeded mock data)
  useEffect(() => {
    async function initDatabase() {
      try {
        console.log("Fetching live data from Firestore...");
        const data = await loadFirestoreData();
        const alignedInstallments = recalculateInstallmentStatus(data.installments, "2026-06-17");

        setStudents(data.students);
        setInstallments(alignedInstallments);
        setTransactions(data.transactions);
        setLessons(data.lessons);
        setTeachers(data.teachers);

        // Pre-cache to localStorage as well for instant-responsiveness
        saveStoredData(data.students, alignedInstallments, data.transactions, data.lessons, data.teachers);
      } catch (err) {
        console.warn("Could not load from Firestore, using offline storage fallback:", err);
        const data = getStoredData();
        const alignedInstallments = recalculateInstallmentStatus(data.installments, "2026-06-17");

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
  }, []);

  // Sync to database layer
  const syncAndSave = (
    nextStudents: Student[], 
    nextInstallments: Installment[], 
    nextTransactions: CashTransaction[],
    nextLessons: Lesson[] = lessons,
    nextTeachers: Teacher[] = teachers
  ) => {
    const aligned = recalculateInstallmentStatus(nextInstallments, "2026-06-17");
    
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

    // Sync incrementally with Firestore in the background
    syncStateWithFirestore(oldState, newState);
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans" id="db-loader-screen">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-750 rounded-2xl shadow-lg ring-1 ring-white/10 animate-pulse">
            <GraduationCap className="w-10 h-10 text-white shrink-0" />
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-bold tracking-tight">Yağmur Yüksel Sanat Akademisi</h2>
            <p className="text-[11px] text-slate-400">Bulut veritabanı (Firebase cloud) senkronizasyonu gerçekleştiriliyor...</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 text-indigo-400 font-bold text-[10px] rounded-full border border-slate-700 mt-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Veriler Yükleniyor
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="app-container">
      {/* Upper Navigation Brand Header */}
      <header className="bg-slate-900 text-white border-b border-slate-950 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-xl shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight font-sans">Yağmur Yüksel Sanat Akademisi</h1>
            <p className="text-[11px] text-slate-400 font-medium">Öğrenci Kayıt ve Ödeme Planı Otomasyonu</p>
          </div>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <Landmark className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Aktif Kasa:</span>
            <span className="text-emerald-400 font-bold font-mono">
              {netKasaBalance.toLocaleString('tr-TR')} ₺
            </span>
          </div>

          <div className="text-slate-405 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-300">Çalışma Tarihi: 17 Haziran 2026</span>
          </div>
        </div>
      </header>

      {/* Main Framework Layout Grid */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side Navigation Sidebar */}
        <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-150 p-4 shrink-0 space-y-2">
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase px-3 py-2">Ana Modüller</p>
          
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700 shadow-3xs'
                  : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Özet Paneli (Kasa)
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-indigo-50 text-indigo-700 shadow-3xs'
                  : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Öğrenci Kayıt & Taksit
            </button>

            <button
              onClick={() => setActiveTab('installments')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'installments'
                  ? 'bg-indigo-50 text-indigo-700 shadow-3xs'
                  : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <CheckSquare className="w-4 h-4" /> Cari Taksit & Ödeme Takibi
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-indigo-50 text-indigo-700 shadow-3xs'
                  : 'text-gray-655 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-600" /> Haftalık Ders Takvimi
            </button>

            <button
              onClick={() => setActiveTab('teachers')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'teachers'
                  ? 'bg-indigo-50 text-indigo-700 shadow-3xs'
                  : 'text-gray-655 hover:bg-gray-50 hover:text-gray-900'
              }`}
              id="sidebar-nav-teachers"
            >
              <Users className="w-4 h-4 text-amber-500" /> Eğitmen Kadrosu
            </button>
          </nav>



          <div className="pt-8 hidden lg:block text-center text-[10px] text-gray-400 font-medium">
            <p>Yağmur Yüksel Sanat Akademisi v1.4.0</p>
            <p className="mt-0.5">Yönetici Paneli</p>
          </div>
        </aside>

        {/* Dynamic Inner Router Workspace */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
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

      {/* Deep Footer */}
      <footer className="bg-white border-t border-gray-150 py-4 px-6 text-center text-xs text-gray-400 font-medium">
        © 2026 Yağmur Yüksel Sanat Akademisi. Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
