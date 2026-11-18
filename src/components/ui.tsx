import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import logoUrl from '../../build/icon.svg';
import type { StoryStatus, Tag } from '../shared/types';
import { useTheme } from '../lib/theme';
import {
  cx,
  formatTime,
  hexToRgba,
  initials,
  readableOnColor,
  shadeHex,
  statusDotColor,
} from '../lib/utils';
import { Icon } from './Icon';

/* ------------------------------------------------------------------ */
/* Logo                                                               */
/* ------------------------------------------------------------------ */

export function AppLogo({ size = 38, className }: { size?: number; className?: string }) {
  return (
    <img
      src={logoUrl}
      width={size}
      height={size}
      alt="Stemma di Scrittura"
      className={cx('rounded-[22%] shadow-card', className)}
      draggable={false}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                            */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-ink',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface2',
  ghost: 'text-ink-soft hover:bg-surface2 hover:text-ink',
  danger: 'bg-danger text-white hover:opacity-90',
  'danger-ghost': 'text-danger hover:bg-surface2',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-[13px]',
  md: 'h-10 px-4',
  lg: 'h-11 px-5 text-[15px]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...rest}
    />
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function IconButton({ label, className, children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx('icon-btn', className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Form fields                                                        */
/* ------------------------------------------------------------------ */

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label mb-1.5">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">{hint}</p> : null}
    </div>
  );
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx('field-input', className)} {...rest} />;
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx('field-area', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx('field-input cursor-pointer', className)} {...rest}>
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* Modal & confirmation                                               */
/* ------------------------------------------------------------------ */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  widthClassName = 'max-w-lg',
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    if (dialog && !dialog.contains(document.activeElement)) {
      dialog.focus();
    }
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div
        className="fixed inset-0 animate-fade-in bg-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cx(
          'card relative z-10 my-auto w-full animate-rise p-6 shadow-float outline-none sm:p-7',
          widthClassName,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="font-serif text-2xl leading-tight text-ink">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton label="Chiudi" onClick={onClose} className="-mr-1 -mt-1">
            <Icon name="x" size={16} />
          </IconButton>
        </div>
        {children ? <div className="mt-5">{children}</div> : null}
        {footer ? <div className="mt-7 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Elimina',
  cancelLabel = 'Annulla',
  tone = 'danger',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      widthClassName="max-w-md"
      footer={
        <>
          <Button onClick={onClose}>{cancelLabel}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-ink-soft">{description}</div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Badges, chips, portraits                                           */
/* ------------------------------------------------------------------ */

export function StatusBadge({ status }: { status: StoryStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface2 px-2 py-0.5 text-[11px] font-medium text-ink-soft">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: statusDotColor(status) }}
      />
      {status}
    </span>
  );
}

export function TagChip({
  tag,
  onRemove,
  className,
}: {
  tag: Tag;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium text-ink',
        className,
      )}
      style={{
        borderColor: hexToRgba(tag.color, 0.45),
        backgroundColor: hexToRgba(tag.color, 0.12),
      }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
      <span className="truncate">{tag.name}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Rimuovi tag ${tag.name}`}
          title={`Rimuovi tag ${tag.name}`}
          className="ml-0.5 rounded-full p-0.5 text-ink-faint transition-colors hover:text-ink"
        >
          <Icon name="x" size={10} strokeWidth={2.2} />
        </button>
      ) : null}
    </span>
  );
}

export function Portrait({
  src,
  name,
  className,
  roundedClassName = 'rounded-xl',
}: {
  src: string | null;
  name: string;
  className?: string;
  roundedClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={cx(
          'flex items-center justify-center bg-surface2 text-ink-faint',
          roundedClassName,
          className,
        )}
        aria-label={name ? `Ritratto non disponibile di ${name}` : 'Ritratto non disponibile'}
      >
        <span className="font-serif text-3xl tracking-wide">
          {initials(name) || <Icon name="user" size={28} />}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Ritratto di ${name || 'personaggio'}`}
      draggable={false}
      onError={() => setFailed(true)}
      className={cx('object-cover', roundedClassName, className)}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Book cover                                                         */
/* ------------------------------------------------------------------ */

export function BookCover({
  cover,
  title,
  color,
  showTitle = true,
  className,
  roundedClassName = 'rounded-lg',
}: {
  cover: string | null;
  title: string;
  color: string;
  showTitle?: boolean;
  className?: string;
  roundedClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [cover]);

  if (cover && !failed) {
    return (
      <img
        src={cover}
        alt={`Copertina di ${title || 'questo racconto'}`}
        draggable={false}
        onError={() => setFailed(true)}
        className={cx('aspect-[2/3] w-full object-cover', roundedClassName, className)}
      />
    );
  }

  const textColor = readableOnColor(color);

  return (
    <div
      className={cx(
        'relative flex aspect-[2/3] w-full flex-col overflow-hidden',
        roundedClassName,
        className,
      )}
      style={{
        background: `linear-gradient(155deg, ${shadeHex(color, 0.16)} 0%, ${color} 52%, ${shadeHex(color, -0.28)} 100%)`,
        color: textColor,
      }}
      aria-label={`Copertina segnaposto di ${title || 'questo racconto'}`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 28% 12%, rgba(255,255,255,0.28), transparent 46%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-2 left-[8%] w-px"
        style={{ backgroundColor: textColor, opacity: 0.28 }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-2 rounded-[4px] border"
        style={{ borderColor: textColor, opacity: 0.16 }}
        aria-hidden="true"
      />

      {showTitle ? (
        <div className="relative flex h-full flex-col justify-between p-2.5 sm:p-3">
          <span className="text-[6px] uppercase tracking-[0.24em] opacity-70">Scrittura</span>
          <span className="line-clamp-4 font-serif text-[11px] leading-tight">
            {title || 'Racconto senza titolo'}
          </span>
          <Icon name="feather" size={13} className="opacity-70" />
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <Icon name="feather" size={18} className="opacity-80" />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                        */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center px-6 py-14 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface2 text-ink-faint">
        <Icon name={icon} size={24} />
      </div>
      <h3 className="font-serif text-xl text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Theme switcher & save indicator                                    */
/* ------------------------------------------------------------------ */

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const next = theme === 'dark' ? 'chiaro' : 'scuro';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Passa al tema ${next}`}
      aria-label={`Passa al tema ${next}`}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface2 hover:text-ink sm:px-3"
    >
      <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={15} />
      <span className="hidden sm:inline">{theme === 'dark' ? 'Tema scuro' : 'Tema chiaro'}</span>
    </button>
  );
}

export function SaveIndicator({
  status,
  lastSavedAt,
}: {
  status: 'saved' | 'saving' | 'error';
  lastSavedAt: string | null;
}) {
  const savedTime = lastSavedAt
    ? formatTime(new Date(lastSavedAt))
    : null;

  const label = status === 'saving' ? 'Salvataggio...' : status === 'error' ? 'Errore di salvataggio' : 'Salvato';
  const dotClass =
    status === 'saving'
      ? 'bg-accent animate-pulse-soft'
      : status === 'error'
        ? 'bg-danger'
        : 'bg-success';
  const title =
    status === 'saving'
      ? 'Sto salvando le modifiche sul disco'
      : status === 'error'
        ? 'Non è stato possibile salvare. Controlla lo spazio disponibile.'
        : savedTime
          ? `Ultimo salvataggio locale alle ${savedTime}`
          : 'Tutte le modifiche sono salvate in locale';

  return (
    <div
      className="flex items-center gap-1.5 text-[11.5px] text-ink-faint"
      title={title}
      aria-live="polite"
    >
      <span className={cx('h-1.5 w-1.5 rounded-full', dotClass)} aria-hidden="true" />
      <span className={status === 'error' ? 'font-medium text-danger' : ''}>{label}</span>
    </div>
  );
}
