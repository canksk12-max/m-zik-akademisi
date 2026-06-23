import React, { useState } from 'react';
import { Installment, Student, CashTransaction } from '../types';
import { getTodayDateString } from '../data/mockData';
import { Search, DollarSign, Calendar, CheckCircle, Smartphone, AlertCircle, Printer, X, CreditCard, Wallet, Landmark, RefreshCw, Send, Edit2, Save, Plus } from 'lucide-react';

export function formatInstallmentPeriod(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  if (monthNum >= 1 && monthNum <= 12) {
    return `${monthNames[monthNum - 1]} ${year}`;
  }
  return dateStr;
}

interface InstallmentsManagerProps {
  installments: Installment[];
  students: Student[];
  onPayInstallment: (installmentId: string, paidAmount: number, paymentMethod: string, date: string) => void;
  onResetInstallment: (installmentId: string) => void;
  onUpdateInstallment?: (updated: Installment) => void;
  onAddInstallment?: (newInst: Installment) => void;
}

export default function InstallmentsManager({ installments, students, onPayInstallment, onResetInstallment, onUpdateInstallment, onAddInstallment }: InstallmentsManagerProps) {
  const CURRENT_DATE_STR = getTodayDateString();

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Payment dialog target
  const [payingInstallment, setPayingInstallment] = useState<Installment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateString());

  // Editing installment state
  const [editingInst, setEditingInst] = useState<Installment | null>(null);
  const [editingAmount, setEditingAmount] = useState<number>(0);
  const [editingDueDate, setEditingDueDate] = useState<string>('');

  const handleStartEdit = (inst: Installment) => {
    setEditingInst(inst);
    setEditingAmount(inst.amount);
    setEditingDueDate(inst.dueDate);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInst || !onUpdateInstallment) return;

    if (editingAmount <= 0) {
      alert("Taksit tutarı sıfırdan büyük olmalıdır.");
      return;
    }

    const updated: Installment = {
      ...editingInst,
      amount: editingAmount,
      dueDate: editingDueDate,
      status: editingInst.paidAmount >= editingAmount ? 'paid' : 'pending',
      isCustom: true
    };

    onUpdateInstallment(updated);
    setEditingInst(null);
  };

  // Add manual installment state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addStudentId, setAddStudentId] = useState('');
  const [addAmount, setAddAmount] = useState<number>(0);
  const [addDueDate, setAddDueDate] = useState('2026-07-17');

  const handleOpenAdd = () => {
    setIsAddOpen(true);
    if (students.length > 0) {
      const firstStudent = students[0];
      setAddStudentId(firstStudent.id);
      
      const instCount = firstStudent.installmentCount || 12;
      const suggestedAmount = Math.round((firstStudent.totalFee - firstStudent.downPayment) / instCount);
      setAddAmount(suggestedAmount > 0 ? suggestedAmount : 5000);
    } else {
      setAddStudentId('');
      setAddAmount(5000);
    }
    setAddDueDate('2026-07-17');
  };

  const handleStudentChange = (studentId: string) => {
    setAddStudentId(studentId);
    const selected = students.find(s => s.id === studentId);
    if (selected) {
      const instCount = selected.installmentCount || 12;
      const suggestedAmount = Math.round((selected.totalFee - selected.downPayment) / instCount);
      setAddAmount(suggestedAmount > 0 ? suggestedAmount : 5000);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStudentId || !onAddInstallment) return;

    const targetStudent = students.find(s => s.id === addStudentId);
    if (!targetStudent) return;

    if (addAmount <= 0) {
      alert("Taksit tutarı sıfırdan büyük olmalıdır.");
      return;
    }

    const studentInsts = installments.filter(inst => inst.studentId === addStudentId);
    const maxNum = studentInsts.reduce((max, inst) => inst.installmentNumber > max ? inst.installmentNumber : max, 0);

    const newInst: Installment = {
      id: `inst-manual-${addStudentId}-${Date.now()}`,
      studentId: addStudentId,
      studentName: targetStudent.name,
      installmentNumber: maxNum + 1,
      dueDate: addDueDate,
      amount: addAmount,
      paidAmount: 0,
      status: 'pending',
      isCustom: true
    };

    onAddInstallment(newInst);
    setIsAddOpen(false);
  };

  // Receipt & Reminder Dialog target
  const [selectedReceiptInstallment, setSelectedReceiptInstallment] = useState<Installment | null>(null);
  const [selectedReminderInstallment, setSelectedReminderInstallment] = useState<Installment | null>(null);
  const [resetConfirmId, setResetConfirmId] = useState<string | null>(null);

  // Filter logic
  const filteredInstallments = installments.filter(inst => {
    // Only show first 12 installments (1 year / 12 months)
    if (inst.installmentNumber > 12) return false;

    const student = students.find(s => s.id === inst.studentId);
    const parentName = student?.parentName || '';
    const matchesSearch = inst.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          parentName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status calculations relative to simulated date
    const remainingAmt = inst.amount - inst.paidAmount;
    const isOverdue = inst.dueDate < CURRENT_DATE_STR && remainingAmt > 0;
    
    let isMatch = true;
    if (statusFilter === 'paid') {
      isMatch = inst.status === 'paid' || remainingAmt === 0;
    } else if (statusFilter === 'pending') {
      isMatch = inst.dueDate >= CURRENT_DATE_STR && remainingAmt > 0;
    } else if (statusFilter === 'overdue') {
      isMatch = isOverdue;
    }

    return matchesSearch && isMatch;
  });

  // Sort installments chronologically by dueDate so that June 2026 is followed by July 2026
  const sortedFilteredInstallments = [...filteredInstallments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const handleOpenPayDialog = (inst: Installment) => {
    setPayingInstallment(inst);
    // Suggest the remaining balance as payment amount
    setPaymentAmount(inst.amount - inst.paidAmount);
    setPaymentMethod('Bank Transfer');
    setPaymentDate(getTodayDateString());
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInstallment) return;

    if (paymentAmount <= 0) {
      alert("Lütfen geçerli bir ödeme miktarı giriniz.");
      return;
    }

    const remaining = payingInstallment.amount - payingInstallment.paidAmount;
    const finalAmount = paymentAmount > remaining ? remaining : paymentAmount;

    onPayInstallment(payingInstallment.id, finalAmount, paymentMethod, paymentDate);
    setPayingInstallment(null);
  };

  // Generate friendly SMS / WhatsApp reminder template
  const getReminderMessage = (inst: Installment) => {
    const student = students.find(s => s.id === inst.studentId);
    const parent = student?.parentName ? `Sayın ${student.parentName}, ` : `Sayın Velimiz, `;
    const remaining = inst.amount - inst.paidAmount;
    const isOverdue = inst.dueDate < CURRENT_DATE_STR;
    
    if (isOverdue) {
      return `${parent}Yağmur Yüksel Sanat Akademisi öğrencimiz ${inst.studentName}'in ${inst.dueDate} vadeli ${inst.installmentNumber}. taksit ödemesi (${remaining.toLocaleString('tr-TR')} ₺) gecikmededir. Gecikme faizi uygulanmadan ödemenizi banka havalesi veya kredi kartı ile yapmanızı rica ederiz. İyi günler dileriz.`;
    } else {
      return `${parent}Yağmur Yüksel Sanat Akademisi öğrencimiz ${inst.studentName}'in önümüzdeki ${inst.dueDate} vadeli ${inst.installmentNumber}. taksit ödemesi tutarı ${remaining.toLocaleString('tr-TR')} ₺'dir. Belirtilen tarihe kadar ödemenizi gerçekleştirebilirsiniz. Teşekkürler, iyi çalışmalar.`;
    }
  };

  return (
    <div className="space-y-6" id="installments-manager">
      
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-3xs flex flex-col md:flex-row gap-3 items-center justify-between" id="installments-filters-row">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Öğrenci adı veya veli adına göre ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-3xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-3xs"
          >
            <option value="">Tüm Taksit Durumları</option>
            <option value="paid">Tamamen Ödenenler</option>
            <option value="pending">Vadesi Bekleyenler (Açık Borç)</option>
            <option value="overdue">Vadesi Geçen Gecikmiş Olanlar</option>
          </select>
          
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" /> Yeni Taksit Tanımla
          </button>
        </div>
      </div>

      {/* Main Installments Spreadsheet table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs overflow-hidden" id="installments-grid-panel">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">TAKSİT & TAHSİLAT HAREKETLERİ</span>
          <span className="text-xs font-mono text-gray-400">Toplam {filteredInstallments.length} Taksit Satırı Bulundu</span>
        </div>

        {sortedFilteredInstallments.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Calendar className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-sm font-bold text-gray-600">Eşleşen Taksit Bulunamadı</p>
            <p className="text-xs text-gray-400 mt-1">Girdiğiniz arama terimini veya durum filtresini değiştirmeyi deneyebilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">Öğrenci Adı</th>
                  <th className="p-4 text-center">Taksit No</th>
                  <th className="p-4">Taksit Dönemi</th>
                  <th className="p-4 text-right">Taksit Tutarı</th>
                  <th className="p-4 text-right">Ödenen Miktar</th>
                  <th className="p-4 text-right">Kalan Kısım</th>
                  <th className="p-4 text-center">Durum</th>
                  <th className="p-4 text-center">Seçenekler & Tahsilat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {sortedFilteredInstallments.map(inst => {
                  const student = students.find(s => s.id === inst.studentId);
                  const remaining = inst.amount - inst.paidAmount;
                  const isOverdue = inst.dueDate < CURRENT_DATE_STR && remaining > 0;

                  return (
                    <tr key={inst.id} className={`hover:bg-slate-50/40 transition-all ${isOverdue ? 'bg-red-50/10' : ''}`}>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{inst.studentName}</div>
                        {student && (
                          <div className="text-[10px] text-gray-400">{student.course}</div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex justify-center items-center w-6 h-6 rounded-full bg-slate-100 font-bold font-mono text-[10px] text-gray-600">
                          #{inst.installmentNumber}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                          {formatInstallmentPeriod(inst.dueDate)}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          Vade: {inst.dueDate.split('-').reverse().join('.')}
                        </div>
                        {isOverdue && (
                          <span className="block text-[8px] bg-rose-50 text-rose-600 border border-rose-100 px-1 py-0.2 rounded w-max mt-0.5 font-bold">
                            Gecikmede
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-bold text-gray-800">
                        {inst.amount.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="p-4 text-right text-emerald-600 font-medium">
                        {inst.paidAmount.toLocaleString('tr-TR')} ₺
                        {inst.paymentDate && (
                          <div className="text-[9px] text-gray-400 font-mono italic">Tar: {inst.paymentDate}</div>
                        )}
                      </td>
                      <td className="p-4 text-right font-bold">
                        <span className={remaining > 0 ? 'text-amber-600' : 'text-emerald-500'}>
                          {remaining.toLocaleString('tr-TR')} ₺
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          remaining === 0 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : isOverdue 
                            ? 'bg-rose-50 text-rose-700 border border-rose-150 animate-pulse'
                            : 'bg-zinc-50 text-zinc-650'
                        }`}>
                          {remaining === 0 ? 'Ödendi' : isOverdue ? 'Gecikti' : 'Bekliyor'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          {remaining > 0 ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenPayDialog(inst)}
                                className="px-2 py-1 bg-emerald-650 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-[10px] font-bold tracking-tight transition-all cursor-pointer shadow-3xs"
                              >
                                Ödeme Al
                              </button>
                              <button
                                onClick={() => handleStartEdit(inst)}
                                className="p-1 hover:bg-amber-50 text-gray-400 hover:text-amber-600 rounded-lg transition-all cursor-pointer"
                                title="Tutar veya Vade Günü Değiştir/Düzenle"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-block">
                              {resetConfirmId === inst.id ? (
                                <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[9px] font-bold text-amber-800 animate-pulse">
                                  <span>Sıfırlansın mı?</span>
                                  <button
                                    onClick={() => {
                                      onResetInstallment(inst.id);
                                      setResetConfirmId(null);
                                    }}
                                    className="px-1.5 py-0.2 bg-amber-600 hover:bg-amber-700 text-white rounded text-[9px] font-bold cursor-pointer transition-all"
                                  >
                                    Evet
                                  </button>
                                  <button
                                    onClick={() => setResetConfirmId(null)}
                                    className="px-1.5 py-0.2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[9px] font-bold cursor-pointer transition-all"
                                  >
                                    İptal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setResetConfirmId(inst.id)}
                                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                  title="Sıfırla"
                                >
                                  Sıfırla
                                </button>
                              )}
                            </div>
                          )}

                          {/* Print Receipt Button */}
                          <button
                            onClick={() => setSelectedReceiptInstallment(inst)}
                            className="p-1 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-all cursor-pointer"
                            title="Ödeme Makbuzu Yazdır"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Friendly Reminder Button */}
                          <button
                            onClick={() => setSelectedReminderInstallment(inst)}
                            className="p-1 hover:bg-cyan-50 text-gray-400 hover:text-cyan-600 rounded-lg transition-all cursor-pointer"
                            title="Ödeme Hatırlatması Kodu"
                          >
                            <Smartphone className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Entry Modal Dialog */}
      {payingInstallment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                  <DollarSign className="w-5 h-5 text-emerald-600 animate-bounce" /> Ödeme Alma Tahsilat Fişi
                </h3>
                <p className="text-xs text-gray-500">
                  Öğrenci: <strong>{payingInstallment.studentName}</strong> (#{payingInstallment.installmentNumber}. Taksit)
                </p>
              </div>
              <button onClick={() => setPayingInstallment(null)} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-gray-600">
                  <div>
                    <span className="block text-gray-400">Taksit Tutarı:</span>
                    <strong className="text-sm font-bold text-gray-900">{payingInstallment.amount.toLocaleString('tr-TR')} ₺</strong>
                  </div>
                  <div>
                    <span className="block text-gray-400">Daha Önce Ödenen:</span>
                    <strong className="text-sm font-bold text-emerald-600">{payingInstallment.paidAmount.toLocaleString('tr-TR')} ₺</strong>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600">Alınacak Ödeme Tutarı (₺) *</label>
                  <input
                    type="number"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    max={payingInstallment.amount - payingInstallment.paidAmount}
                    className="w-full mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-emerald-600 font-bold text-base transition-all"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Maksimum yatırılabilecek kalan: <strong>{(payingInstallment.amount - payingInstallment.paidAmount).toLocaleString('tr-TR')} ₺</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600">Ödeme Yöntemi</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Bank Transfer">Banka Havalesi / EFT</option>
                      <option value="Credit Card">Kredi Kartı</option>
                      <option value="Cash">Nakit</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600">Ödeme Alınma Tarihi</label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg font-mono text-gray-800"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingInstallment(null)}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-600 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-3xs cursor-pointer"
                >
                  Tahsilatı Onayla ve Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal Dialog */}
      {selectedReceiptInstallment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-gray-100 bg-slate-50 flex justify-between items-center bg-radial from-slate-50 to-indigo-50/10">
              <div className="text-left">
                <h3 className="text-sm font-bold text-gray-900 tracking-tight">RESMİ YAĞMUR YÜKSEL SANAT AKADEMİSİ MAKBUZU</h3>
                <p className="text-[10px] font-mono text-gray-400 mt-0.5">MAK-NO: {selectedReceiptInstallment.id.substring(5, 12).toUpperCase()}</p>
              </div>
              <button onClick={() => setSelectedReceiptInstallment(null)} className="p-1 hover:bg-gray-100 text-gray-400 rounded cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Printed invoice */}
            <div className="p-6 space-y-4 text-xs text-gray-700 font-sans leading-relaxed">
              <div className="border-b border-dashed border-gray-200 pb-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Kurum:</span> <span className="font-bold text-indigo-900">Yağmur Yüksel Sanat Akademisi A.Ş.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tarih:</span> <span className="font-mono">{selectedReceiptInstallment.paymentDate || CURRENT_DATE_STR}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ödeme Kanalı:</span> <span>{selectedReceiptInstallment.paymentMethod || 'EFT / Bank Transfer'}</span>
                </div>
              </div>

              <div className="space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100/60 font-medium">
                <div className="flex justify-between text-gray-900">
                  <span>Öğrenci:</span> <strong className="font-bold">{selectedReceiptInstallment.studentName}</strong>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Açıklama:</span> <span>Taksit #{selectedReceiptInstallment.installmentNumber} Ödemesi</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-sm border-t border-gray-105">
                <span className="font-bold text-slate-800">Tahsil Edilen Tutar:</span>
                <strong className="text-base font-bold text-emerald-600">
                  {selectedReceiptInstallment.paidAmount > 0 
                    ? selectedReceiptInstallment.paidAmount.toLocaleString('tr-TR') 
                    : selectedReceiptInstallment.amount.toLocaleString('tr-TR')} ₺
                </strong>
              </div>

              <div className="text-[10px] text-center text-gray-400 italic pt-2 border-t border-dashed border-gray-200/80">
                Bu belge Yağmur Yüksel Sanat Akademisi tahsilat otomasyonu aracılığıyla oluşturulmuştur. Elektronik olarak onaylanmıştır.
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Yazdır / PDF İndir
              </button>
              <button
                onClick={() => setSelectedReceiptInstallment(null)}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-600 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp / SMS Reminder Copy Dialog */}
      {selectedReminderInstallment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-1">
                  <Smartphone className="w-4 h-4 text-cyan-600 animate-pulse" /> Veli Bilgilendirme / SMS Taslak Örneği
                </h3>
                <p className="text-xs text-gray-500">Öğrenci: {selectedReminderInstallment.studentName}</p>
              </div>
              <button onClick={() => setSelectedReminderInstallment(null)} className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-600">
                Veliyi hızlıca bilgilendirmek için aşağıdaki hazır otomatik metni doğrudan kopyalayabilir, SMS veya WhatsApp üzerinden paylaşabilirsiniz.
              </p>

              <div className="p-4 bg-zinc-900 text-zinc-200 rounded-xl font-mono text-xs select-all whitespace-pre-wrap leading-relaxed shadow-inner">
                {getReminderMessage(selectedReminderInstallment)}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getReminderMessage(selectedReminderInstallment));
                  alert("Hatırlatma mesajı panoya başarıyla kopyalandı!");
                  setSelectedReminderInstallment(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-3xs"
              >
                <Send className="w-3.5 h-3.5" /> Taslağı Kopyala
              </button>
              <button
                onClick={() => setSelectedReminderInstallment(null)}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Installment Modal Dialog */}
      {editingInst && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4 text-indigo-600 animate-pulse" /> Taksit Bilgilerini Güncelle
                </h3>
                <p className="text-xs text-gray-500">
                  Öğrenci: <strong>{editingInst.studentName}</strong> (#{editingInst.installmentNumber}. Taksit)
                </p>
              </div>
              <button onClick={() => setEditingInst(null)} className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600">Aylık Taksit Tutarı (₺) *</label>
                  <input
                    type="number"
                    required
                    value={editingAmount}
                    onChange={(e) => setEditingAmount(Number(e.target.value))}
                    className="w-full mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-gray-800 font-bold transition-all"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Yapmış olduğunuz değişiklik tüm kasa hesaplamalarında ve raporlarda anında yansıtılır.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600">Son Ödeme Tarihi (Vade) *</label>
                  <input
                    type="date"
                    required
                    value={editingDueDate}
                    onChange={(e) => setEditingDueDate(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-gray-800 font-mono transition-all"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingInst(null)}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-600 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Add Installment Modal Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" /> Yeni Taksit Tanımla
                </h3>
                <p className="text-xs text-gray-500">
                  Öğrenciye ait bir sonraki taksit kaydını manuel oluşturun.
                </p>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600">Öğrenci Seçin *</label>
                  <select
                    required
                    value={addStudentId}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-gray-800 font-medium transition-all"
                  >
                    <option value="" disabled>Öğrenci seçiniz...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.course})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600">Taksit Tutarı (₺) *</label>
                  <input
                    type="number"
                    required
                    value={addAmount}
                    onChange={(e) => setAddAmount(Number(e.target.value))}
                    className="w-full mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-gray-800 font-bold transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600">Son Ödeme Tarihi (Vade Tarihi) *</label>
                  <input
                    type="date"
                    required
                    value={addDueDate}
                    onChange={(e) => setAddDueDate(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-gray-800 font-mono transition-all"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-600 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Taksiti Tanımla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
