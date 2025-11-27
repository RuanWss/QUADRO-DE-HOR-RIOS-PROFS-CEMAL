export interface ScheduleItem {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // Format "HH:mm"
  endTime: string;   // Format "HH:mm"
  periodName: string; // e.g., "1º Horário"
  className: string;  // e.g., "Turma 9A"
  subject: string;    // e.g., "Matemática"
  teacherName: string; // e.g., "Prof. Silva"
  isBreak?: boolean; // New optional flag for intervals
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  ADMIN = 'ADMIN'
}

export const DAYS_OF_WEEK = [
  'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
];

export const MORNING_SLOTS = [
  { start: '07:20', end: '08:10', name: '1º Horário' },
  { start: '08:10', end: '09:00', name: '2º Horário' },
  { start: '09:00', end: '09:20', name: 'Intervalo', isBreak: true },
  { start: '09:20', end: '10:10', name: '3º Horário' },
  { start: '10:10', end: '11:00', name: '4º Horário' },
  { start: '11:00', end: '12:00', name: '5º Horário' },
];

export const AFTERNOON_SLOTS = [
  { start: '13:00', end: '13:50', name: '1º Horário' },
  { start: '13:50', end: '14:40', name: '2º Horário' },
  { start: '14:40', end: '15:30', name: '3º Horário' },
  { start: '15:30', end: '16:00', name: 'Intervalo', isBreak: true },
  { start: '16:00', end: '16:50', name: '4º Horário' },
  { start: '16:50', end: '17:40', name: '5º Horário' },
  { start: '17:40', end: '18:30', name: '6º Horário' },
  { start: '18:30', end: '19:20', name: '7º Horário' },
  { start: '19:20', end: '20:00', name: '8º Horário' },
];

export const FIXED_MORNING_CLASSES = ['6º EFAF', '7º EFAF', '8º EFAF', '9º EFAF'];
export const FIXED_AFTERNOON_CLASSES = ['1ª Série EM', '2ª Série EM', '3ª Série EM'];