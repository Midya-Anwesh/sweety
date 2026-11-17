import type { Reading, Role, Slot, User } from './models';

export interface RegisterPayload { name: string; email: string; password: string; role: Role }
export interface LoginPayload { email: string; password: string }
export interface LoginResponse { token: string; tokenType: string; expiresIn: string; user: User }
export interface UserResponse { user: User }
export interface ReadingsResponse { readings: Reading[] }
export interface ReadingResponse { reading: Reading }
export interface CreateReadingPayload { date: string; slot: Slot; value: number }
export interface ApiErrorBody { message?: string; errors?: { field: string; message: string }[] }
