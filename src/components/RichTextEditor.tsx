import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cx } from '../lib/utils';
import { sanitizeHtml, toEditorHtml } from '../lib/richText';
import { Icon } from './Icon';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  quote: boolean;
  list: boolean;
}

const emptyState: FormatState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  quote: false,
  list: false,
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Scrivi qui il tuo capitolo. Lasciati guidare dalla storia...',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<FormatState>(emptyState);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = toEditorHtml(value);
    // The editor is mounted per chapter; later updates come from typing.
  }, []);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    onChange(sanitizeHtml(editorRef.current.innerHTML));
  }, [onChange]);

  const refreshFormat = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || !selection.anchorNode || !editor.contains(selection.anchorNode)) {
      return;
    }
    const formatBlock = (document.queryCommandValue('formatBlock') || '')
      .replace(/[<>]/g, '')
      .toLowerCase();
    setFormat({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strike: document.queryCommandState('strikeThrough'),
      quote: formatBlock === 'blockquote',
      list: document.queryCommandState('insertUnorderedList'),
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', refreshFormat);
    return () => document.removeEventListener('selectionchange', refreshFormat);
  }, [refreshFormat]);

  const run = useCallback(
    (command: string, argument?: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      document.execCommand(command, false, argument);
      emitChange();
      refreshFormat();
    },
    [emitChange, refreshFormat],
  );

  const toggleQuote = () => {
    run('formatBlock', format.quote ? 'p' : 'blockquote');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === 'b' || key === 'i' || key === 'u') {
      event.preventDefault();
      run(key === 'b' ? 'bold' : key === 'i' ? 'italic' : 'underline');
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-surface2 px-2 py-1.5">
        <FormatButton
          label="Grassetto (Ctrl+B / Cmd+B)"
          active={format.bold}
          onClick={() => run('bold')}
        >
          <span className="text-[13px] font-bold">B</span>
        </FormatButton>
        <FormatButton
          label="Corsivo (Ctrl+I / Cmd+I)"
          active={format.italic}
          onClick={() => run('italic')}
        >
          <span className="font-serif text-[15px] italic">I</span>
        </FormatButton>
        <FormatButton
          label="Sottolineato (Ctrl+U / Cmd+U)"
          active={format.underline}
          onClick={() => run('underline')}
        >
          <span className="text-[13px] underline underline-offset-2">U</span>
        </FormatButton>
        <FormatButton
          label="Barrato"
          active={format.strike}
          onClick={() => run('strikeThrough')}
        >
          <span className="text-[13px] line-through">S</span>
        </FormatButton>
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        <FormatButton
          label="Citazione"
          active={format.quote}
          onClick={toggleQuote}
        >
          <Icon name="quote" size={16} />
        </FormatButton>
        <FormatButton
          label="Elenco puntato"
          active={format.list}
          onClick={() => run('insertUnorderedList')}
        >
          <Icon name="list" size={16} />
        </FormatButton>
        <span className="ml-auto hidden items-center gap-1 pr-1 text-[10px] text-ink-faint md:flex">
          <span>Ctrl+B</span>
          <span>·</span>
          <span>Ctrl+I</span>
          <span>·</span>
          <span>Ctrl+U</span>
        </span>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Testo del capitolo"
        data-placeholder={placeholder}
        spellCheck
        onInput={emitChange}
        onKeyDown={handleKeyDown}
        onMouseUp={refreshFormat}
        onKeyUp={refreshFormat}
        className="editor-prose rich-editor min-h-[52vh] w-full px-5 py-5 sm:px-6"
      />
    </div>
  );
}

function FormatButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cx(
        'inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface hover:text-ink',
        active && 'bg-accent-soft text-accent-ink hover:bg-accent-soft hover:text-accent-ink',
      )}
    >
      {children}
    </button>
  );
}
