import React, { useState } from 'react';
import { Student, Installment, CashTransaction } from '../types';
import { getTodayDateString } from '../data/mockData';
import { 
  TrendingUp, UserCheck, AlertCircle, Bookmark, DollarSign, Calendar, Clock, 
  ChevronRight, Database
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

  // Calculations
  const activeStudents = students.filter(s => s.status === 'active').length;
  const graduatedStudents = students.filter(s => s.status === 'graduated').length;

  // Total Expected Income (Anlaşılan Toplam Bedel) - capped at first 12 months/installments per student
  const totalExpectedIncome = students.reduce((sum, s) => {
    const instCount = s.installmentCount || 12;
    const activeCount = Math.min(instCount, 12);
    const monthlyFee = instCount > 0 ? (s.totalFee - s.downPayment) / instCount : s.totalFee;
    return sum + s.downPayment + (monthlyFee * activeCount);
  }, 0);

  // Total Collected (Peşinatlar + Ödenen Taksit Miktarları) - capped at first 12 installments
  const totalCollectedFromDownpayments = students.reduce((sum, s) => sum + s.downPayment, 0);
  const totalCollectedFromInstallments = installments
    .filter(inst => inst.installmentNumber <= 12)
    .reduce((sum, inst) => sum + inst.paidAmount, 0);
  const totalCollected = totalCollectedFromDownpayments + totalCollectedFromInstallments;

  // Remaining Balance (Kalan Toplam Borç)
  const remainingBalance = totalExpectedIncome - totalCollected;

  // Current Month's prefix (YYYY-MM)
  const currentMonthPrefix = CURRENT_DATE_STR.substring(0, 7);

  // Filter installments for the current month (capped at first 12 installments)
  const currentMonthInstallments = installments.filter(inst => {
    if (inst.installmentNumber > 12) return false;
    return inst.dueDate.startsWith(currentMonthPrefix);
  });

  const remainingBalanceThisMonth = currentMonthInstallments.reduce((sum, inst) => {
    return sum + Math.max(0, inst.amount - inst.paidAmount);
  }, 0);

  const totalScheduledThisMonth = currentMonthInstallments.reduce((sum, inst) => sum + inst.amount, 0);

  // Overdue Installments (Gecikmiş Ödemeler Toplamı) - capped at first 12 installments
  const overdueInstallmentsList = installments.filter(inst => {
    if (inst.installmentNumber > 12) return false;
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
    if (inst.installmentNumber > 12) return false;
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
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-tight">Bu Ayki Kalan Alacak</div>
            <div className="text-2xl font-bold font-sans text-amber-600 mt-0.5">
              {remainingBalanceThisMonth.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Bu ayki {totalScheduledThisMonth.toLocaleString('tr-TR')} ₺ taksit bütçesinden kalan
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

      {/* Progress Section */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs" id="financial-progress-bar">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Genel Tahsilat İlerleme Durumu</h4>
            <span className="text-[10px] text-slate-400 block mt-0.5">Toplam sözleşme bedeli içerisindeki tahsilat performansı</span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
            {totalCollected.toLocaleString('tr-TR')} ₺ / {totalExpectedIncome.toLocaleString('tr-TR')} ₺ (%{Math.round((totalCollected / (totalExpectedIncome || 1)) * 100)})
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex mt-3">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500" 
            style={{ width: `${(totalCollected / (totalExpectedIncome || 1)) * 100}%` }}
          />
          <div 
            className="bg-amber-400 h-full transition-all duration-500" 
            style={{ width: `${(remainingBalance / (totalExpectedIncome || 1)) * 100}%` }}
          />
        </div>
        <div className="flex gap-4 mt-2.5 text-[10px] font-medium text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Tahsil Edilen (%{Math.round((totalCollected / (totalExpectedIncome || 1)) * 100)})
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Bekleyen Planlı Alacak (%{Math.round((remainingBalance / (totalExpectedIncome || 1)) * 100)})
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
    </div>
  );
}
