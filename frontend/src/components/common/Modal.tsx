import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  testId: string;
}

export function Modal({ open, onOpenChange, title, description, children, testId }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal" data-testid={testId} aria-describedby={description ? undefined : undefined}>
          <div className="modal-head">
            <div>
              <Dialog.Title className="modal-title">{title}</Dialog.Title>
              {description ? <Dialog.Description className="modal-desc">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
            </div>
            <Dialog.Close className="icon-btn" aria-label="Close dialog" data-testid={`button-close-${testId}`}>
              <X size={18} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
