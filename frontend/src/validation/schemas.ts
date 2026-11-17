import * as yup from 'yup';
import { codePointLength } from '@/lib/utils';
import { isNotFuture, isRealDate } from '@/lib/date';
import { SLOT_IDS, VALUE_MAX, VALUE_MIN } from '@/constants/slots';

const password = yup
  .string()
  .required('Enter your password')
  .test('pw-min', 'Use at least 8 characters', (v) => !v || codePointLength(v) >= 8)
  .test('pw-max', 'Use no more than 128 characters', (v) => !v || codePointLength(v) <= 128);

const email = yup
  .string()
  .transform((v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : v))
  .required('Enter your email')
  .email('Enter a valid email address')
  .max(255, 'Email must be 255 characters or fewer');

export const loginSchema = yup.object({ email, password });

export const signupSchema = yup.object({
  name: yup
    .string()
    .transform((v: unknown) => (typeof v === 'string' ? v.trim() : v))
    .required('Enter your name')
    .max(255, 'Name must be 255 characters or fewer'),
  email,
  password,
  role: yup.string().oneOf(['doctor', 'patient'] as const, 'Choose a role').required('Choose a role'),
});

export const valueSchema = yup
  .number()
  .typeError('Enter a reading in mg/dL')
  .required('Enter a reading in mg/dL')
  .integer('Use a whole number')
  .min(VALUE_MIN, `Readings start at ${VALUE_MIN} mg/dL`)
  .max(VALUE_MAX, `Readings go up to ${VALUE_MAX} mg/dL`);

export const readingSchema = yup.object({
  date: yup
    .string()
    .required('Choose a date')
    .test('real', 'Choose a real date', (v) => !v || isRealDate(v))
    .test('past', 'Date cannot be in the future', (v) => !v || !isRealDate(v) || isNotFuture(v)),
  slot: yup.string().oneOf(SLOT_IDS, 'Choose a time of day').required('Choose a time of day'),
  value: valueSchema,
});

export const editSchema = yup.object({ value: valueSchema });
