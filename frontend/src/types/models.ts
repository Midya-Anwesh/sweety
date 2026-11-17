export type Role = 'doctor' | 'patient';
export type Slot = 'morning_fasting' | 'after_breakfast' | 'after_lunch' | 'after_dinner';
export type ReportType = 'daily' | 'month-to-date' | 'monthly';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Reading {
  id: string;
  userId: string;
  date: string;
  slot: Slot;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  type: ReportType;
  selectedDate: string;
  from: string;
  to: string;
  count: number;
  highest: number | null;
  lowest: number | null;
  average: number | null;
  message: string | null;
  readings?: Reading[];
}
