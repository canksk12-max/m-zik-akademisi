import React, { useState, useEffect } from 'react';
import { Student, Installment, Teacher } from '../types';
import { getTodayDateString } from '../data/mockData';
import { Plus, Search, Edit2, Trash2, GraduationCap, DollarSign, Calendar, ListFilter, AlertCircle, Sparkles, UserPlus, Save, X, Phone, Mail, User } from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  installments: Installment[];
  teachers: Teacher[];
  onAddStudent: (newStudent: Student, generatedInstallments: Installment[]) => void;
  onUpdateStudent: (updatedStudent: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

export default function StudentManager({ students, installments, teachers = [], onAddStudent, onUpdateStudent, onDeleteStudent }: StudentManagerProps) {
  // States for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // New Student input states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [course, setCourse] = useState('Piyano');
  const [registrationDate, setRegistrationDate] = useState(getTodayDateString());
  const [monthlyFee, setMonthlyFee] = useState<number>(5000);
  const [installmentCount, setInstallmentCount] = useState<number>(36);
  const [downPayment, setDownPayment] = useState<number>(2000);
  const [totalFee, setTotalFee] = useState<number>(32000);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'graduated' | 'frozen'>('active');
  const [teacherId, setTeacherId] = useState('');

  // Sync totalFee automatically in real-time
  useEffect(() => {
    setTotalFee((monthlyFee * installmentCount) + downPayment);
  }, [monthlyFee, installmentCount, downPayment]);

  // Preview generated installments
  const previewInstallments = () => {
    if (monthlyFee <= 0 || installmentCount <= 0) return [];
    
    const list = [];
    
    // Parse start date from registrationDate
    const regDate = new Date(registrationDate);
    
    for (let i = 1; i <= installmentCount; i++) {
      // Calculate due date (monthly increments)
      const dueDate = new Date(regDate);
      dueDate.setMonth(regDate.getMonth() + i);
      
      const yr = dueDate.getFullYear();
      const mo = String(dueDate.getMonth() + 1).padStart(2, '0');
      const dy = String(dueDate.getDate()).padStart(2, '0');
      const dateStr = `${yr}-${mo}-${dy}`;

      list.push({
        number: i,
        dueDate: dateStr,
        amount: monthlyFee
      });
    }
    return list;
  };

  const handleOpenAddForm = () => {
    setEditingStudent(null);
    setName('');
    setPhone('');
    setEmail('');
    setParentName('');
    setParentPhone('');
    setCourse('Piyano');
    setRegistrationDate(getTodayDateString());
    setMonthlyFee(5000);
    setInstallmentCount(36);
    setDownPayment(2000);
    setNotes('');
    setStatus('active');
    setTeacherId('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setPhone(student.phone);
    setEmail(student.email);
    setParentName(student.parentName || '');
    setParentPhone(student.parentPhone || '');
    setCourse(student.course);
    setRegistrationDate(student.registrationDate);
    const insts = student.installmentCount || 1;
    setMonthlyFee(insts > 0 ? Math.round((student.totalFee - student.downPayment) / insts) : student.totalFee);
    setInstallmentCount(insts);
    setDownPayment(student.downPayment);
    setNotes(student.notes || '');
    setStatus(student.status);
    setTeacherId(student.teacherId || '');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Lütfen öğrenci adı ve telefon numarasını giriniz.");
      return;
    }

    if (totalFee < downPayment) {
      alert("Peşinat toplam tutardan büyük olamaz.");
      return;
    }

    const assignedTeacher = teachers.find(t => t.id === teacherId);
    const teacherName = assignedTeacher ? assignedTeacher.name : undefined;

    if (editingStudent) {
      // Edit student fields
      const updated: Student = {
        ...editingStudent,
        name,
        phone,
        email,
        parentName,
        parentPhone,
        course,
        registrationDate,
        totalFee,
        downPayment,
        installmentCount: installmentCount,
        notes,
        status,
        teacherId: teacherId || undefined,
        teacherName: teacherName
      };
      onUpdateStudent(updated);
    } else {
      // Create student
      const newStudentId = "std-" + Date.now();
      const newStudent: Student = {
        id: newStudentId,
        name,
        phone,
        email,
        parentName,
        parentPhone,
        course,
        registrationDate,
        totalFee,
        downPayment,
        installmentCount: installmentCount,
        notes,
        status,
        teacherId: teacherId || undefined,
        teacherName: teacherName
      };

      // Auto generate official database installments
      const generated: Installment[] = [];
      const remaining = totalFee - downPayment;
      if (remaining > 0 && installmentCount > 0) {
        const regDate = new Date(registrationDate);

        for (let i = 1; i <= installmentCount; i++) {
          const dueDate = new Date(regDate);
          dueDate.setMonth(regDate.getMonth() + i);
          
          const yr = dueDate.getFullYear();
          const mo = String(dueDate.getMonth() + 1).padStart(2, '0');
          const dy = String(dueDate.getDate()).padStart(2, '0');
          const dateStr = `${yr}-${mo}-${dy}`;

          generated.push({
            id: `inst-${newStudentId}-${i}-${Date.now()}`,
            studentId: newStudentId,
            studentName: name,
            installmentNumber: i,
            dueDate: dateStr,
            amount: monthlyFee,
            paidAmount: 0,
            status: "pending"
          });
        }
      }

      onAddStudent(newStudent, generated);
    }
    setIsFormOpen(false);
  };

  // Filter students based on state
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.phone.includes(searchTerm) ||
                          (student.parentName && student.parentName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCourse = courseFilter === '' || student.course === courseFilter;
    const matchesStatus = statusFilter === '' || student.status === statusFilter;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const uniqueCourses = Array.from(new Set(students.map(s => s.course)));

  return (
    <div className="space-y-6" id="student-manager-section">
      
      {/* Search & Filters Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-3xs flex flex-col md:flex-row gap-3 items-center justify-between" id="student-filters-row">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Öğrenci veya veli adı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-sans text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-3xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Course filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-3xs"
          >
            <option value="">Tüm Kurslar</option>
            {uniqueCourses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-3xs"
          >
            <option value="">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="graduated">Mezun</option>
            <option value="frozen">Dondurulmuş</option>
          </select>

          {/* Add Student Button */}
          <button
            onClick={handleOpenAddForm}
            className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold tracking-tight hover:bg-indigo-700 hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Yeni Öğrenci Kaydet
          </button>
        </div>
      </div>

      {/* Main Student List Table / Responsive grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs overflow-hidden" id="students-table-container">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ÖĞRENCİ SİCİL REHBERİ</span>
          <span className="text-xs font-mono font-medium text-gray-400">Toplam {filteredStudents.length} Kayıt Gösteriliyor</span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <GraduationCap className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-sm font-bold text-gray-600">Arama Kriterlerine Uygun Öğrenci Bulunamadı</p>
            <p className="text-xs text-gray-400 mt-1">Girdiğiniz filtreleri temizleyebilir veya yeni bir öğrenci kaydı oluşturabilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">Öğrenci Bilgisi</th>
                  <th className="p-4">İletişim / Veli</th>
                  <th className="p-4">Grup / Kurs</th>
                  <th className="p-4">Kayıt Tarihi</th>
                  <th className="p-4 text-right">Aylık Taksit & Peşinat</th>
                  <th className="p-4 text-right">Kayıttan Beri Ödenen</th>
                  <th className="p-4 text-center">Durum</th>
                  <th className="p-4 text-center">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredStudents.map(student => {
                  // Calculate dynamic collected and remaining for this student
                  const studentInstallments = installments.filter(i => i.studentId === student.id);
                  const totalPaidInstallments = studentInstallments.reduce((sum, inst) => sum + inst.paidAmount, 0);
                  const totalPaid = student.downPayment + totalPaidInstallments;
                  const remaining = student.totalFee - totalPaid;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/40 transition-all">
                      <td className="p-4 font-bold text-gray-900">
                        <div>{student.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{student.id}</div>
                      </td>
                      <td className="p-4 text-gray-600">
                        <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" /> {student.phone}</div>
                        {student.parentName && (
                          <div className="text-[11px] text-gray-500 mt-0.5 font-medium">Veli: {student.parentName} ({student.parentPhone})</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {student.course}
                        </span>
                        {student.teacherName && (
                          <div className="text-[10px] text-gray-500 mt-1 font-medium flex items-center gap-0.5">
                            <span className="text-indigo-600 font-semibold">Öğrt:</span> {student.teacherName}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-gray-500 font-medium">
                        {student.registrationDate}
                      </td>
                      <td className="p-4 text-right font-medium">
                        <div className="text-indigo-700 font-extrabold">{Math.round((student.totalFee - student.downPayment) / (student.installmentCount || 12)).toLocaleString('tr-TR')} ₺ / Ay</div>
                        <div className="text-[10px] text-gray-400">Peşinat: {student.downPayment.toLocaleString('tr-TR')} ₺</div>
                      </td>
                      <td className="p-4 text-right font-medium">
                        <span className="text-emerald-700 font-bold">
                          {totalPaid.toLocaleString('tr-TR')} ₺
                        </span>
                        <div className="text-[10px] text-gray-400">Ödenen Toplam</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          student.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : student.status === 'graduated'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-zinc-100 text-zinc-650'
                        }`}>
                          {student.status === 'active' ? 'Aktif' : student.status === 'graduated' ? 'Mezun' : 'Donduruldu'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center min-h-[38px]">
                          {deleteConfirmId === student.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-150 animate-pulse text-[10px] font-bold text-rose-700">
                              <span>Silinsin mi?</span>
                              <button
                                onClick={() => {
                                  onDeleteStudent(student.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer transition-all"
                              >
                                Evet
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[10px] font-bold cursor-pointer transition-all"
                              >
                                İptal
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditForm(student)}
                                className="p-1 px-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 rounded-lg text-[11px] font-medium border border-gray-100 transition-all cursor-pointer flex items-center gap-0.5"
                              >
                                <Edit2 className="w-3 h-3" /> Düzenle
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(student.id)}
                                className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Öğrenciyi Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
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

      {/* Add/Edit Modal (Light overlay style, pristine styling) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="student-modal-overlay">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-2xl overflow-hidden animate-scale-up" id="student-form-modal">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                  <GraduationCap className="w-5 h-5 text-indigo-600" /> 
                  {editingStudent ? 'Öğrenci Bilgilerini Güncelle' : 'Yeni Öğrenci ve Taksitlendirme Kaydı'}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingStudent ? 'Öğrencinin iletişim ve durum kayıtlarını revize edin.' : 'Öğrencinin cari bilgilerini doldurun, ödeme planı otomatik alt kısımda taslaklanacaktır.'}
                </p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student Details */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase">Öğrenci Sicil Detayları</span>
                    
                    <div>
                      <label className="text-[11px] font-bold text-gray-600">Öğrenci Ad Soyad *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Örn: Ahmet Yılmaz"
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-gray-850"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-600">Öğrenci Telefon No *</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Örn: 0532 999 8877"
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-gray-850"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-600">E-Posta Adresi</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ogrenci@eposta.com"
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-gray-850"
                      />
                    </div>

                    <div className="pt-2 border-t border-gray-50">
                      <label className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase block mb-2">Veli / İkinci İrtibat</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500">Veli Adı Soyadı</label>
                          <input
                            type="text"
                            value={parentName}
                            onChange={(e) => setParentName(e.target.value)}
                            placeholder="Örn: Mehmet Yılmaz"
                            className="w-full mt-1 px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-850"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500">Veli Telefonu</label>
                          <input
                            type="text"
                            value={parentPhone}
                            onChange={(e) => setParentPhone(e.target.value)}
                            placeholder="Telefon No"
                            className="w-full mt-1 px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-850"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Program / Finance Settings */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase">Grup, Kurs & Ödeme Finansı</span>

                    <div>
                      <label className="text-[11px] font-bold text-gray-600">Seçilen Branş / Kurs *</label>
                      <select
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer text-gray-850"
                      >
                        <option value="Piyano">Piyano</option>
                        <option value="Keman">Keman</option>
                        <option value="Gitar">Gitar</option>
                        <option value="Bateri">Bateri</option>
                        <option value="Yan Flüt">Yan Flüt</option>
                        <option value="Şan Eğitimi">Şan Eğitimi</option>
                        <option value="Dans">Dans</option>
                        <option value="Robotik Kodlama">Robotik Kodlama</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-600">Sorumlu Eğitmen / Öğretmen Ataması</label>
                      <select
                        value={teacherId}
                        onChange={(e) => setTeacherId(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer text-gray-850 animate-fade-in"
                      >
                        <option value="">-- Öğretmen Atama (İsteğe Bağlı) --</option>
                        {teachers.filter(t => t.status === 'active').map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.branch})</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1">
                      <div>
                        <label className="text-[10px] font-bold text-gray-600">Aylık Taksit Tutarı (₺) *</label>
                        <input
                          type="number"
                          required
                          value={monthlyFee}
                          onChange={(e) => setMonthlyFee(Number(e.target.value))}
                          className="w-full mt-1 px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-850 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-600">Kayıt Peşinatı (₺)</label>
                        <input
                          type="number"
                          value={downPayment}
                          onChange={(e) => setDownPayment(Number(e.target.value))}
                          className="w-full mt-1 px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-850"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-600">Kayıt / Başlangıç Tarihi</label>
                        <input
                          type="date"
                          required
                          value={registrationDate}
                          onChange={(e) => setRegistrationDate(e.target.value)}
                          className="w-full mt-1 px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-850 font-mono"
                        />
                      </div>
                    </div>

                    {/* Continuous Billing Summary Box */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs my-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Aylık Periyodik Tahsilat Bilgisi</span>
                        <span className="text-[11px] text-gray-600 font-medium mt-0.5">Kayıt silinene kadar her ay {monthlyFee.toLocaleString('tr-TR')} ₺ vade oluşturulur.</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider">Başlangıç Peşinatı</span>
                        <span className="text-xs font-black text-indigo-700 font-sans">{downPayment.toLocaleString('tr-TR')} ₺</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-gray-600">Sicil Durumu</label>
                        <select
                           value={status}
                           onChange={(e) => setStatus(e.target.value as any)}
                           className="w-full mt-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg cursor-pointer text-gray-850"
                        >
                          <option value="active">Aktif Öğrenci</option>
                           <option value="graduated">Mezun</option>
                           <option value="frozen">Kayıt Donduruldu</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-600">Not / Özel Durum</label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Örn: Hafta sonu"
                          className="w-full mt-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-850"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Installment Plan Preview (Highly interactive) */}
                {!editingStudent && (
                  <div className="mt-4 p-4 bg-slate-50/80 rounded-xl border border-gray-150" id="live-payment-plan-preview">
                    <span className="text-[10px] font-bold text-indigo-850 uppercase flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Örnek Gelecek Taksit Akışı (İlk 12 Ay)
                    </span>
                    <div className="text-[11px] text-slate-500 mb-2">
                      Kayıt aktif kaldığı sürece her ay düzenli tahsilat taksitleri planlanır:
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto pr-1">
                      {previewInstallments().slice(0, 12).map(pi => (
                        <div key={pi.number} className="bg-white p-2 rounded-lg border border-gray-150 text-center shadow-3xs">
                          <div className="text-[9px] font-bold text-indigo-700 uppercase">{pi.number}. Ay Taksiti</div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">{pi.amount.toLocaleString('tr-TR')} ₺</div>
                          <div className="text-[8px] text-gray-400 font-mono mt-0.5">{pi.dueDate}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {editingStudent && (
                  <div className="p-3 bg-indigo-50/55 text-indigo-900 rounded-lg border border-indigo-100 text-[11px] leading-relaxed flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                    <div>
                      Cari öğrenci bilgilerini ve aylık ders periyodunu güncelleyebilirsiniz. Yapılan güncellemeler Ödeme Planı ve Kasa raporlarında anında yansıtılır.
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-600 cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> {editingStudent ? 'Kaydı Güncelle' : 'Öğrenci ve Planı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
