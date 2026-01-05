
import { AppState, User, UserRole, LogbookTemplate, LogbookEntry, AuditRecord, LogbookStatus, ColumnType } from '../types';

const STORAGE_KEY = 'pharma_track_v1_standalone';

const INITIAL_STATE: AppState = {
  currentUser: null,
  users: [
    { id: 'u1', username: 'admin', role: UserRole.ADMIN, fullName: 'System Administrator', createdAt: new Date().toISOString() },
    { id: 'u2', username: 'operator', role: UserRole.USER, fullName: 'Senior Technician', createdAt: new Date().toISOString() }
  ],
  logbooks: [],
  entries: [],
  auditLogs: [
    {
      id: 'audit_init',
      entityType: 'SYSTEM',
      entityId: 'root',
      action: 'CREATE',
      oldValue: null,
      newValue: 'System Initialized',
      userId: 'system',
      username: 'SYSTEM',
      timestamp: new Date().toISOString(),
      reason: 'Initial system provisioning'
    }
  ]
};

// Utility to load/save state to localStorage
const loadState = (): AppState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return INITIAL_STATE;
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_STATE;
  }
};

const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  getState: async (): Promise<AppState> => {
    await delay(400); // Simulate network latency
    const state = loadState();
    const currentUserStr = localStorage.getItem('pharma_user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    return { ...state, currentUser };
  },

  getUsers: async (): Promise<User[]> => {
    const state = loadState();
    return state.users;
  },

  login: async (username: string): Promise<User | null> => {
    await delay(600);
    const state = loadState();
    const user = state.users.find(u => u.username === username);
    if (user) {
      localStorage.setItem('pharma_user', JSON.stringify(user));
      
      // Audit Login
      const audit: AuditRecord = {
        id: `audit_${Date.now()}`,
        entityType: 'USER',
        entityId: user.id,
        action: 'LOGIN',
        oldValue: null,
        newValue: `User ${user.username} logged in`,
        userId: user.id,
        username: user.username,
        timestamp: new Date().toISOString(),
        reason: 'User authentication'
      };
      state.auditLogs.unshift(audit);
      saveState(state);
      
      return user;
    }
    return null;
  },

  logout: async () => {
    localStorage.removeItem('pharma_user');
  },

  saveUser: async (userData: Partial<User>, reason: string): Promise<User> => {
    await delay(500);
    const state = loadState();
    const currentUserStr = localStorage.getItem('pharma_user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : { id: 'anon', username: 'anonymous' };

    const newUser: User = {
      id: `u_${Date.now()}`,
      username: userData.username || 'unknown',
      fullName: userData.fullName || 'New User',
      role: userData.role || UserRole.USER,
      createdAt: new Date().toISOString()
    };

    state.users.push(newUser);
    
    // Audit Creation
    const audit: AuditRecord = {
      id: `audit_${Date.now()}`,
      entityType: 'USER',
      entityId: newUser.id,
      action: 'CREATE',
      oldValue: null,
      newValue: newUser,
      userId: currentUser.id,
      username: currentUser.username,
      timestamp: new Date().toISOString(),
      reason
    };
    state.auditLogs.unshift(audit);
    
    saveState(state);
    return newUser;
  },

  saveLogbook: async (template: Partial<LogbookTemplate>, reason: string): Promise<LogbookTemplate> => {
    await delay(800);
    const state = loadState();
    const currentUserStr = localStorage.getItem('pharma_user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : { id: 'anon', username: 'anonymous' };

    let resultTemplate: LogbookTemplate;

    if (template.id) {
      const idx = state.logbooks.findIndex(l => l.id === template.id);
      const oldVal = { ...state.logbooks[idx] };
      state.logbooks[idx] = { ...state.logbooks[idx], ...template } as LogbookTemplate;
      resultTemplate = state.logbooks[idx];
      
      state.auditLogs.unshift({
        id: `audit_${Date.now()}`,
        entityType: 'LOGBOOK_TEMPLATE',
        entityId: template.id,
        action: 'UPDATE',
        oldValue: oldVal,
        newValue: resultTemplate,
        userId: currentUser.id,
        username: currentUser.username,
        timestamp: new Date().toISOString(),
        reason
      });
    } else {
      resultTemplate = {
        ...template,
        id: `lb_${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.username,
        status: template.status || LogbookStatus.ACTIVE
      } as LogbookTemplate;
      
      state.logbooks.push(resultTemplate);
      
      state.auditLogs.unshift({
        id: `audit_${Date.now()}`,
        entityType: 'LOGBOOK_TEMPLATE',
        entityId: resultTemplate.id,
        action: 'CREATE',
        oldValue: null,
        newValue: resultTemplate,
        userId: currentUser.id,
        username: currentUser.username,
        timestamp: new Date().toISOString(),
        reason
      });
    }

    saveState(state);
    return resultTemplate;
  },

  saveEntry: async (entry: Partial<LogbookEntry>, reason: string): Promise<LogbookEntry> => {
    await delay(1000);
    const state = loadState();
    const currentUserStr = localStorage.getItem('pharma_user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : { id: 'anon', username: 'anonymous' };

    const newEntry: LogbookEntry = {
      id: `ent_${Date.now()}`,
      logbookId: entry.logbookId || '',
      values: entry.values || {},
      createdAt: new Date().toISOString(),
      createdBy: currentUser.fullName,
      status: 'SUBMITTED',
      reason
    };

    state.entries.unshift(newEntry);
    
    state.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      entityType: 'LOGBOOK_ENTRY',
      entityId: newEntry.id,
      action: 'CREATE',
      oldValue: null,
      newValue: newEntry,
      userId: currentUser.id,
      username: currentUser.username,
      timestamp: new Date().toISOString(),
      reason
    });

    saveState(state);
    return newEntry;
  }
};
