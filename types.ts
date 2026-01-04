
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum ColumnType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  TIME = 'TIME',
  DATETIME = 'DATETIME',
  DROPDOWN = 'DROPDOWN',
  BOOLEAN = 'BOOLEAN'
}

export enum LogbookStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  createdAt?: string;
}

export interface LogbookColumn {
  id: string;
  label: string;
  key: string;
  type: ColumnType;
  isMandatory: boolean;
  options?: string[]; // For DROPDOWN
  displayOrder: number;
  isSystemManaged?: boolean; // New: indicates a field that cannot be edited or deleted
}

export interface LogbookTemplate {
  id: string;
  name: string;
  description: string;
  status: LogbookStatus;
  columns: LogbookColumn[];
  createdAt: string;
  createdBy: string;
}

export interface LogbookEntry {
  id: string;
  logbookId: string;
  values: Record<string, any>;
  createdAt: string;
  createdBy: string;
  status: 'SUBMITTED' | 'SIGNED' | 'DELETED';
  reason?: string; // Reason for change/creation
}

export interface AuditRecord {
  id: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW_REPORT' | 'LOGIN';
  oldValue: any;
  newValue: any;
  userId: string;
  username: string;
  timestamp: string;
  reason: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  logbooks: LogbookTemplate[];
  entries: LogbookEntry[];
  auditLogs: AuditRecord[];
}
