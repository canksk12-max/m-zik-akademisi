import React, { useState } from 'react';
import { Teacher } from '../types';
import { Plus, Search, User, Phone, Mail, Award, Edit2, Trash2, X, Save, AlertCircle, RefreshCw } from 'lucide-react';

interface TeacherManagerProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
}

export default function TeacherManager({
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher
}: TeacherManagerProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form fields state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['Piyano']);
  const [customBranch, setCustomBranch] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const DEFAULT_BRANCHES = [
    "Piyano",
    "Keman",
    "Gitar",
    "Bateri",
    "Yan Flüt",
    "Şan Eğitimi",
    "Dans",
    "Robotik Kodlama",
    "Resim"
  ];

  const toggleBranch = (b: string) => {
    if (selectedBranches.includes(b)) {
      setSelectedBranches(selectedBranches.filter(x => x !== b));
    } else {
      setSelectedBranches([...selectedBranches, b]);
    }
  };

  const handleAddCustomBranch = (e: React.MouseEvent) => {
    e.preventDefault();
    const trimmed = customBranch.trim();
    if (trimmed && !selectedBranches.includes(trimmed)) {
      setSelectedBranches([...selectedBranches, trimmed]);
      setCustomBranch('');
    }
  };

  // Custom Delete Modal State (Solves iframe restrictions blocking window.confirm)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = t.status === 'active';
    } else if (statusFilter === 'inactive') {
      matchesStatus = t.status === 'inactive';
    }

    return matchesSearch && matchesStatus;
  });

  const handleOpenAddForm = () => {
    setEditingTeacher(null);
    setName('');
    setPhone('');
    setEmail('');
    setSelectedBranches(['Piyano']);
    setCustomBranch('');
    setStatus('active');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setName(teacher.name);
    setPhone(teacher.phone);
    setEmail(teacher.email);
    
    // Parse comma or ampersand separated branches
    let parts: string[] = [];
    if (teacher.branch) {
      parts = teacher.branch.split(/[,&]/).map(b => b.trim()).filter(Boolean);
    }
    if (parts.length === 0) {
      parts = ['Piyano'];
    }
    setSelectedBranches(parts);
    setCustomBranch('');
    setStatus(teacher.status);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const branchString = selectedBranches.length > 0 
      ? selectedBranches.join(', ') 
      : 'Piyano';

    if (editingTeacher) {
      const updated: Teacher = {
        ...editingTeacher,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        branch: branchString,
        status: status
      };
      onUpdateTeacher(updated);
    } else {
      const newTeacher: Teacher = {
        id: `tch-${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        branch: branchString,
        status: status
      };
      onAddTeacher(newTeacher);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
  };

  const executeDelete = () => {
    if (deleteConfirmId) {
      onDeleteTeacher(deleteConfirmId);
      setDeleteConfirmId(null);
      setDeleteConfirmName('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="teacher-manager-root">
      
      {/* Search and Action Row */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-3xs flex flex-col md:flex-row gap-3 items-center justify-between" id="teacher-actions-bar">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Eğitmen adı, branşı veya e-posta..."
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
            <option value="">Tüm Eğitmen Durumları</option>
            <option value="active">Aktif Eğitmenler</option>
            <option value="inactive">Pasif Eğitmenler</option>
          </select>

          <button
            onClick={handleOpenAddForm}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all active:scale-95 shrink-0"
            id="register-teacher-btn"
          >
            <Plus className="w-4 h-4" /> Yeni Eğitmen Kaydet
          </button>
        </div>
      </div>

      {/* Teacher Cards / Table Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs overflow-hidden" id="teachers-grid-panel">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-800">Kayıtlı Sanat & Enstrüman Eğitmenleri ({filteredTeachers.length})</span>
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <User className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-sm font-bold text-gray-600">Arama Kriterlerine Uygun Eğitmen Bulunamadı</p>
            <p className="text-xs text-gray-400 mt-1">Girdiğiniz filtreleri temizleyebilir veya yeni bir eğitmen kaydı oluşturabilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">Eğitmen Bilgisi</th>
                  <th className="p-4">İletişim Bilgileri</th>
                  <th className="p-4">Uzmanlık / Branş</th>
                  <th className="p-4 text-center">Durum</th>
                  <th className="p-4 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTeachers.map(teacher => (
                  <tr key={teacher.id} className="hover:bg-slate-50/45 transition-colors text-xs" id={`row-teacher-${teacher.id}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold select-none text-xs">
                          {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{teacher.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">Sicil ID: {teacher.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{teacher.phone || 'Girilmemiş'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{teacher.email || 'Girilmemiş'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {teacher.branch.split(',').map((b, bIdx) => (
                          <span key={bIdx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg text-[10px] font-bold whitespace-nowrap">
                            <Award className="w-2.5 h-2.5 text-amber-500" /> {b.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        teacher.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-gray-150 text-gray-600'
                      }`}>
                        {teacher.status === 'active' ? 'Aktif Eğitmen' : 'Ayrıldı / Pasif'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditForm(teacher)}
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-all"
                          title="Eğitmeni Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id, teacher.name)}
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
                          title="Eğitmeni Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="teacher-form-overlay">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                  <User className="w-5 h-5 text-indigo-600" />
                  {editingTeacher ? 'Eğitmen Bilgilerini Düzenle' : 'Yeni Eğitmen Kayıt Formu'}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingTeacher ? 'Mevcut eğitmenin iletişim ve branş detaylarını güncelleyin.' : 'Akademi bünyesine yeni katılan eğitmenin özlük bilgilerini tanımlayın.'}
                </p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600">Eğitmen Adı Soyadı *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Örn: Yağmur Yüksel"
                    className="w-full mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-gray-800 text-xs transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600">Telefon Numarası</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Örn: 0532 200 1010"
                      className="w-full mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-gray-800 text-xs transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600">E-Posta Adresi</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yagmur@yukselart.com"
                      className="w-full mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-gray-800 text-xs transition-all"
                    />
                  </div>
                </div>

                {/* Instructor Specialty Selection Section */}
                <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-150">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">
                      Uzmanlık / Branş Seçimi <span className="text-indigo-600 font-extrabold">({selectedBranches.length} Seçildi)</span> *
                    </label>
                    <p className="text-[10px] text-gray-400">Eğitmenin ders verebileceği branşları üzerine tıklayarak seçin veya kaldırın.</p>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-gray-200 rounded-xl max-h-36 overflow-y-auto w-full">
                      {DEFAULT_BRANCHES.map(b => {
                        const isSelected = selectedBranches.includes(b);
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => toggleBranch(b)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-3xs'
                                : 'bg-gray-50 text-gray-650 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          >
                            {b}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Custom Specialty Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 block">
                      Listede Olmayan Farklı Bir Branş Ekle
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customBranch}
                        onChange={(e) => setCustomBranch(e.target.value)}
                        placeholder="Örn: Solfej, Çello, Saz, Resim..."
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-gray-850 text-xs transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const trimmed = customBranch.trim();
                            if (trimmed && !selectedBranches.includes(trimmed)) {
                              setSelectedBranches([...selectedBranches, trimmed]);
                              setCustomBranch('');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomBranch}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 shadow-3xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Ekle
                      </button>
                    </div>
                  </div>

                  {/* Display Selected Custom (Extra) Branches */}
                  {selectedBranches.filter(b => !DEFAULT_BRANCHES.includes(b)).length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">Eklenen Diğer Branşlar:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedBranches.filter(b => !DEFAULT_BRANCHES.includes(b)).map(b => (
                          <span key={b} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg text-[10px] font-bold">
                            {b}
                            <button
                              type="button"
                              onClick={() => toggleBranch(b)}
                              className="text-amber-600 hover:text-amber-900 font-bold ml-1 cursor-pointer"
                              title="Sil"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600">Çalışma Durumu</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer text-gray-850 text-xs font-medium"
                  >
                    <option value="active">Aktif Eğitmen</option>
                    <option value="inactive">Pasif / Ayrıldı</option>
                  </select>
                </div>
              </div>

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
                  <Save className="w-4 h-4" /> {editingTeacher ? 'Değişiklikleri Kaydet' : 'Eğitmeni Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal (Solves iframe sandbox restrictions) */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="delete-confirm-overlay">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-rose-50 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <h3 className="text-sm font-bold">Eğitmeni Silme Onayı</h3>
            </div>
            
            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-700 leading-relaxed">
                <span className="font-bold text-gray-950">"{deleteConfirmName}"</span> isimli eğitmeni sistemden silmek istediğinize emin misiniz?
              </p>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 font-medium leading-relaxed flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Bu eğitmenin silinmesi, ona atanmış olan tüm öğrencilerin eğitmen atamasını temizleyecektir. Bu işlem geri alınamaz.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmName('');
                }}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-600 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                id="confirm-delete-teacher-btn"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
