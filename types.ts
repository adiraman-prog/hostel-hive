// types.ts

export type View = 'dashboard' | 'hostels' | 'tenants' | 'reports' | 'payments' | 'record-payment' | 'vacancy' | 'audit';

export interface AuditLog {
  id: string;
  user: string; // User's email
  action: string;
  timestamp: string; // ISO string
}

export interface ReportHistoryItem {
  id: string;
  user: string;
  query: string;
  report: string;
  timestamp: string;
}

interface Auditable {
  lastModifiedBy: string; // User's email
  lastModifiedAt: string; // ISO string
}

export interface Room extends Auditable {
  id: string;
  roomNumber: string;
  capacity: number;
  tenantIds: string[];
  hostelId: string;
  floorId: string;
}

export interface Floor extends Auditable {
  id: string;
  floorNumber: number;
  rooms: { [id: string]: Room };
  hostelId: string;
}

export interface Hostel extends Auditable {
  id: string;
  name: string;
  address: string;
  floors: { [id: string]: Floor };
}

export interface Tenant extends Auditable {
  id: string;
  name: string;
  phone: string;
  email: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate?: string; // YYYY-MM-DD
  rentAmount: number;
  securityDeposit: number;
  status: 'Active' | 'Inactive';
  hostelId: string;
  floorId: string;
  roomId: string;
  nativeAddress: string;
  aadharId: string;
}

export interface Payment extends Auditable {
  id: string;
  tenantId: string;
  amount: number;
  month: number; // 1-12
  year: number;
  date: string; // YYYY-MM-DD
  status: 'Paid' | 'Partially Paid';
  notes?: string;
}

export interface AppData {
  hostels: { [id: string]: Hostel };
  tenants: { [id: string]: Tenant };
  payments: { [id: string]: Payment };
  auditLogs: AuditLog[];
  reportHistory?: { [id: string]: ReportHistoryItem };
}