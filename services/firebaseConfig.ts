import { ScheduleItem } from '../types';

// CHAVES DE ARMAZENAMENTO LOCAL
const SCHEDULE_KEY = 'school_schedule_local_v1';
const REGISTRY_KEY = 'school_registry_local_v1';

// Evento customizado para sincronizar abas e componentes
const dispatchUpdate = () => {
  window.dispatchEvent(new Event('local-storage-update'));
};

// --- SIMULAÇÃO DE ASSINATURA (LOCAL STORAGE) ---

export const subscribeToSchedule = (callback: (data: ScheduleItem[]) => void) => {
  const loadData = () => {
    try {
        const raw = localStorage.getItem(SCHEDULE_KEY);
        const data = raw ? JSON.parse(raw) : [];
        callback(data);
    } catch (e) {
        console.error("Erro ao ler LocalStorage:", e);
        callback([]);
    }
  };
  
  // Carregar imediatamente
  loadData();

  // Ouvir mudanças
  window.addEventListener('local-storage-update', loadData);
  window.addEventListener('storage', loadData); // Sincroniza entre abas

  return () => {
    window.removeEventListener('local-storage-update', loadData);
    window.removeEventListener('storage', loadData);
  };
};

export const updateSchedule = (newSchedule: ScheduleItem[]) => {
  try {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(newSchedule));
    dispatchUpdate();
  } catch (e) {
    console.error("Erro ao salvar no LocalStorage:", e);
    alert("Erro ao salvar dados localmente. O armazenamento pode estar cheio.");
  }
};

// --- SERVIÇOS DE CADASTROS (REGISTRY) ---

export interface RegistryItem {
    subject: string;
    teachers: string[];
}

export const subscribeToRegistry = (callback: (data: RegistryItem[]) => void) => {
  const loadData = () => {
    try {
        const raw = localStorage.getItem(REGISTRY_KEY);
        const data = raw ? JSON.parse(raw) : [];
        callback(data);
    } catch (e) {
        console.error("Erro ao ler registros locais:", e);
        callback([]);
    }
  };

  loadData();
  window.addEventListener('local-storage-update', loadData);
  window.addEventListener('storage', loadData);

  return () => {
    window.removeEventListener('local-storage-update', loadData);
    window.removeEventListener('storage', loadData);
  };
};

export const updateRegistry = (newRegistry: RegistryItem[]) => {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(newRegistry));
    dispatchUpdate();
  } catch (e) {
    console.error("Erro ao salvar registro local:", e);
  }
};

// --- STATUS MOCK (Sempre Online pois é local) ---

export const subscribeToConnectionStatus = (callback: (isConnected: boolean) => void) => {
  callback(true);
  return () => {};
};

export const initFirebaseManually = () => false;
