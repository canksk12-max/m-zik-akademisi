import React, { useState, useMemo, useEffect } from 'react';
import { Student, Lesson, Teacher } from '../types';
import { 
  Calendar, Check, Clock, Plus, Trash2, Edit3, User, X, 
  AlertCircle, ChevronLeft, ChevronRight, SlidersHorizontal, BookOpen, GraduationCap,
  MessageSquare, Send, Copy, Smartphone, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface CalendarManagerProps {
  students: Student[];
  lessons: Lesson[];
  teachers: Teacher[];
  onAddLesson?: (lesson: Lesson) => void;
  onUpdateLesson?: (lesson: Lesson) => void;
  onDeleteLesson?: (lessonId: string) => void;
  isReadOnly?: boolean;
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
  teachers,
  onAddLesson, 
  onUpdateLesson, 
  onDeleteLesson,
  isReadOnly = false
}: CalendarManagerProps) {
  
  // View mode toggles
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Active day for mobile responsive grid view (Mon=1, Tue=2, ..., Sun=7)
  const [activeMobileDay, setActiveMobileDay] = useState<number>(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  });

  // WhatsApp Reminder State
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [activeLessonForWhatsapp, setActiveLessonForWhatsapp] = useState<Lesson | null>(null);
  const [recipientType, setRecipientType] = useState<'student' | 'parent' | 'teacher' | 'teacher_2h'>('student');
  const [customPhone, setCustomPhone] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Clean and format phone for WhatsApp API
  const formatWhatsAppPhone = (phone: string): string => {
    if (!phone) return '';
    let clean = phone.replace(/\D/g, '');
    
    if (clean.startsWith('0090')) {
      clean = clean.substring(2);
    }
    
    if (clean.startsWith('90') && clean.length === 12) {
      return clean;
    }
    
    if (clean.startsWith('0') && clean.length === 11) {
      clean = '90' + clean.substring(1);
    } else if (clean.length === 10) {
      clean = '90' + clean;
    }
    return clean;
  };

  // Generate Turkish template based on dynamic parameters
  const generateWhatsappTemplate = (
    lesson: Lesson, 
    type: 'student' | 'parent' | 'teacher' | 'teacher_2h',
    st?: Student,
    te?: Teacher
  ): string => {
    const dayLabel = DAYS_OF_WEEK.find(d => d.value === lesson.dayOfWeek)?.label || '';
    const timeString = `${lesson.startTime} - ${lesson.endTime}`;
    
    if (type === 'student') {
      return `Değerli öğrencimiz *${lesson.studentName}*,\n\n*Yağmur Yüksel Sanat Akademisi* bünyesindeki *${lesson.course}* dersiniz *${dayLabel}* günü saat *${timeString}* arasında planlanmıştır. \n\nDers durumunuzda bir değişiklik olması halinde lütfen önceden tarafımıza bilgi veriniz.\n\nKeyifli dersler dileriz! 🌸🎹🎨`;
    } else if (type === 'parent') {
      const parentLabel = st?.parentName ? `*${st.parentName}*` : 'Velimiz';
      return `Değerli velimiz ${parentLabel} (Öğrencimiz: *${lesson.studentName}*),\n\n*Yağmur Yüksel Sanat Akademisi* bünyesindeki *${lesson.course}* dersimiz *${dayLabel}* günü saat *${timeString}* arasında programlanmıştır. \n\nDerse katılım durumunu teyit etmenizi rica eder, iyi günler dileriz! 🌸🎻🎨`;
    } else if (type === 'teacher') {
      const teacherLabel = lesson.teacherName ? `*${lesson.teacherName}*` : 'öğretmenimiz';
      return `Değerli eğitmenimiz ${teacherLabel},\n\nÖğrenciniz *${lesson.studentName}* ile yapacağınız *${lesson.course}* dersiniz bu hafta *${dayLabel}* günü saat *${timeString}* arasında planlanmıştır. \n\nİyi dersler ve verimli çalışmalar dileriz! 🎶🎨`;
    } else { // teacher_2h
      const teacherLabel = lesson.teacherName ? `*${lesson.teacherName}*` : 'öğretmenimiz';
      return `Değerli eğitmenimiz ${teacherLabel},\n\nBugünkü öğrenciniz *${lesson.studentName}* ile olan *${lesson.course}* dersinize son *2 SAAT* kalmıştır. ⏰\n\nDers saati: *${lesson.startTime} - ${lesson.endTime}*\n\nİyi dersler dileriz! 🎶🌸`;
    }
  };

  // Open helper modal
  const handleOpenWhatsappModal = (lesson: Lesson, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveLessonForWhatsapp(lesson);
    
    const student = students.find(s => s.id === lesson.studentId);
    const teacher = teachers.find(t => t.name.trim().toLowerCase() === (lesson.teacherName || '').trim().toLowerCase());
    
    let initialType: 'student' | 'parent' | 'teacher' | 'teacher_2h' = 'student';
    let initialPhone = '';
    
    if (student) {
      if (student.phone) {
        initialType = 'student';
        initialPhone = student.phone;
      } else if (student.parentPhone) {
        initialType = 'parent';
        initialPhone = student.parentPhone;
      }
    } else if (teacher && teacher.phone) {
      initialType = 'teacher';
      initialPhone = teacher.phone;
    }
    
    setRecipientType(initialType);
    setCustomPhone(initialPhone);
    
    const defaultText = generateWhatsappTemplate(lesson, initialType, student, teacher);
    setMessageText(defaultText);
    setIsCopied(false);
    setIsWhatsappModalOpen(true);
  };

  // Recipient change selector handler
  const handleRecipientTypeChange = (type: 'student' | 'parent' | 'teacher' | 'teacher_2h') => {
    setRecipientType(type);
    if (!activeLessonForWhatsapp) return;
    
    const lesson = activeLessonForWhatsapp;
    const student = students.find(s => s.id === lesson.studentId);
    const teacher = teachers.find(t => t.name.trim().toLowerCase() === (lesson.teacherName || '').trim().toLowerCase());
    
    let phone = '';
    if (type === 'student' && student) {
      phone = student.phone || '';
    } else if (type === 'parent' && student) {
      phone = student.parentPhone || student.phone || '';
    } else if (type === 'teacher' && teacher) {
      phone = teacher.phone || '';
    } else if (type === 'teacher_2h' && teacher) {
      phone = teacher.phone || '';
    }
    
    setCustomPhone(phone);
    const text = generateWhatsappTemplate(lesson, type, student, teacher);
    setMessageText(text);
  };

  // Copy text helper
  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Launch direct window redirect to Whatsapp API
  const handleLaunchWhatsapp = () => {
    if (!customPhone) {
      alert('Lütfen geçerli bir telefon numarası giriniz.');
      return;
    }
    const cleanNumber = formatWhatsAppPhone(customPhone);
    const encodedText = encodeURIComponent(messageText);
    const url = `https://wa.me/${cleanNumber}?text=${encodedText}`;
    window.open(url, '_blank');
  };
  
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
      setFormTeacherName(firstStud.teacherName || '');
    } else {
      setFormStudentId('');
      setFormCourse('');
      setFormTeacherName('');
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

  // Auto-fill course and teacher when student changes
  const handleFormStudentChange = (id: string) => {
    setFormStudentId(id);
    const selected = students.find(s => s.id === id);
    if (selected) {
      setFormCourse(selected.course);
      setFormTeacherName(selected.teacherName || '');
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
    if (isReadOnly) return;
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
      if (onUpdateLesson) onUpdateLesson(payload);
    } else {
      if (onAddLesson) onAddLesson(payload);
    }

    setIsEditorOpen(false);
  };

  // Handle deletion
  const handleDelete = (id: string) => {
    if (isReadOnly) return;
    if (onDeleteLesson) onDeleteLesson(id);
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

  const normalizeTurkish = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
      .replace(/ü/g, 'u').replace(/Ü/g, 'U')
      .replace(/ş/g, 's').replace(/Ş/g, 'S')
      .replace(/ı/g, 'i').replace(/İ/g, 'I')
      .replace(/ö/g, 'o').replace(/Ö/g, 'O')
      .replace(/ç/g, 'c').replace(/Ç/g, 'C');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    // Color mapping for lesson presets
    const colorMapping: Record<string, { bg: { r: number, g: number, b: number }, border: { r: number, g: number, b: number }, text: { r: number, g: number, b: number } }> = {
      indigo: { bg: { r: 238, g: 242, b: 255 }, border: { r: 199, g: 210, b: 254 }, text: { r: 55, g: 48, b: 163 } },
      emerald: { bg: { r: 236, g: 253, b: 245 }, border: { r: 167, g: 243, b: 208 }, text: { r: 6, g: 95, b: 70 } },
      blue: { bg: { r: 239, g: 246, b: 255 }, border: { r: 191, g: 219, b: 254 }, text: { r: 30, g: 64, b: 175 } },
      purple: { bg: { r: 245, g: 243, b: 255 }, border: { r: 221, g: 214, b: 254 }, text: { r: 91, g: 33, b: 182 } },
      pink: { bg: { r: 253, g: 242, b: 248 }, border: { r: 251, g: 207, b: 232 }, text: { r: 157, g: 23, b: 77 } },
      amber: { bg: { r: 255, g: 251, b: 235 }, border: { r: 253, g: 230, b: 138 }, text: { r: 146, g: 64, b: 14 } },
      rose: { bg: { r: 255, g: 241, b: 242 }, border: { r: 254, g: 205, b: 211 }, text: { r: 159, g: 18, b: 57 } }
    };

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(normalizeTurkish("YAĞMUR YÜKSEL SANAT AKADEMİSİ"), 148.5, 12, { align: "center" });
    
    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(normalizeTurkish("Haftalık Ders Programı Tablosu"), 148.5, 17, { align: "center" });
    
    // Date & Filters Info
    const today = new Date().toLocaleDateString('tr-TR');
    let subtitleText = `Rapor Tarihi: ${today}`;
    if (selectedDayFilter !== 'all') {
      const dayLabel = DAYS_OF_WEEK.find(d => d.value === selectedDayFilter)?.label || '';
      subtitleText += ` | Filtre: ${dayLabel}`;
    }
    if (selectedStudentFilter !== 'all') {
      const studentName = students.find(s => s.id === selectedStudentFilter)?.name || '';
      subtitleText += ` | Öğrenci: ${studentName}`;
    }
    if (searchQuery) {
      subtitleText += ` | Arama: "${searchQuery}"`;
    }
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(normalizeTurkish(subtitleText), 148.5, 22, { align: "center" });
    
    // Total Width calculations
    const pageLength = 297;
    const pageHeight = 210;
    const leftOffset = 10;
    const rightOffset = 10;
    const availableWidth = pageLength - leftOffset - rightOffset; // 277mm
    const columnGap = 1.8;
    const totalDays = 7;
    const columnWidth = (availableWidth - (columnGap * (totalDays - 1))) / totalDays; // ~38mm

    const columnHeaderYStart = 26;
    const columnHeaderHeight = 11;
    const contentYStart = 39;
    const availableHeightForCards = 153; // 192mm is max safe bottom Y

    // Calculate maximum lessons in any single day to auto-scale card heights
    const maxLessonsCount = Math.max(1, ...DAYS_OF_WEEK.map(day => (lessonsByDay[day.value] || []).length));
    
    // Default card parameters
    let cardHeight = 16;
    let gap = 1.5;
    let cardHeightWithGap = 17.5;

    // Auto-scale if max lessons list overflows the page
    if (maxLessonsCount * 17.5 > availableHeightForCards) {
      cardHeightWithGap = availableHeightForCards / maxLessonsCount;
      gap = Math.max(0.6, cardHeightWithGap * 0.08);
      cardHeight = cardHeightWithGap - gap;
    }

    DAYS_OF_WEEK.forEach((day, i) => {
      const x = leftOffset + i * (columnWidth + columnGap);
      
      // 1. Column Day Header Background
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(x, columnHeaderYStart, columnWidth, columnHeaderHeight, 1.2, 1.2, 'F');
      
      // Column Day Header Border
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.roundedRect(x, columnHeaderYStart, columnWidth, columnHeaderHeight, 1.2, 1.2, 'S');
      
      // Day Label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(normalizeTurkish(day.label), x + columnWidth / 2, columnHeaderYStart + 4.5, { align: "center" });
      
      // Day Lesson Count
      const dayLessons = lessonsByDay[day.value] || [];
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(115, 115, 115);
      doc.text(normalizeTurkish(`${dayLessons.length} Ders`), x + columnWidth / 2, columnHeaderYStart + 9, { align: "center" });

      // 2. Draw Column Contents
      if (dayLessons.length === 0) {
        // Draw empty indicator box representing "no lessons" matching the app UI
        doc.setDrawColor(241, 245, 249); // slate-100
        doc.setFillColor(255, 255, 255);
        doc.setLineWidth(0.35);
        doc.setLineDashPattern([1.5, 1.5], 0);
        doc.roundedRect(x, contentYStart, columnWidth, 25, 1.2, 1.2, 'FD');
        doc.setLineDashPattern([], 0); // reset line dash style
        
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(203, 213, 225); // slate-300
        doc.text(normalizeTurkish("Ders Yazilmamis"), x + columnWidth / 2, contentYStart + 13, { align: "center" });
      } else {
        dayLessons.forEach((lesson, j) => {
          const y = contentYStart + j * cardHeightWithGap;
          
          const colorId = lesson.color || 'indigo';
          const colorProfile = colorMapping[colorId] || colorMapping['indigo'];
          
          // Draw Lesson Card
          doc.setFillColor(colorProfile.bg.r, colorProfile.bg.g, colorProfile.bg.b);
          doc.setDrawColor(colorProfile.border.r, colorProfile.border.g, colorProfile.border.b);
          doc.setLineWidth(0.3);
          doc.roundedRect(x, y, columnWidth, cardHeight, 1.2, 1.2, 'FD');
          
          // Left accent bar
          doc.setFillColor(colorProfile.text.r, colorProfile.text.g, colorProfile.text.b);
          doc.rect(x, y, 1.2, cardHeight, 'F');
          
          // Text setups
          const textPaddingX = x + 3;
          doc.setTextColor(colorProfile.text.r, colorProfile.text.g, colorProfile.text.b);
          
          const timeFontSize = cardHeight < 11 ? 5.5 : cardHeight < 14 ? 6.5 : 7;
          const studentFontSize = cardHeight < 11 ? 6 : cardHeight < 14 ? 7 : 8;
          const detailFontSize = cardHeight < 11 ? 5.5 : cardHeight < 14 ? 6.5 : 7;
          
          // A. Draw Clock Time Icon & String
          doc.setFont("helvetica", "bold");
          doc.setFontSize(timeFontSize);
          const timeStr = `${lesson.startTime} - ${lesson.endTime}`;
          doc.text(normalizeTurkish(timeStr), textPaddingX, y + (cardHeight * 0.26));
          
          // B. Draw Student Name
          doc.setFont("helvetica", "bold");
          doc.setFontSize(studentFontSize);
          let studentName = lesson.studentName;
          const maxStudentLength = columnWidth > 38 ? 16 : 14;
          if (studentName.length > maxStudentLength) {
            studentName = studentName.substring(0, maxStudentLength - 2) + "..";
          }
          doc.text(normalizeTurkish(studentName), textPaddingX, y + (cardHeight * 0.54));
          
          // C. Draw Course and Teacher name
          doc.setFont("helvetica", "normal");
          doc.setFontSize(detailFontSize);
          let courseAndTeacher = lesson.course;
          if (lesson.teacherName) {
            courseAndTeacher += ` | ${lesson.teacherName}`;
          }
          const maxDetailLength = columnWidth > 38 ? 22 : 18;
          if (courseAndTeacher.length > maxDetailLength) {
            courseAndTeacher = courseAndTeacher.substring(0, maxDetailLength - 2) + "..";
          }
          doc.text(normalizeTurkish(courseAndTeacher), textPaddingX, y + (cardHeight * 0.81));
        });
      }
    });

    // Footer - Simple styling watermark in landscape
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      normalizeTurkish("Bu haftalık program Yağmur Yüksel Sanat Akademisi otomasyon sistemi ile otomatik oluşturulmuştur."),
      leftOffset,
      198
    );
    doc.text(
      normalizeTurkish("Sayfa 1 / 1"),
      pageLength - rightOffset,
      198,
      { align: "right" }
    );
    
    doc.save(`haftalik_ders_tablosu_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6" id="calendar-manager-container">
      {/* Upper Control Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Day selection */}
            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="text-xs bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 flex-1 sm:flex-initial"
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
              className="text-xs bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 max-w-[150px] sm:max-w-[200px] truncate cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 flex-1 sm:flex-initial"
            >
              <option value="all">Tüm Öğrenciler</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View actions and Program button */}
        <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-between lg:justify-end">
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
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs cursor-pointer transition-all shrink-0"
          >
            <Download className="w-4 h-4" /> Haftalık PDF İndir
          </button>

          {!isReadOnly && (
            <button
              onClick={() => openAddModal()}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Yeni Ders Planla
            </button>
          )}
        </div>
      </div>

      {/* Grid View Mode */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-2xl border border-gray-150 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800 tracking-tight">YAĞMUR YÜKSEL SANAT AKADEMİSİ HAFTALIK DERS PROGRAMI</h3>
            </div>
            <div className="text-[11px] text-indigo-600 font-bold">
              {isReadOnly ? "Ders detaylarına dokunarak WhatsApp hatırlatması gönderebilirsiniz." : "Ders kartlarına tıklayarak zaman güncelleyebilir veya iptal edebilirsiniz."}
            </div>
          </div>

          {/* Mobile Friendly Day Switcher Tabs */}
          <div className="md:hidden flex items-center gap-1.5 p-3 overflow-x-auto bg-slate-100/50 border-b border-gray-150 scrollbar-none">
            {DAYS_OF_WEEK.map(day => {
              const count = (lessonsByDay[day.value] || []).length;
              const isActive = activeMobileDay === day.value;
              return (
                <button
                  key={day.value}
                  onClick={() => setActiveMobileDay(day.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-[1.02]'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-gray-200'
                  }`}
                >
                  {day.label.substring(0, 3)}
                  {count > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                      isActive ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Weekly Board Columns */}
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-gray-150 bg-white">
            {DAYS_OF_WEEK.map(day => {
              const dayLessons = lessonsByDay[day.value] || [];
              const isMobileHidden = activeMobileDay !== day.value;
              
              return (
                <div key={day.value} className={`min-h-[350px] flex flex-col ${isMobileHidden ? 'hidden md:flex' : 'flex'}`}>
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
                        {!isReadOnly && (
                          <button 
                            onClick={() => openAddModal(day.value)} 
                            className="mt-2 text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" /> Ders Yaz
                          </button>
                        )}
                      </div>
                    ) : (
                      dayLessons.map(lesson => {
                        const stylePreset = PASTEL_COLORS.find(c => c.id === lesson.color) || PASTEL_COLORS[0];
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => {
                              if (!isReadOnly) {
                                openEditModal(lesson);
                              } else {
                                handleOpenWhatsappModal(lesson);
                              }
                            }}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              !isReadOnly ? 'cursor-pointer' : 'cursor-pointer hover:scale-[1.01]'
                            } ${stylePreset.bg} ${stylePreset.border} ${stylePreset.text} group relative`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3 shrink-0 opacity-70" />
                                {lesson.startTime} - {lesson.endTime}
                              </span>
                              <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity opacity-100">
                                <button
                                  onClick={(e) => handleOpenWhatsappModal(lesson, e)}
                                  className="p-1 hover:bg-emerald-250 text-emerald-800 rounded-lg transition-colors cursor-pointer"
                                  title="WhatsApp Hatırlatması Gönder"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                                {!isReadOnly && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openEditModal(lesson); }}
                                    className="p-1 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
                                    title="Dersi Düzenle"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
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
                                  <span className="truncate">Eğitmen: {lesson.teacherName}</span>
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
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
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
                            <span className={`w-2/2 w-2 h-2 rounded-full ${stylePreset.bg.split(' ')[0]} border ${stylePreset.border}`} />
                            {lesson.studentName}
                          </td>
                          <td className="py-3 px-4 text-gray-500">{lesson.course}</td>
                          <td className="py-3 px-4 italic text-slate-600">
                            {lesson.teacherName ? lesson.teacherName : 'Atanmadı'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => handleOpenWhatsappModal(lesson, e)}
                                className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg cursor-pointer transition-colors"
                                title="WhatsApp Hatırlatması Gönder"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              {!isReadOnly && (
                                <>
                                  <button
                                    onClick={() => openEditModal(lesson)}
                                    className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer transition-colors"
                                    title="Dersi Düzenle"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(lesson.id); }}
                                    className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer transition-colors"
                                    title="Yönetimi Kaldır"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden divide-y divide-gray-150 bg-white">
                {filteredLessons.map(lesson => {
                  const dayLabel = DAYS_OF_WEEK.find(d => d.value === lesson.dayOfWeek)?.label || '';
                  const stylePreset = PASTEL_COLORS.find(c => c.id === lesson.color) || PASTEL_COLORS[0];
                  return (
                    <div key={lesson.id} className="p-4 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-905 text-slate-900 font-bold text-xs flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full inline-block ${stylePreset.bg.split(' ')[0]} border ${stylePreset.border}`} />
                          <span className="font-bold text-slate-900">{lesson.studentName}</span>
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono text-[10px]">
                          {lesson.startTime} - {lesson.endTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold gap-2">
                        <div>Ders Alanı: <span className="text-slate-850 text-slate-800 font-bold">{lesson.course}</span></div>
                        <div>Ders Günü: <span className="text-indigo-600 font-bold">{dayLabel}</span></div>
                      </div>

                      {lesson.teacherName && (
                        <div className="text-[11px] text-slate-500">
                          Eğitmen: <span className="text-slate-700 font-bold italic">{lesson.teacherName}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-dashed border-gray-100">
                        <button
                          onClick={(e) => handleOpenWhatsappModal(lesson, e)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Hatırlat</span>
                        </button>
                        {!isReadOnly && (
                          <>
                            <button
                              onClick={() => openEditModal(lesson)}
                              className="p-1.5 hover:bg-indigo-50 text-indigo-650 text-indigo-600 rounded-lg cursor-pointer transition-colors border border-indigo-100"
                              title="Dersi Düzenle"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(lesson.id); }}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer transition-colors border border-rose-100"
                              title="İptal Et/Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
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
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-gray-500 font-bold">Eğitmen (Öğretmen)</label>
                  {formStudentId && students.find(s => s.id === formStudentId)?.teacherName && (
                    <span className="text-[10px] text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded-sm">
                      ✓ Öğrencinin Eğitmeni
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    list="lesson-teachers-datalist"
                    value={formTeacherName}
                    onChange={(e) => setFormTeacherName(e.target.value)}
                    placeholder="Eğitmen seçin veya elle yazın..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10"
                  />
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
                  <datalist id="lesson-teachers-datalist">
                    {teachers.map(t => (
                      <option key={t.id} value={t.name}>{t.branch}</option>
                    ))}
                  </datalist>
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  {editingLesson && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDelete(editingLesson.id)}
                        className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 px-3 rounded-xl cursor-pointer transition-all text-[11px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> İptal Et
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditorOpen(false);
                          handleOpenWhatsappModal(editingLesson);
                        }}
                        className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2 px-3 rounded-xl cursor-pointer transition-all text-[11px]"
                        title="WhatsApp Hatırlatıcısı Gönder"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Gönder
                      </button>
                    </>
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

      {/* WhatsApp Reminder Modal */}
      {isWhatsappModalOpen && activeLessonForWhatsapp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="whatsapp-reminder-modal">
          <div className="bg-white rounded-2xl border border-gray-150 shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-150 bg-slate-50 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <span className="p-1 bg-emerald-100 text-emerald-700 rounded-lg inline-flex">
                    <MessageSquare className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">WhatsApp Ders Hatırlatması</h3>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Öğrenci, veli veya öğretmene ders detaylarını kolayca hatırlatın.
                </p>
              </div>
              <button 
                onClick={() => setIsWhatsappModalOpen(false)} 
                className="p-1 hover:bg-gray-200 text-gray-400 rounded-md cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              
              {/* Educational info message explaining safety & compliance with WhatsApp browser redirection protocols */}
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3 text-[11px] text-emerald-850 space-y-1">
                <span className="font-bold flex items-center gap-1 text-emerald-850">
                  <span className="text-sm">ℹ️</span> Otomatik Hazırlık Sistemi
                </span>
                <p className="leading-relaxed font-medium">
                  WhatsApp güvenlik ve gizlilik kuralları (anti-spam yasaları) gereği hiçbir web sitesi sizin adınıza arka planda gizlice doğrudan mesaj <span className="underline font-bold">gönderemez</span>. 
                  Sistemimiz telefon numarasını ve Türkçe özel şablonu saniyeler içinde hazırlar ve sizi WhatsApp'a yönlendirir. Açılan ekranda sadece <strong className="font-extrabold">"Gönder" (Send)</strong> butonuna basmanız yeterlidir!
                </p>
              </div>

              {/* Highlight summary of the class */}
              <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Hatırlatılacak Ders</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{activeLessonForWhatsapp.studentName}</p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {DAYS_OF_WEEK.find(d => d.value === activeLessonForWhatsapp.dayOfWeek)?.label} ({activeLessonForWhatsapp.startTime} - {activeLessonForWhatsapp.endTime})
                  </p>
                </div>
                <div className="bg-white px-2.5 py-1 rounded-lg border border-indigo-100/80 text-right text-[10px] font-bold text-indigo-700">
                  {activeLessonForWhatsapp.course}
                </div>
              </div>

              {/* Recipient Tabs */}
              <div>
                <label className="block text-gray-500 font-bold mb-1.5">Alıcı Seçimi</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleRecipientTypeChange('student')}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                      recipientType === 'student' 
                        ? 'bg-white text-indigo-700 shadow-2xs' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>Öğrenci</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRecipientTypeChange('parent')}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                      recipientType === 'parent' 
                        ? 'bg-white text-indigo-700 shadow-2xs' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 shrink-0" />
                    <span>Veli</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRecipientTypeChange('teacher')}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                      recipientType === 'teacher' 
                        ? 'bg-white text-indigo-700 shadow-2xs' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                    <span>Öğretmen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRecipientTypeChange('teacher_2h')}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                      recipientType === 'teacher_2h' 
                        ? 'bg-amber-500 text-white shadow-2xs font-extrabold' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span>Öğretmen (2s Kala)</span>
                  </button>
                </div>
              </div>

              {/* Phone input details */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-gray-500 font-bold">
                  <span>Alıcı Telefon Numarası</span>
                  {recipientType === 'parent' && (
                    <span className="text-[10px] text-indigo-600 font-semibold italic">
                      {students.find(s => s.id === activeLessonForWhatsapp.studentId)?.parentName 
                        ? `${students.find(s => s.id === activeLessonForWhatsapp.studentId)?.parentName} Telefonu` 
                        : 'Veli Girişi'}
                    </span>
                  )}
                  {(recipientType === 'teacher' || recipientType === 'teacher_2h') && (
                    <span className="text-[10px] text-amber-600 font-semibold italic">
                      Eğitmen: {activeLessonForWhatsapp.teacherName || 'Girilmedi'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="e.g. 555 123 4567"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/10 text-xs"
                  />
                  <Smartphone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
                {!customPhone && (
                  <p className="text-[10px] text-rose-500 font-semibold">
                    * Bu alıcı için kayıtlı bir telefon numarası bulunamadı! Lütfen elle bir numara giriniz.
                  </p>
                )}
              </div>

              {/* Message text area */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-gray-500 font-bold">Mesaj Detayı (Düzenleyebilirsiniz)</label>
                  <button 
                    onClick={handleCopyText}
                    className="text-[10px] font-bold text-gray-400 hover:text-slate-700 flex items-center gap-0.5 cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Kopyalandı!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Metni Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 font-medium leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-500/10 text-xs resize-y"
                  placeholder="Mesajınızı giriniz..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setIsWhatsappModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all"
                >
                  Kapat
                </button>
                <button
                  type="button"
                  onClick={handleLaunchWhatsapp}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-xs cursor-pointer transition-all hover:shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp ile Gönder</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
