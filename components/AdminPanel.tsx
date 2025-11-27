import React, { useState, useEffect } from 'react';
import { ScheduleItem, DAYS_OF_WEEK, MORNING_SLOTS, AFTERNOON_SLOTS, FIXED_MORNING_CLASSES, FIXED_AFTERNOON_CLASSES } from '../types';
import { updateSchedule, subscribeToRegistry, updateRegistry, RegistryItem } from '../services/firebaseConfig';
import { Eraser, Sun, Moon, X, Clock, Calendar, Filter, ChevronRight, CheckCircle, Database, Plus, Trash2, Save, Users, ChevronRight as ArrowIcon, AlertTriangle } from 'lucide-react';

interface AdminPanelProps {
  schedule: ScheduleItem[];
  setSchedule: (schedule: ScheduleItem[]) => void;
  onClose: () => void;
}

type Shift = 'MORNING' | 'AFTERNOON';

export const AdminPanel: React.FC<AdminPanelProps> = ({ schedule, setSchedule, onClose }) => {
  const [selectedDay, setSelectedDay] = useState<number>(1); // Default: Segunda-feira
  
  // Set default shift based on 12:30 PM threshold
  const [selectedShift, setSelectedShift] = useState<Shift>(() => {
    const now = new Date();
    const isAfternoon = now.getHours() > 12 || (now.getHours() === 12 && now.getMinutes() >= 30);
    return isAfternoon ? 'AFTERNOON' : 'MORNING';
  });

  const [selectedClass, setSelectedClass] = useState<string>(""); 

  // -- Registry State (Cadastros Vinculados) --
  const [showRegistryModal, setShowRegistryModal] = useState(false);
  const [registry, setRegistry] = useState<RegistryItem[]>([]); // Start empty, load from Firebase

  // Estados do Modal de Cadastro
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [newTeacherInput, setNewTeacherInput] = useState("");

  // Estado para destaque visual de conflito
  const [highlightedConflictId, setHighlightedConflictId] = useState<string | null>(null);

  // Subscribe to Registry on mount
  useEffect(() => {
    const unsubscribe = subscribeToRegistry((data) => {
        setRegistry(data);
    });
    return () => unsubscribe();
  }, []);

  // Seleciona automaticamente a primeira turma da lista ao trocar de turno
  useEffect(() => {
    const defaultClass = selectedShift === 'MORNING' ? FIXED_MORNING_CLASSES[0] : FIXED_AFTERNOON_CLASSES[0];
    setSelectedClass(defaultClass);
  }, [selectedShift]);

  // -- Registry Handlers (Saving to Firebase) --

  const handleSaveRegistry = (newRegistry: RegistryItem[]) => {
    // Update local for speed (optional if subscription is fast)
    setRegistry(newRegistry); 
    // Save to DB
    updateRegistry(newRegistry);
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = newSubjectInput.trim();
    if (normalizedName && !registry.some(r => r.subject.toLowerCase() === normalizedName.toLowerCase())) {
        const newRegistry = [...registry, { subject: normalizedName, teachers: [] }].sort((a,b) => a.subject.localeCompare(b.subject));
        handleSaveRegistry(newRegistry);
        setNewSubjectInput("");
        setEditingSubject(normalizedName);
    }
  };

  const handleRemoveSubject = (subjectName: string) => {
    const newRegistry = registry.filter(r => r.subject !== subjectName);
    handleSaveRegistry(newRegistry);
    if (editingSubject === subjectName) setEditingSubject(null);
  };

  const handleAddTeacherToSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !newTeacherInput.trim()) return;

    const teacherName = newTeacherInput.trim();
    const newRegistry = registry.map(item => {
        if (item.subject === editingSubject && !item.teachers.includes(teacherName)) {
            return { ...item, teachers: [...item.teachers, teacherName].sort() };
        }
        return item;
    });
    handleSaveRegistry(newRegistry);
    setNewTeacherInput("");
  };

  const handleRemoveTeacherFromSubject = (subjectName: string, teacherName: string) => {
    const newRegistry = registry.map(item => {
        if (item.subject === subjectName) {
            return { ...item, teachers: item.teachers.filter(t => t !== teacherName) };
        }
        return item;
    });
    handleSaveRegistry(newRegistry);
  };

  // -- Schedule Handlers (Saving to Firebase) --

  const handleSaveSchedule = (newSchedule: ScheduleItem[]) => {
    setSchedule(newSchedule); // Local update
    updateSchedule(newSchedule); // Firebase update
  };

  // Helper to check for conflicts
  const checkTeacherConflict = (day: number, start: string, teacherToCheck: string, excludeSlotId: string) => {
    return schedule.find(s => 
        s.dayOfWeek === day &&
        s.startTime === start &&
        s.teacherName === teacherToCheck &&
        s.id !== excludeSlotId &&
        !s.isBreak
    );
  };

  const triggerConflictAlert = (id: string, teacher: string, conflictingClass: string, time: string) => {
    setHighlightedConflictId(id);
    setTimeout(() => setHighlightedConflictId(null), 3000);
    
    setTimeout(() => {
        alert(
            `⛔ CONFLITO DE HORÁRIO DETECTADO!\n\n` +
            `O(A) professor(a) "${teacher}" NÃO pode ser alocado(a) aqui.\n` +
            `MOTIVO: Já está dando aula na turma "${conflictingClass}" neste horário (${time}).`
        );
    }, 50);
  };

  const updateItem = (id: string, field: keyof ScheduleItem, value: any) => {
    const currentItem = schedule.find(i => i.id === id);
    if (!currentItem) return;

    // --- CONFLICT VALIDATION ---
    
    // 1. Validate Manual Teacher Selection
    if (field === 'teacherName' && value) {
        const conflict = checkTeacherConflict(currentItem.dayOfWeek, currentItem.startTime, value, id);
        if (conflict) {
            triggerConflictAlert(id, value, conflict.className, conflict.startTime);
            return;
        }
    }

    // 2. Validate Subject Selection (due to Auto-fill)
    let autoTeacherName = '';
    let shouldAutoFill = false;

    if (field === 'subject') {
        const registryEntry = registry.find(r => r.subject.toLowerCase() === String(value).toLowerCase());
        
        if (registryEntry && registryEntry.teachers.length === 1) {
            autoTeacherName = registryEntry.teachers[0];
            shouldAutoFill = true;

            const conflict = checkTeacherConflict(currentItem.dayOfWeek, currentItem.startTime, autoTeacherName, id);
            if (conflict) {
                triggerConflictAlert(id, autoTeacherName, conflict.className, conflict.startTime);
                return;
            }
        }
    }

    // --- APPLY UPDATES ---

    const updatedSchedule = schedule.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };

        if (field === 'subject') {
            if (shouldAutoFill) {
                newItem.teacherName = autoTeacherName;
            }
        }
        return newItem;
      }
      return item;
    });
    
    handleSaveSchedule(updatedSchedule);
  };

  const handleClearSlot = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const updatedSchedule = schedule.map(item => 
        item.id === id ? { ...item, subject: '', teacherName: '' } : item
    );
    handleSaveSchedule(updatedSchedule);
  };

  const handleInitializeClassSchedule = () => {
    if (!selectedClass) return;

    const slotsToAdd = selectedShift === 'MORNING' ? MORNING_SLOTS : AFTERNOON_SLOTS;
    
    const existingSlots = schedule.filter(
        s => s.dayOfWeek === selectedDay && s.className === selectedClass
    );

    if (existingSlots.length > 0) {
        alert("Já existem horários para esta turma neste dia.");
        return;
    }

    const newItems: ScheduleItem[] = slotsToAdd.map(slot => ({
        id: crypto.randomUUID(),
        dayOfWeek: selectedDay,
        startTime: slot.start,
        endTime: slot.end,
        periodName: slot.name,
        className: selectedClass,
        subject: slot.isBreak ? 'INTERVALO' : '',
        teacherName: slot.isBreak ? '-' : '',
        isBreak: slot.isBreak
    }));

    handleSaveSchedule([...schedule, ...newItems]);
  };

  const visibleClasses = selectedShift === 'MORNING' ? FIXED_MORNING_CLASSES : FIXED_AFTERNOON_CLASSES;

  const filteredSchedule = schedule
    .filter(item => {
        return item.dayOfWeek === selectedDay && item.className === selectedClass;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const allTeachers = Array.from(new Set(registry.flatMap(r => r.teachers))).sort();

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-[95vw] h-[95vh] rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center bg-slate-800 gap-4 shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-red-600/20 rounded-lg">
                <Calendar className="text-red-500" size={24} />
             </div>
             <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Grade Horária</h2>
                <p className="text-slate-400 text-xs md:text-sm">Edição de turmas fixas.</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
                onClick={() => setShowRegistryModal(true)}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium border border-slate-600 shadow-sm"
            >
                <Database size={16} className="text-blue-400" />
                Cadastros (Prof/Disc)
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
          </div>
        </div>

        {/* Controls: Day & Shift */}
        <div className="flex flex-col border-b border-slate-700 bg-slate-900 shrink-0">
            {/* Shift Tabs */}
            <div className="flex w-full">
                <button 
                    onClick={() => setSelectedShift('MORNING')}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${selectedShift === 'MORNING' ? 'bg-yellow-500/10 text-yellow-500 border-b-2 border-yellow-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Sun size={20} />
                    MANHÃ (EFAF)
                </button>
                <button 
                    onClick={() => setSelectedShift('AFTERNOON')}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${selectedShift === 'AFTERNOON' ? 'bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Moon size={20} />
                    TARDE (MÉDIO)
                </button>
            </div>

            {/* Day Tabs */}
            <div className="flex overflow-x-auto bg-slate-900/50 scrollbar-hide border-t border-slate-800">
                {DAYS_OF_WEEK.map((day, idx) => (
                    <button
                        key={idx}
                        onClick={() => setSelectedDay(idx + 1)}
                        className={`px-6 py-3 whitespace-nowrap text-sm font-semibold tracking-wider transition-colors border-b-2 ${
                            selectedDay === idx + 1
                            ? 'border-red-500 text-white bg-slate-800' 
                            : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                        }`}
                    >
                        {day.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>

        {/* Main Content: Sidebar + Table */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-slate-900">
            
            {/* Class Sidebar */}
            <div className="w-full md:w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-800/50 flex items-center gap-2 text-slate-400 text-xs uppercase font-bold tracking-wider bg-slate-800/20">
                    <Filter size={14} />
                    Turmas
                </div>
                <div className="flex-1 overflow-y-auto">
                    {visibleClasses.map(cls => (
                        <button
                            key={cls}
                            onClick={() => setSelectedClass(cls)}
                            className={`w-full text-left px-5 py-4 border-b border-slate-800/50 transition-all text-sm font-medium flex items-center justify-between group ${selectedClass === cls ? 'bg-slate-800 text-white border-l-4 border-l-red-500 pl-4' : 'text-slate-500 hover:bg-slate-800/30 hover:text-slate-300 border-l-4 border-l-transparent'}`}
                        >
                            <span>{cls}</span>
                            {selectedClass === cls && <ChevronRight size={14} className="text-red-500" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-slate-900 relative">
                
                {/* Global list for subjects only */}
                <datalist id="all-subjects-list">
                    {registry.map(r => <option key={r.subject} value={r.subject} />)}
                </datalist>

                {filteredSchedule.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500 space-y-6">
                        <Clock size={48} className="text-slate-700" />
                        <div className="text-center">
                            <p className="text-lg text-slate-300 font-medium mb-2">
                                Grade Vazia para {selectedClass}
                            </p>
                            <p className="text-sm text-slate-500 mb-6">
                                em {DAYS_OF_WEEK[selectedDay - 1]}
                            </p>
                            <button 
                                onClick={handleInitializeClassSchedule}
                                className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-red-900/20 mx-auto"
                            >
                                <CheckCircle size={20} />
                                Inicializar Horários Padrão
                            </button>
                        </div>
                     </div>
                ) : (
                    <table className="w-full text-left border-collapse relative">
                        <thead className="bg-slate-800/90 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-32 border-b border-slate-700">Período</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-24 border-b border-slate-700">Horário</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">Disciplina</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">Professor</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-16 border-b border-slate-700 text-center">Limpar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredSchedule.map((item) => {
                                const registryEntry = registry.find(r => r.subject.toLowerCase() === item.subject.toLowerCase());
                                const availableTeachers = registryEntry ? registryEntry.teachers : allTeachers;
                                const isConflict = highlightedConflictId === item.id;

                                return (
                                <tr key={item.id} className={`group hover:bg-slate-800/30 transition-all duration-300 ${item.isBreak ? 'bg-slate-800/40' : ''} ${isConflict ? 'bg-red-900/50 border-y-2 border-red-500 animate-pulse' : ''}`}>
                                    <td className="p-4 text-slate-400 text-sm font-medium relative">
                                        {isConflict && <AlertTriangle className="absolute left-1 top-1/2 -translate-y-1/2 text-red-500" size={16} />}
                                        <span className={isConflict ? "ml-4 text-red-300 font-bold" : ""}>{item.periodName}</span>
                                    </td>
                                    <td className="p-4 text-slate-500 font-mono text-sm">
                                        {item.startTime} - {item.endTime}
                                    </td>
                                    <td className="p-2">
                                        <input 
                                            type="text" 
                                            list="all-subjects-list"
                                            value={item.subject} 
                                            onChange={(e) => updateItem(item.id, 'subject', e.target.value)}
                                            disabled={item.isBreak}
                                            className={`w-full bg-transparent border border-transparent ${!item.isBreak ? 'hover:border-slate-600 focus:border-blue-500 focus:bg-slate-800' : 'opacity-50 cursor-not-allowed italic'} focus:ring-1 focus:ring-blue-500 rounded px-2 py-2 text-white transition-all`}
                                            placeholder={item.isBreak ? "Intervalo" : "---"}
                                        />
                                    </td>
                                    <td className="p-2 relative">
                                        <datalist id={`teachers-for-${item.id}`}>
                                            {availableTeachers.map(t => <option key={t} value={t} />)}
                                        </datalist>

                                        <input 
                                            type="text"
                                            list={`teachers-for-${item.id}`}
                                            value={item.teacherName} 
                                            onChange={(e) => updateItem(item.id, 'teacherName', e.target.value)}
                                            disabled={item.isBreak}
                                            className={`w-full bg-transparent border border-transparent ${!item.isBreak ? 'hover:border-slate-600 focus:border-blue-500 focus:bg-slate-800' : 'opacity-50 cursor-not-allowed'} focus:ring-1 focus:ring-blue-500 rounded px-2 py-2 text-slate-300 transition-all ${isConflict ? 'text-red-300 font-bold' : ''}`}
                                            placeholder={item.isBreak ? "-" : "---"}
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        {!item.isBreak && (
                                            <button 
                                                type="button"
                                                onClick={(e) => handleClearSlot(e, item.id)}
                                                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors active:scale-95"
                                                title="Limpar campos"
                                            >
                                                <Eraser size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                )}
            </div>
        </div>

        {/* Registry Modal Overlay */}
        {showRegistryModal && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col h-[80vh]">
                    <div className="flex justify-between items-center p-6 border-b border-slate-800">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Database className="text-blue-500" size={20} />
                                Gerenciar Cadastros Vinculados
                            </h3>
                            <p className="text-slate-400 text-xs mt-1">Crie disciplinas e adicione professores específicos para cada uma.</p>
                        </div>
                        <button onClick={() => setShowRegistryModal(false)} className="text-slate-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800">
                        
                        {/* Left Column: Subjects */}
                        <div className="w-full md:w-1/3 flex flex-col bg-slate-900/50">
                            <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">1. Disciplinas</h4>
                                <form onSubmit={handleAddSubject} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newSubjectInput}
                                        onChange={(e) => setNewSubjectInput(e.target.value)}
                                        placeholder="Nova disciplina..."
                                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                    />
                                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded transition-colors" title="Adicionar">
                                        <Plus size={18} />
                                    </button>
                                </form>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {registry.map(r => (
                                    <div 
                                        key={r.subject} 
                                        onClick={() => setEditingSubject(r.subject)}
                                        className={`flex justify-between items-center px-4 py-3 rounded cursor-pointer transition-all border border-transparent ${editingSubject === r.subject ? 'bg-blue-600/20 border-blue-600/50 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                                    >
                                        <span className="font-medium">{r.subject}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 font-mono">
                                                {r.teachers.length} profs
                                            </span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleRemoveSubject(r.subject); }}
                                                className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-red-500/10"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {registry.length === 0 && <p className="text-slate-600 text-xs text-center py-8">Nenhuma disciplina cadastrada.</p>}
                            </div>
                        </div>

                        {/* Right Column: Teachers for Selected Subject */}
                        <div className="flex-1 flex flex-col bg-slate-900 relative">
                            {!editingSubject ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-50">
                                    <ArrowIcon size={48} className="mb-2" />
                                    <p className="text-sm">Selecione uma disciplina ao lado</p>
                                    <p className="text-sm">para gerenciar seus professores.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">2. Professores de <span className="text-blue-400">{editingSubject}</span></h4>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 border-b border-slate-800">
                                        <form onSubmit={handleAddTeacherToSubject} className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Users size={16} className="absolute left-3 top-2.5 text-slate-500" />
                                                <input 
                                                    type="text" 
                                                    value={newTeacherInput}
                                                    onChange={(e) => setNewTeacherInput(e.target.value)}
                                                    placeholder={`Nome do professor de ${editingSubject}...`}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                                                    autoFocus
                                                />
                                            </div>
                                            <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-4 rounded font-medium text-sm transition-colors">
                                                Adicionar
                                            </button>
                                        </form>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {registry.find(r => r.subject === editingSubject)?.teachers.map(teacher => (
                                                <div key={teacher} className="flex justify-between items-center bg-slate-800 px-4 py-3 rounded border border-slate-700/50 group">
                                                    <span className="text-slate-200 text-sm">{teacher}</span>
                                                    <button 
                                                        onClick={() => handleRemoveTeacherFromSubject(editingSubject, teacher)}
                                                        className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        {registry.find(r => r.subject === editingSubject)?.teachers.length === 0 && (
                                            <p className="text-slate-500 text-xs text-center py-10 italic">
                                                Nenhum professor vinculado a {editingSubject} ainda.
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="p-4 bg-slate-800 border-t border-slate-700 text-center shrink-0">
                        <button onClick={() => setShowRegistryModal(false)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 mx-auto shadow-lg shadow-blue-900/20">
                            <Save size={18} />
                            Concluir Edição
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};