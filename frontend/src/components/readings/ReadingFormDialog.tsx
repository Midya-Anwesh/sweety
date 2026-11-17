import { useEffect, useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Modal } from '@/components/common/Modal';
import { Field } from '@/components/common/Field';
import { Notice, SlowNotice } from '@/components/common/Notice';
import { SLOTS, UNIT, VALUE_MAX, VALUE_MIN } from '@/constants/slots';
import { readingSchema } from '@/validation/schemas';
import { todayInAppTz } from '@/lib/date';
import { usedSlotsFor } from '@/lib/readings';
import { describeError, fieldErrors } from '@/lib/errors';
import { useDelayed } from '@/hooks/useDelayed';
import useReadingMutation from '@/hooks/apis/readings/useReadingMutation';
import type { Reading, Slot } from '@/types/models';

interface FormValues { date: string; slot: Slot | ''; value: number }
interface Props { open: boolean; onOpenChange: (o: boolean) => void; readings: Reading[]; initialDate?: string; initialSlot?: Slot }

export function ReadingFormDialog({ open, onOpenChange, readings, initialDate, initialSlot }: Props) {
  const today = todayInAppTz();
  const { createMutation } = useReadingMutation();
  const slow = useDelayed(createMutation.isPending);
  const { register, handleSubmit, watch, setValue, setError, reset, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(readingSchema) as unknown as Resolver<FormValues>,
    defaultValues: { date: initialDate ?? today, slot: initialSlot ?? '', value: undefined },
  });

  useEffect(() => {
    if (open) {
      createMutation.reset();
      reset({ date: initialDate ?? today, slot: initialSlot ?? '', value: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialDate, initialSlot]);

  const date = watch('date');
  const slot = watch('slot');
  const used = useMemo(() => usedSlotsFor(readings, date), [readings, date]);
  const dayFull = used.size >= SLOTS.length;

  useEffect(() => {
    if (slot && used.has(slot)) {
      const free = SLOTS.find((s) => !used.has(s.id));
      setValue('slot', free?.id ?? '');
    } else if (!slot) {
      const free = SLOTS.find((s) => !used.has(s.id));
      if (free) setValue('slot', free.id);
    }
  }, [used, slot, setValue]);

  const onSubmit = (v: FormValues) => {
    if (!v.slot) return;
    createMutation.mutate(
      { date: v.date, slot: v.slot, value: v.value },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) => {
          for (const fe of fieldErrors(err)) {
            if (fe.field === 'date' || fe.field === 'slot' || fe.field === 'value') setError(fe.field, { message: fe.message });
          }
        },
      },
    );
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Add a reading" description="One number for one moment of the day." testId="dialog-add-reading">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="form">
        <Field id="reading-date" label="Date" error={errors.date?.message}>
          <input id="reading-date" type="date" className="input" max={today} {...register('date')} aria-invalid={!!errors.date || undefined} data-testid="input-reading-date" />
        </Field>
        <fieldset className="field">
          <legend className="field-label">Time of day</legend>
          <div className="slot-picker" role="radiogroup">
            {SLOTS.map((s) => {
              const taken = used.has(s.id);
              return (
                <label key={s.id} className={'slot-option' + (taken ? ' is-taken' : '')}>
                  <input type="radio" value={s.id} disabled={taken} {...register('slot')} data-testid={`radio-slot-${s.id}`} />
                  <span>{s.label}</span>
                  {taken && <small>logged</small>}
                </label>
              );
            })}
          </div>
          {errors.slot?.message && <p className="field-error" role="alert" data-testid="error-reading-slot">{errors.slot.message}</p>}
          {dayFull && <p className="field-hint" data-testid="text-day-full">All four moments are already logged for this day. Choose another date.</p>}
        </fieldset>
        <Field id="reading-value" label={`Reading (${UNIT})`} error={errors.value?.message} hint={`Whole number between ${VALUE_MIN} and ${VALUE_MAX}.`}>
          <input id="reading-value" type="number" inputMode="numeric" step={1} min={VALUE_MIN} max={VALUE_MAX} className="input input-value" {...register('value', { valueAsNumber: true })} aria-invalid={!!errors.value || undefined} data-testid="input-reading-value" autoFocus />
        </Field>
        {createMutation.isError && <Notice tone="error" testId="error-add-reading">{describeError(createMutation.error)}</Notice>}
        <SlowNotice show={slow} />
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => onOpenChange(false)} data-testid="button-cancel-add">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || dayFull} data-testid="button-save-reading">
            {createMutation.isPending ? 'Saving...' : 'Save reading'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
