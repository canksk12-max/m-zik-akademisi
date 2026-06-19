import React, { useState } from 'react';
import { Student, Installment, CashTransaction } from '../types';
import { getTodayDateString } from '../data/mockData';
import { 
  TrendingUp, UserCheck, AlertCircle, Bookmark, DollarSign, Calendar, Clock, 
  ChevronRight, Database, Plus, Trash2, X, Wallet, Tag 
} from 'lucide-react';

interface DashboardProps {
  students: Student[];
  installments: Installment[];
  transactions: CashTransaction[];
  onSelectTab: (tab: 'students' | 'installments' | 'dashboard' | 'calendar') => void;
  onPayInstallmentClick: (installmentId: string) => void;
  onAddTransaction: (tx: CashTransaction) => void;
  onDeleteTransaction: (txId: string) => void;
}

export default function Dashboard({ 
  students, 
  installments, 
  transactions, 
  onSelectTab, 
  onPayInstallmentClick,
  onAddTransaction,
  onDeleteTransaction
}: DashboardProps) {
  // Current time is updated dynamically
  const CURRENT_DATE_STR = getTodayDateString();

  // Expense management state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Kira');
  const [expenseDate, setExpenseDate] = useState(CURRENT_DATE_STR);
  const [expenseMethod, setExpenseMethod] = useState('Bank Transfer');

  // Filter and compute expenses
  const expenseTransactions = transactions.filter(t => t.type === 'outgoing');
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Filter and compute incomes
  const incomeTransactions = transactions.filter(t => t.type === 'incoming');
  const totalIncomes = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netEarnings = totalIncomes - totalExpenses;

  // Calculations
  const activeStudents = students.filter(s => s.status === 'active').length;
  const graduatedStudents = students.filter(s => s.status === 'graduated').length;

  // Total Expected Income (Anlaşılan Toplam Bedel)
  const totalExpectedIncome = students.reduce((sum, s) => sum + s.totalFee, 0);

  // Total Collected (Peşinatlar + Ödenen Taksit Miktarları)
  const totalCollectedFromDownpayments = students.reduce((sum, s) => sum + s.downPayment, 0);
  const totalCollectedFromInstallments = installments.reduce((sum, inst) => sum + inst.paidAmount, 0);
  const totalCollected = totalCollectedFromDownpayments + totalCollectedFromInstallments;

  // Remaining Balance (Kalan Toplam Borç)
  const remainingBalance = totalExpectedIncome - totalCollected;

  // Overdue Installments (Gecikmiş Ödemeler Toplamı)
  const overdueInstallmentsList = installments.filter(inst => {
    const isUnpaid = inst.paidAmount < inst.amount;
    const isPastDue = inst.dueDate < CURRENT_DATE_STR;
    return isUnpaid && isPastDue;
  });

  const totalOverdueAmount = overdueInstallmentsList.reduce((sum, inst) => sum + (inst.amount - inst.paidAmount), 0);

  // Upcoming payments in the next 3 days (June 17 to June 20)
  const THREE_DAYS_LATER_STR = (() => {
    const d = new Date(CURRENT_DATE_STR);
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  })();

  const upcomingInstallments = installments.filter(inst => {
    return inst.dueDate >= CURRENT_DATE_STR && 
           inst.dueDate <= THREE_DAYS_LATER_STR && 
           inst.paidAmount < inst.amount;
  });

  return (
    <div className="space-y-6" id="dashboard-sections">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-metrics-grid">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-tight">Kayıtlı Öğrenci</div>
            <div className="text-2xl font-bold font-sans text-gray-900 mt-0.5">{students.length} Öğrenci</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Sistemde kayıtlı toplam öğrenci</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-tight">Net Tahsilat</div>
            <div className="text-2xl font-bold font-sans text-emerald-600 mt-0.5">
              {totalCollected.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              %{Math.round((totalCollected / (totalExpectedIncome || 1)) * 100)} tahsilat oranı
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-tight">Kalan Borç Alacak</div>
            <div className="text-2xl font-bold font-sans text-amber-600 mt-0.5">
              {remainingBalance.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Toplam {totalExpectedIncome.toLocaleString('tr-TR')} ₺ kontrat
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-tight">Geciken Taksit Tutarı</div>
            <div className="text-2xl font-bold font-sans text-rose-600 mt-0.5">
              {totalOverdueAmount.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {overdueInstallmentsList.length} taksit vadesi geçti
            </div>
          </div>
        </div>
      </div>

      {/* Gelir / Gider Kar-Zarar Analiz Özet Paneli */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs" id="revenue-expenses-analysis-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-150 pb-4 mb-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-rose-600 uppercase">ANALİZ & RAPORLAMA</span>
            <h3 className="text-base font-bold text-gray-900 mt-0.5">Gelir & Gider (Kâr / Zarar) Karşılaştırması</h3>
            <p className="text-xs text-gray-500">Kasadaki fiili Nakit Girişleri ile Kurum Giderlerinin anlık karşılaştırması ve net verimlilik durumu.</p>
          </div>
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            <span className="text-xs text-gray-500 font-medium">Bütçe Sağlık Durumu:</span>
            {netEarnings > 0 ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Kâr Durumundasınız (%{Math.round((netEarnings / (totalIncomes || 1)) * 100)})
              </span>
            ) : netEarnings < 0 ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Zarar Durumundasınız
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-50 text-zinc-700 text-xs font-bold rounded-full border border-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Bütçe Dengede (Başabaş)
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="pnl-summary-grid">
          {/* Toplam Giriş (Gelir) */}
          <div className="bg-emerald-50/30 border border-emerald-100/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase">TOPLAM ALINAN / ÖDENEN GELİR</span>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">{totalIncomes.toLocaleString('tr-TR')} ₺</div>
            </div>
            <div className="text-gray-500 text-[11px] mt-2">
              Öğrenci peşinatları ve tahsil edilmiş tüm dönem taksitleri.
            </div>
          </div>

          {/* Toplam Çıkış (Gider) */}
          <div className="bg-rose-50/30 border border-rose-100/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-600 tracking-wider uppercase">TOPLAM GERÇEKLEŞEN GİDER</span>
              <div className="text-xl font-extrabold text-rose-700 mt-1">{totalExpenses.toLocaleString('tr-TR')} ₺</div>
            </div>
            <div className="text-gray-500 text-[11px] mt-2">
              Kira, faturalar, eğitmen ödemeleri ve kurum harcamaları.
            </div>
          </div>

          {/* Net Kâr / Zarar */}
          <div className={`border rounded-xl p-4 flex flex-col justify-between ${
            netEarnings > 0 
              ? 'bg-teal-50/40 border-teal-200' 
              : netEarnings < 0 
                ? 'bg-rose-50/50 border-rose-200' 
                : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500">NET KÂR / ZARAR DURUMU</span>
              <div className={`text-xl font-extrabold mt-1 font-sans ${
                netEarnings > 0 
                  ? 'text-emerald-600' 
                  : netEarnings < 0 
                    ? 'text-rose-600' 
                    : 'text-zinc-650'
              }`}>
                {netEarnings > 0 ? '+' : ''}{netEarnings.toLocaleString('tr-TR')} ₺
              </div>
            </div>
            <div className="text-[11px] mt-2 font-medium">
              {netEarnings > 0 ? (
                <span className="text-emerald-700">Gelirleriniz giderlerinizden fazla, kurum kârdadır.</span>
              ) : netEarnings < 0 ? (
                <span className="text-rose-700">Giderleriniz gelirlerinizden fazladır. Harcamaları denetleyin.</span>
              ) : (
                <span className="text-gray-500">Gelir ve gider başabaş seviyesinde, net denge sıfırdır.</span>
              )}
            </div>
          </div>
        </div>

        {/* Dağılım Oranı Barları */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-500 mb-1.5">
            <span>Dağılım Oranı (Gelir vs Gider)</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Gelir %{Math.round((totalIncomes / ((totalIncomes + totalExpenses) || 1)) * 100)}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Gider %{Math.round((totalExpenses / ((totalIncomes + totalExpenses) || 1)) * 100)}</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${(totalIncomes / ((totalIncomes + totalExpenses) || 1)) * 100}%` }}
            />
            <div 
              className="bg-rose-400 h-full transition-all duration-500" 
              style={{ width: `${(totalExpenses / ((totalIncomes + totalExpenses) || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs" id="financial-progress-bar">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-gray-800">Genel Tahsilat İlerleme Durumu</span>
          <span className="text-xs font-mono font-bold text-emerald-600">
            {totalCollected.toLocaleString('tr-TR')} ₺ / {totalExpectedIncome.toLocaleString('tr-TR')} ₺ (%{Math.round((totalCollected / (totalExpectedIncome || 1)) * 100)})
          </span>
        </div>
        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden flex">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500" 
            style={{ width: `${(totalCollected / (totalExpectedIncome || 1)) * 100}%` }}
          />
          <div 
            className="bg-amber-400 h-full transition-all duration-500" 
            style={{ width: `${(remainingBalance / (totalExpectedIncome || 1)) * 100}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tahsil Edilen (%{Math.round((totalCollected / (totalExpectedIncome || 1)) * 100)})
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Bekleyen Planlı Alacak (%{Math.round((remainingBalance / (totalExpectedIncome || 1)) * 100)})
          </div>
        </div>
      </div>

      {/* Quick Action Block & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-details">
        {/* Group 1: Overdue Payments warning list */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-500" /> Vadesi Geçmiş Gecikmeli Ödemeler
              </h3>
              <p className="text-xs text-gray-500">Eğitim takvimine göre gecikmeye giren veli/öğrenci listesi</p>
            </div>
            <button 
              onClick={() => onSelectTab('installments')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
            >
              Hepsini Gör <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {overdueInstallmentsList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50 rounded-xl text-center border border-dashed border-gray-200">
              <span className="text-emerald-500 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full mb-1">✓ Temiz Liste</span>
              <p className="text-xs text-gray-500 font-medium">Harika! Gecikmiş hiçbir taksitli ödeme bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
              {overdueInstallmentsList.slice(0, 5).map(inst => {
                const unpaid = inst.amount - inst.paidAmount;
                const overdueDays = Math.floor((new Date(CURRENT_DATE_STR).getTime() - new Date(inst.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={inst.id} className="p-3 bg-red-50/40 rounded-xl border border-red-50 hover:bg-red-50/70 transition-all flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">{inst.studentName}</div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span>{inst.installmentNumber}. Taksit</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="text-rose-600 font-medium">Vade: {inst.dueDate}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="text-gray-400 font-mono">{overdueDays} Gün Gecikti</span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <div className="text-xs font-bold text-rose-600">{unpaid.toLocaleString('tr-TR')} ₺</div>
                        {inst.paidAmount > 0 && (
                          <div className="text-[9px] text-gray-400 italic">Kısmi: {inst.paidAmount} Ödendi</div>
                        )}
                      </div>
                      <button
                        onClick={() => onPayInstallmentClick(inst.id)}
                        className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold tracking-tight hover:bg-rose-700 active:scale-95 transition-all cursor-pointer shadow-3xs"
                      >
                        Tahsil Et
                      </button>
                    </div>
                  </div>
                );
              })}
              {overdueInstallmentsList.length > 5 && (
                <p className="text-[11px] text-center text-gray-400 pt-1">+ {overdueInstallmentsList.length - 5} vadesi geçmiş taksit daha var.</p>
              )}
            </div>
          )}
        </div>

        {/* Group 2: Upcoming payments list */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-500" /> Yaklaşan Planlı Ödemeler (3 Gün)
              </h3>
              <p className="text-xs text-gray-500">Gelecek 3 gün içerisinde tahsilatı beklenen ödeme planı</p>
            </div>
            <button 
              onClick={() => onSelectTab('installments')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
            >
              Hepsini Gör <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingInstallments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50 rounded-xl text-center border border-dashed border-gray-200">
              <span className="text-gray-400 font-semibold text-xs bg-gray-100 px-2 py-0.5 rounded mb-1">Kayıt Bulunmamakta</span>
              <p className="text-xs text-gray-500 font-medium">Yaklaşan 3 gün için beklenen yeni bir vadelendirme bulunamadı.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
              {upcomingInstallments.slice(0, 5).map(inst => {
                const unpaid = inst.amount - inst.paidAmount;
                return (
                  <div key={inst.id} className="p-3 bg-amber-50/20 rounded-xl border border-amber-50 hover:bg-amber-50/40 transition-all flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">{inst.studentName}</div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span>{inst.installmentNumber}. Taksit</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="text-amber-700 font-medium">Vade: {inst.dueDate}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span>Kalan: {unpaid.toLocaleString('tr-TR')} ₺</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onPayInstallmentClick(inst.id)}
                      className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold tracking-tight hover:bg-amber-600 active:scale-95 transition-all cursor-pointer shadow-3xs"
                    >
                      Tahsil Et
                    </button>
                  </div>
                );
              })}
              {upcomingInstallments.length > 5 && (
                <p className="text-[11px] text-center text-gray-400 pt-1">+ {upcomingInstallments.length - 5} yaklaşan taksit planı var.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Aylık Kurum Giderleri Section */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex flex-col" id="institutional-expenses-section">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-extrabold tracking-wider uppercase border border-rose-100">MALİ TABLO</span>
            </div>
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5 mt-1">
              <Wallet className="w-5 h-5 text-rose-500" /> Aylık Kurum Giderleri (Haziran 2026)
            </h3>
            <p className="text-xs text-gray-500">Akademinin cari dönem içerisindeki sabit/değişken gider kalemleri ve tediye makbuzları.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-2 text-right">
              <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest leading-none">Toplam Gider</div>
              <div className="text-lg font-extrabold text-rose-605 mt-0.5 leading-none text-rose-600">{totalExpenses.toLocaleString('tr-TR')} ₺</div>
            </div>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Gider Ekle
            </button>
          </div>
        </div>

        {expenseTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-zinc-50 rounded-xl text-center border border-dashed border-gray-200">
            <span className="text-gray-400 font-semibold text-xs bg-gray-100 px-2 py-0.5 rounded mb-1">Kayıt Bulunmamakta</span>
            <p className="text-xs text-gray-500 font-medium">Bu aya ait kaydedilmiş herhangi bir resmi veya gayriresmi kurum gideri bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold bg-gray-50/50">
                  <th className="py-2.5 px-3">Tarih</th>
                  <th className="py-2.5 px-3">Açıklama / Detay</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Ödeme Kanalı</th>
                  <th className="py-2.5 px-3 text-right">Tutar</th>
                  <th className="py-2.5 px-3 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenseTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/40 transition-all">
                    <td className="py-3 px-3 font-mono text-gray-500">{tx.date}</td>
                    <td className="py-3 px-3 font-medium text-gray-800">{tx.description}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight bg-gray-100 text-gray-750 border border-gray-200">
                        <Tag className="w-2.5 h-2.5 text-gray-400" /> {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      {tx.paymentMethod === 'Bank Transfer' ? 'Banka Havalesi' : tx.paymentMethod === 'Credit Card' ? 'Kredi Kartı' : 'Nakit'}
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-600 text-right font-sans">{tx.amount.toLocaleString('tr-TR')} ₺</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Gideri Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gider Ekleme Modal Diyaloğu */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" id="expense-modal-overlay">
          <div className="bg-white rounded-2xl border border-gray-150 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-sm">Yeni Kurum Gider Kaydı</h3>
              </div>
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!expenseDescription.trim() || !expenseAmount || Number(expenseAmount) <= 0) {
                alert("Lütfen tüm alanları geçerli değerlerle doldurunuz.");
                return;
              }
              const newTx: CashTransaction = {
                id: `tx-exp-${Date.now()}`,
                amount: Number(expenseAmount),
                type: 'outgoing' as const,
                category: expenseCategory,
                date: expenseDate,
                paymentMethod: expenseMethod,
                description: expenseDescription
              };
              onAddTransaction(newTx);
              setIsExpenseModalOpen(false);
              // reset form
              setExpenseDescription('');
              setExpenseAmount('');
              setExpenseCategory('Kira');
              setExpenseDate(CURRENT_DATE_STR);
              setExpenseMethod('Bank Transfer');
            }} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Gider Açıklaması *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Haziran Elektrik Faturası Ödemesi"
                  value={expenseDescription}
                  onChange={e => setExpenseDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 rounded-lg focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Tutar (₺) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Örn: 2400"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 rounded-lg focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Gider Kategorisi</label>
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 rounded-lg focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="Kira">Kira</option>
                    <option value="Fatura">Fatura</option>
                    <option value="Eğitmen Maaşı">Eğitmen Maaşı</option>
                    <option value="Ofis Malzemeleri">Ofis Malzemeleri</option>
                    <option value="Yazılım / Aidat">Yazılım / Aidat</option>
                    <option value="Vergi / Harç">Vergi / Harç</option>
                    <option value="Diğer Giderler">Diğer Giderler</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Ödeme Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 rounded-lg focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Ödeme Kanalı</label>
                  <select
                    value={expenseMethod}
                    onChange={e => setExpenseMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 rounded-lg focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="Bank Transfer">Banka Havalesi</option>
                    <option value="Cash">Nakit</option>
                    <option value="Credit Card">Kredi Kartı</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg font-bold transition-all cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-all shadow-3xs cursor-pointer"
                >
                  Gideri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
