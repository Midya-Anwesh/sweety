import { useEffect, useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Modal } from '@/components/common/Modal';
import { CustomInput } from '@/components/common/CustomInput';
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
  const { control, handleSubmit, watch, setValue, setError, reset } = useForm<FormValues>({
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

  const slotOptions = useMemo(() => {
    return SLOTS.map((s) => {
      const taken = used.has(s.id);
      return {
        value: s.id,
        label: s.label,
        disabled: taken,
        sub: taken ? 'logged' : undefined,
        testId: `radio-slot-${s.id}`,
      };
    });
  }, [used]);

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
        <CustomInput
          control={control}
          name="date"
          fieldName="date"
          id="reading-date"
          inptType="date"
          label="Date"
          max={today}
          testId="input-reading-date"
        />
        <CustomInput
          control={control}
          name="slot"
          fieldName="slot"
          id="reading-slot"
          inptType="radio"
          label="Time of day"
          radioOptions={slotOptions}
          className="slot-picker"
          hint={dayFull ? 'All four moments are already logged for this day. Choose another date.' : undefined}
          hintTestId="text-day-full"
        />
        <CustomInput
          control={control}
          name="value"
          fieldName="value"
          id="reading-value"
          inptType="number"
          label={`Reading (${UNIT})`}
          hint={`Whole number between ${VALUE_MIN} and ${VALUE_MAX}.`}
          inputMode="numeric"
          step={1}
          min={VALUE_MIN}
          max={VALUE_MAX}
          className="input-value"
          valueAsNumber
          autoFocus
          testId="input-reading-value"
        />
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
