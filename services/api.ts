
import { AppState, User, UserRole, LogbookTemplate, LogbookEntry, AuditRecord, LogbookStatus } from '../types';

const STORAGE_KEY = 'pharma_track_v1';
const NETWORK_DELAY = 600;

const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));

const INITIAL_STATE: AppState = {
  currentUser: null,
  logbooks: [],
  entries: [],
  auditLogs: []
};

// Mock Users
export const MOCK_USERS: User[] = [
  { id: 'u1', username: 'admin', role: UserRole.ADMIN, fullName: 'System Administrator' },
  { id: 'u2', username: 'jdoe', role: UserRole.USER, fullName: 'John Doe (Analyst)' }
];

export const api = {
  private_getState: (): AppState => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_STATE;
  },

  private_saveState: (state: AppState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  getState: async (): Promise<AppState> => {
    await simulateNetworkDelay();
    return api.private_getState();
  },

  createAudit: async (
    action: AuditRecord['action'],
    entityType: string,
    entityId: string,
    oldValue: any,
    newValue: any,
    reason: string
  ) => {
    const state = api.private_getState();
    const user = state.currentUser;
    if (!user) return;

    const newAudit: AuditRecord = {
      id: `audit_${Date.now()}`,
      entityType,
      entityId,
      action,
      oldValue,
      newValue,
      userId: user.id,
      username: user.username,
      timestamp: new Date().toISOString(),
      reason
    };

    state.auditLogs.unshift(newAudit);
    api.private_saveState(state);
  },

  login: async (username: string): Promise<User | null> => {
    await simulateNetworkDelay();
    const user = MOCK_USERS.find(u => u.username === username);
    if (user) {
      const state = api.private_getState();
      state.currentUser = user;
      api.private_saveState(state);
      await api.createAudit('LOGIN', 'USER', user.id, null, { username }, 'Standard Login');
      return user;
    }
    return null;
  },

  logout: async () => {
    await simulateNetworkDelay();
    const state = api.private_getState();
    state.currentUser = null;
    api.private_saveState(state);
  },

  saveLogbook: async (template: Partial<LogbookTemplate>, reason: string): Promise<LogbookTemplate> => {
    await simulateNetworkDelay();
    const state = api.private_getState();
    const isNew = !template.id;
    const id = template.id || `lb_${Date.now()}`;
    const user = state.currentUser!;

    const newTemplate: LogbookTemplate = {
      id,
      name: template.name || 'New Logbook',
      description: template.description || '',
      status: template.status || LogbookStatus.DRAFT,
      columns: template.columns || [],
      createdAt: template.createdAt || new Date().toISOString(),
      createdBy: user.username
    };

    let oldValue = null;
    if (isNew) {
      state.logbooks.push(newTemplate);
    } else {
      const index = state.logbooks.findIndex(l => l.id === id);
      oldValue = { ...state.logbooks[index] };
      state.logbooks[index] = newTemplate;
    }

    api.private_saveState(state);
    await api.createAudit(isNew ? 'CREATE' : 'UPDATE', 'LOGBOOK_TEMPLATE', id, oldValue, newTemplate, reason);
    return newTemplate;
  },

  saveEntry: async (entry: Partial<LogbookEntry>, reason: string): Promise<LogbookEntry> => {
    await simulateNetworkDelay();
    const state = api.private_getState();
    const isNew = !entry.id;
    const id = entry.id || `ent_${Date.now()}`;
    const user = state.currentUser!;

    const newEntry: LogbookEntry = {
      id,
      logbookId: entry.logbookId!,
      values: entry.values || {},
      status: entry.status || 'SUBMITTED',
      createdAt: entry.createdAt || new Date().toISOString(),
      createdBy: user.username,
      reason
    };

    let oldValue = null;
    if (isNew) {
      state.entries.push(newEntry);
    } else {
      const index = state.entries.findIndex(e => e.id === id);
      oldValue = { ...state.entries[index] };
      state.entries[index] = newEntry;
    }

    api.private_saveState(state);
    await api.createAudit(isNew ? 'CREATE' : 'UPDATE', 'ENTRY', id, oldValue, newEntry, reason);
    return newEntry;
  }
};
