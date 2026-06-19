import React, { useState, useMemo } from 'react';
import { Student, Lesson } from '../types';
import { 
  Calendar, Check, Clock, Plus, Trash2, Edit3, User, X, 
  AlertCircle, ChevronLeft, ChevronRight, SlidersHorizontal, BookOpen, GraduationCap
} from 'lucide-react';

interface CalendarManagerProps {
  students: Student[];
  lessons: Lesson[];
  onAddLesson: (lesson: Lesson) => void;
  onUpdateLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 7, label: 'Pazar' },
];

const PASTEL_COLORS = [
  { id: 'indigo', name: 'İndigo', bg: 'bg-indigo-50 hover:bg-indigo-100/80', border: 'border-indigo-250', text: 'text-indigo-800', badge: 'bg-indigo-150 text-indigo-800' },
  { id: 'emerald', name: 'Zümrüt Yeşili', bg: 'bg-emerald-50 hover:bg-emerald-100/80', border: 'border-emerald-250', text: 'text-emerald-800', badge: 'bg-emerald-150 text-emerald-800' },
  { id: 'blue', name: 'Gök Mavisi', bg: 'bg-blue-50 hover:bg-blue-100/80', border: 'border-blue-250', text: 'text-blue-800', badge: 'bg-blue-150 text-blue-800' },
  { id: 'purple', name: 'Mor', bg: 'bg-purple-50 hover:bg-purple-100/80', border: 'border-purple-250', text: 'text-purple-800', badge: 'bg-purple-150 text-purple-800' },
  { id: 'pink', name: 'Gül Kurusu', bg: 'bg-pink-50 hover:bg-pink-100/80', border: 'border-pink-250', text: 'text-pink-800', badge: 'bg-pink-150 text-pink-800' },
  { id: 'amber', name: 'Kehribar', bg: 'bg-amber-50 hover:bg-amber-100/80', border: 'border-amber-250', text: 'text-amber-800', badge: 'bg-amber-150 text-amber-800' },
  { id: 'rose', name: 'Kırmızı/Gül', bg: 'bg-rose-50 hover:bg-rose-100/80', border: 'border-rose-250', text: 'text-rose-800', badge: 'bg-rose-150 text-rose-800' },
];

export default function CalendarManager({ 
  students, 
  lessons, 
  onAddLesson, 
  onUpdateLesson, 
  onDeleteLesson 
}: CalendarManagerProps) {
  
  // View mode toggles
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>('all');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string | 'all'>('all');
  
  // Modal editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  
  // Form values
  const [formStudentId, setFormStudentId] = useState('');
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(1);
  const [formStartTime, setFormStartTime] = useState('14:00');
  const [formEndTime, setFormEndTime] = useState('15:00');
  const [formCourse, setFormCourse] = useState('');
  const [formTeacherName, setFormTeacherName] = useState('');
  const [formColor, setFormColor] = useState('indigo');

  // Trigger editor to add
  const openAddModal = (defaultDay?: number, defaultTime?: string) => {
    setEditingLesson(null);
    if (students.length > 0) {
      const firstStud = students[0];
      setFormStudentId(firstStud.id);
      setFormCourse(firstStud.course);
    } else {
      setFormStudentId('');
      setFormCourse('');
    }
    setFormDayOfWeek(defaultDay || 1);
    setFormStartTime(defaultTime || '14:00');
    // Default 1 hour later
    if (defaultTime) {
      const [hr, min] = defaultTime.split(':').map(Number);
      const nextHr = (hr + 1).toString().padStart(2, '0');
      const minStr = min.toString().padStart(2, '0');
      setFormEndTime(`${nextHr}:${minStr}`);
    } else {
      setFormEndTime('15:00');
    }
    setFormTeacherName('');
    setFormColor('indigo');
    setIsEditorOpen(true);
  };

  // Trigger editor to edit
  const openEditModal = (lesson: Lesson, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setEditingLesson(lesson);
    setFormStudentId(lesson.studentId);
    setFormDayOfWeek(lesson.dayOfWeek);
    setFormStartTime(lesson.startTime);
    setFormEndTime(lesson.endTime);
    setFormCourse(lesson.course);
    setFormTeacherName(lesson.teacherName || '');
    setFormColor(lesson.color || 'indigo');
    setIsEditorOpen(true);
  };

  // Auto-fill course when student changes
  const handleFormStudentChange = (id: string) => {
    setFormStudentId(id);
    const selected = students.find(s => s.id === id);
    if (selected) {
      setFormCourse(selected.course);
    }
  };

  // Conflict state warning checks (overlaps of same student or same teacher at the same day + overlapping times)
  const conflicts = useMemo(() => {
    if (!isEditorOpen || !formStudentId) return [];
    
    const warnings: string[] = [];
    const targetStudent = students.find(s => s.id === formStudentId);
    
    // Validate bounds
    if (formStartTime >= formEndTime) {
      warnings.push("Bitiş saati başlangıç saatinden sonra olmalıdır.");
    }

    // Helper: string overlap detect
    const timesOverlap = (s1: string, e1: string, s2: string, e2: string) => {
      return (s1 < e2 && s2 < e1);
    };

    // Check all lessons in DB excluding the one being edited
    lessons.forEach(l => {
      if (editingLesson && l.id === editingLesson.id) return;

      if (l.dayOfWeek === formDayOfWeek) {
        if (timesOverlap(formStartTime, formEndTime, l.startTime, l.endTime)) {
          // Case 1: Same Student has other class
          if (l.studentId === formStudentId) {
            warnings.push(`Öğrenci ${targetStudent?.name} aynı gün ve saat aralığında zaten başka bir derse kayıtlı (${l.startTime} - ${l.endTime} : ${l.course})`);
          }
          // Case 2: Same Instructor is busy
          if (formTeacherName && l.teacherName && formTeacherName.trim().toLowerCase() === l.teacherName.trim().toLowerCase()) {
            warnings.push(`Eğitmen "${formTeacherName}" aynı gün ve saat aralığında başka bir ders veriyor (${l.startTime} - ${l.endTime} : Öğrenci: ${l.studentName})`);
          }
        }
      }
    });

    return warnings;
  }, [isEditorOpen, formStudentId, formDayOfWeek, formStartTime, formEndTime, formTeacherName, lessons, editingLesson, students]);

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId) return;

    const student = students.find(s => s.id === formStudentId);
    if (!student) return;

    if (formStartTime >= formEndTime) {
      alert("Lütfen geçerli bir saat aralığı giriniz. Başlangıç saati bitiş saatinden önce olmalıdır.");
      return;
    }

    const payload: Lesson = {
      id: editingLesson ? editingLesson.id : `les-${Date.now()}`,
      studentId: formStudentId,
      studentName: student.name,
      dayOfWeek: Number(formDayOfWeek),
      startTime: formStartTime,
      endTime: formEndTime,
      course: formCourse || student.course,
      teacherName: formTeacherName.trim() || undefined,
      color: formColor
    };

    if (editingLesson) {
      onUpdateLesson(payload);
    } else {
      onAddLesson(payload);
    }

    setIsEditorOpen(false);
  };

  // Handle deletion
  const handleDelete = (id: string) => {
    onDeleteLesson(id);
    setIsEditorOpen(false);
  };

  // Filter lessons based on user selection
  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      // Search Box: student, teacher or course
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        l.studentName.toLowerCase().includes(searchLower) ||
        l.course.toLowerCase().includes(searchLower) ||
        (l.teacherName && l.teacherName.toLowerCase().includes(searchLower));

      // Day filter
      const matchesDay = selectedDayFilter === 'all' || l.dayOfWeek === selectedDayFilter;

      // Student filter
      const matchesStudent = selectedStudentFilter === 'all' || l.studentId === selectedStudentFilter;

      return matchesSearch && matchesDay && matchesStudent;
    });
  }, [lessons, searchQuery, selectedDayFilter, selectedStudentFilter]);

  // Group lessons by Day of Week, sorted chronologically
  const lessonsByDay = useMemo(() => {
    const map: Record<number, Lesson[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
    
    filteredLessons.forEach(l => {
      if (map[l.dayOfWeek]) {
        map[l.dayOfWeek].push(l);
      }
    });

    // Sort each day's lessons by start time
    Object.keys(map).forEach(key => {
      map[Number(key)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return map;
  }, [filteredLessons]);

  // Dynamic quick-slots hours (e.g. 09:00, 10:00, ..., 20:00) for standard grid display
  const hourSlots = Array.from({ length: 13 }, (_, i) => {
    const h = i + 9; // starts at 9:00 ends up at 21:00
    return `${h.toString().padStart(2, '0')}:00`;
  });

  return (
    <div className="space-y-6" id="calendar-manager-container">
      {/* Upper Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Öğrenci, ders veya eğitmen ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-gray-400"
            />
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-3" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Day selection */}
          <select
            value={selectedDayFilter}
            onChange={(e) => setSelectedDayFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="text-xs bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10"
          >
            <option value="all">Tüm Günler</option>
            {DAYS_OF_WEEK.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          {/* Student filter */}
          <select
            value={selectedStudentFilter}
            onChange={(e) => setSelectedStudentFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 max-w-[200px] truncate cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10"
          >
            <option value="all">Tüm Öğrenciler</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* View actions and Program button */}
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-white text-indigo-700 shadow-3xs' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Haftalık Tablo
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-white text-indigo-700 shadow-3xs' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Günlük Liste
            </button>
          </div>

          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" /> Yeni Ders Planla
          </button>
        </div>
      </div>

      {/* Grid View Mode */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-2xl border border-gray-150 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800 tracking-tight">YAĞMUR YÜKSEL SANAT AKADEMİSİ HAFTALIK DERS PROGRAMI</h3>
            </div>
            <div className="text-[11px] text-gray-400 font-medium">Ders kartlarına tıklayarak zaman güncelleyebilir veya iptal edebilirsiniz.</div>
          </div>

          {/* Weekly Board Columns */}
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-gray-150 bg-white">
            {DAYS_OF_WEEK.map(day => {
              const dayLessons = lessonsByDay[day.value] || [];
              
              return (
                <div key={day.value} className="min-h-[350px] flex flex-col">
                  {/* Column Header */}
                  <div className="p-3 bg-slate-50/50 text-center border-b border-gray-100 flex items-center justify-between md:block shrink-0">
                    <span className="text-xs font-bold text-gray-700">{day.label}</span>
                    <span className="text-[10px] font-bold bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded-full block md:inline md:ml-1.5">{dayLessons.length} Ders</span>
                  </div>

                  {/* Column Contents */}
                  <div className="p-2 gap-2 flex-grow flex flex-col bg-slate-50/20">
                    {dayLessons.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-gray-200/60 rounded-xl min-h-[120px]">
                        <span className="text-[10px] text-gray-400 text-center font-medium">Planlı ders yok</span>
                        <button 
                          onClick={() => openAddModal(day.value)} 
                          className="mt-2 text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" /> Ders Yaz
                        </button>
                      </div>
                    ) : (
                      dayLessons.map(lesson => {
                        const stylePreset = PASTEL_COLORS.find(c => c.id === lesson.color) || PASTEL_COLORS[0];
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => openEditModal(lesson)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${stylePreset.bg} ${stylePreset.border} ${stylePreset.text} group relative`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3 shrink-0 opacity-70" />
                                {lesson.startTime} - {lesson.endTime}
                              </span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit3 className="w-3 h-3 text-gray-400 hover:text-gray-700" />
                              </span>
                            </div>

                            <p className="text-xs font-bold truncate tracking-tight">{lesson.studentName}</p>
                            
                            <div className="mt-1 space-y-0.5 text-[10px] uppercase font-semibold opacity-85">
                              <div className="flex items-center gap-1">
                                <BookOpen className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                <span className="truncate">{lesson.course}</span>
                              </div>
                              {lesson.teacherName && (
                                <div className="flex items-center gap-1 text-slate-500 font-medium">
                                  <User className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                  <span className="truncate">Yazar: {lesson.teacherName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View Mode */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-150 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800 tracking-tight">TÜM KAYITLI DERS PROGRAMI LİSTESİ</h3>
            </div>
            <span className="text-xs font-bold text-indigo-600 font-mono">Toplam {filteredLessons.length} Sonuç</span>
          </div>

          {filteredLessons.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Calendar className="w-12 h-12 mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-semibold">Filtrelere uygun programlanmış ders bulunamadı.</p>
              <p className="text-xs text-gray-400 mt-1">Lütfen arama terimlerinizi değiştirin veya yeni bir ders saati ekleyin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100">
                    <th className="py-3 px-4">Gün</th>
                    <th className="py-3 px-4">Saat Aralığı</th>
                    <th className="py-3 px-4">Öğrenci Adı</th>
                    <th className="py-3 px-4">Eğitim / Branş</th>
                    <th className="py-3 px-4">Eğitmen (Öğretmen)</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
                  {filteredLessons.map(lesson => {
                    const dayLabel = DAYS_OF_WEEK.find(d => d.value === lesson.dayOfWeek)?.label || '';
                    const stylePreset = PASTEL_COLORS.find(c => c.id === lesson.color) || PASTEL_COLORS[0];
                    return (
                      <tr key={lesson.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{dayLabel}</td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono text-[10px]">
                            {lesson.startTime} - {lesson.endTime}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${stylePreset.bg.split(' ')[0]} border ${stylePreset.border}`} />
                          {lesson.studentName}
                        </td>
                        <td className="py-3 px-4 text-gray-500">{lesson.course}</td>
                        <td className="py-3 px-4 italic text-slate-600">
                          {lesson.teacherName ? lesson.teacherName : 'Atanmadı'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(lesson)}
                              className="p-1 hover:bg-indigo-50 text-indigo-600 rounded cursor-pointer transition-colors"
                              title="Dersi Düzenle"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(lesson.id); }}
                              className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer transition-colors"
                              title="Yönetimi Kaldır"
                            >
                              <Trash2 className="w-4 h-4" />
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
      )}

      {/* Editor Modal Drawer */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-150 shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-150 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {editingLesson ? "Ders Programı Detayını Düzenle" : "Yeni Haftalık Ders Programla"}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Öğrenci için ders günü, saat aralıkları ve eğitmen tayin edin.
                </p>
              </div>
              <button 
                onClick={() => setIsEditorOpen(false)} 
                className="p-1 hover:bg-gray-200 text-gray-400 rounded-md cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              
              {/* Student selection */}
              <div>
                <label className="block text-gray-500 font-bold mb-1.5">Mevcut Kayıtlı Öğrenci</label>
                {students.length === 0 ? (
                  <p className="text-rose-500 font-bold">Lütfen önce sisteme en az bir öğrenci kaydedin!</p>
                ) : (
                  <select
                    value={formStudentId}
                    onChange={(e) => handleFormStudentChange(e.target.value)}
                    required
                    disabled={!!editingLesson}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10"
                  >
                    <option value="" disabled>--- Seçiniz ---</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.course})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Day selection */}
              <div>
                <label className="block text-gray-500 font-bold mb-1.5">Ders Günü</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 bg-slate-100/75 p-1 rounded-xl">
                  {DAYS_OF_WEEK.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setFormDayOfWeek(d.value)}
                      className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                        formDayOfWeek === d.value 
                          ? 'bg-indigo-600 text-white shadow-2xs' 
                          : 'text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {d.label.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Times Slots */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 font-bold mb-1.5">Başlangıç Saati</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10"
                    />
                    <Clock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-500 font-bold mb-1.5">Bitiş Saati</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10"
                    />
                    <Clock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>

              {/* Course branch (Pre-filled but custom editable) */}
              <div>
                <label className="block text-gray-500 font-bold mb-1.5">Branş / Kurs Alanı</label>
                <input
                  type="text"
                  value={formCourse}
                  onChange={(e) => setFormCourse(e.target.value)}
                  placeholder="e.g. Piyano, Sanat Tasarımı, YKS Hazırlık"
                  required
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>

              {/* Teacher name */}
              <div>
                <label className="block text-gray-500 font-bold mb-1.5">Eğitmen (Öğretmen)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formTeacherName}
                    onChange={(e) => setFormTeacherName(e.target.value)}
                    placeholder="Eğitmen adını yazınız..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10"
                  />
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Color selections */}
              <div>
                <label className="block text-gray-500 font-bold mb-1.5">Zaman Blok Rengi</label>
                <div className="flex flex-wrap gap-2">
                  {PASTEL_COLORS.map(colorOption => (
                    <button
                      key={colorOption.id}
                      type="button"
                      onClick={() => setFormColor(colorOption.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                        formColor === colorOption.id 
                          ? `${colorOption.badge} border-neutral-400 ring-2 ring-indigo-505/20` 
                          : 'bg-white text-gray-600 hover:bg-slate-50 border-gray-200'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${colorOption.bg.split(' ')[0]} border border-black/10`} />
                      {colorOption.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conflicts Alerts warning panel */}
              {conflicts.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Çakışma / Uyarı Paneli</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-amber-700 text-[10px] leading-normal pl-1 font-medium">
                    {conflicts.map((warning, ind) => (
                      <li key={ind}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-150">
                <div>
                  {editingLesson && (
                    <button
                      type="button"
                      onClick={() => handleDelete(editingLesson.id)}
                      className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 px-3 rounded-xl cursor-pointer transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> İptal Et
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="bg-gray-100 hover:bg-gray-250 text-gray-600 font-bold py-2 px-4 rounded-xl cursor-pointer transition-all"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={students.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingLesson ? "Gelişmeleri Kaydet" : "Programı Onayla"}
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
