import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Field } from '@/components/common/Field';
import { Notice, SlowNotice } from '@/components/common/Notice';
import { UNIT, VALUE_MAX, VALUE_MIN, slotLabel } from '@/constants/slots';
import { editSchema } from '@/validation/schemas';
import { formatDay } from '@/lib/date';
import { describeError, fieldErrors } from '@/lib/errors';
import { useDelayed } from '@/hooks/useDelayed';
import useReadingMutation from '@/hooks/apis/readings/useReadingMutation';
import type { Reading } from '@/types/models';

interface Props { reading: Reading | null; onClose: () => void }

export function EditReadingDialog({ reading, onClose }: Props) {
  const { updateMutation, deleteMutation } = useReadingMutation();
  const [confirming, setConfirming] = useState(false);
  const slow = useDelayed(updateMutation.isPending || deleteMutation.isPending);
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<{ value: number }>({
    resolver: yupResolver(editSchema) as unknown as Resolver<{ value: number }>,
  });

  useEffect(() => {
    if (reading) {
      reset({ value: reading.value });
      setConfirming(false);
      updateMutation.reset();
      deleteMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reading?.id]);

  if (!reading) return null;

  const onSave = (v: { value: number }) => {
    updateMutation.mutate(
      { id: reading.id, value: v.value },
      {
        onSuccess: onClose,
        onError: (err) => {
          const fe = fieldErrors(err).find((e) => e.field === 'value');
          if (fe) setError('value', { message: fe.message });
        },
      },
    );
  };

  const onDelete = () => deleteMutation.mutate(reading.id, { onSuccess: onClose });
  const pending = updateMutation.isPending || deleteMutation.isPending;

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={confirming ? 'Delete this reading?' : 'Edit reading'} testId="dialog-edit-reading">
      <dl className="fixed-facts">
        <div><dt>Date</dt><dd data-testid="text-edit-date">{formatDay(reading.date)}</dd></div>
        <div><dt>Time of day</dt><dd data-testid="text-edit-slot">{slotLabel(reading.slot)}</dd></div>
      </dl>
      {confirming ? (
        <div className="form">
          <p className="confirm-copy">
            <strong>{reading.value} {UNIT}</strong> will be removed from your journal. This can't be undone, but you can add the slot again afterwards.
          </p>
          {deleteMutation.isError && <Notice tone="error" testId="error-delete-reading">{describeError(deleteMutation.error)}</Notice>}
          <SlowNotice show={slow} />
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={pending} data-testid="button-cancel-delete" autoFocus>Keep it</button>
            <button type="button" className="btn btn-danger" onClick={onDelete} disabled={pending} data-testid="button-confirm-delete">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete reading'}
            </button>
          </div>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit(onSave)} noValidate>
          <Field id="edit-value" label={`Reading (${UNIT})`} error={errors.value?.message} hint={`Only the value can change. Whole number ${VALUE_MIN}-${VALUE_MAX}.`}>
            <input id="edit-value" type="number" inputMode="numeric" step={1} min={VALUE_MIN} max={VALUE_MAX} className="input input-value" {...register('value', { valueAsNumber: true })} aria-invalid={!!errors.value || undefined} data-testid="input-edit-value" autoFocus />
          </Field>
          {updateMutation.isError && !errors.value && <Notice tone="error" testId="error-edit-reading">{describeError(updateMutation.error)}</Notice>}
          <SlowNotice show={slow} />
          <div className="form-actions split">
            <button type="button" className="btn btn-danger-ghost" onClick={() => setConfirming(true)} disabled={pending} data-testid="button-delete-reading">
              <Trash2 size={16} aria-hidden /> Delete
            </button>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose} data-testid="button-cancel-edit">Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={pending} data-testid="button-update-reading">
                {updateMutation.isPending ? 'Saving...' : 'Save value'}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
