const ALLOWED_TAGS = new Set([
  'P',
  'DIV',
  'BR',
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'S',
  'STRIKE',
  'DEL',
  'BLOCKQUOTE',
  'UL',
  'OL',
  'LI',
  'SPAN',
]);

const BLOCK_TAGS = /<\/?(p|div|br|b|strong|i|em|u|s|strike|del|blockquote|ul|ol|li|span)\b[^>]*>/i;

const SAFE_STYLE_PROPERTIES = ['font-weight', 'font-style', 'text-decoration', 'text-decoration-line'];

export function hasRichTextMarkup(value: string): boolean {
  return BLOCK_TAGS.test(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function plainTextToHtml(text: string): string {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '');
  if (!normalized.trim()) return '';
  return normalized
    .split(/\n{2,}/)
    .filter((block) => block.trim().length > 0)
    .map((block) => {
      const lines = block
        .split('\n')
        .map((line) => escapeHtml(line))
        .join('<br>');
      return `<p>${lines}</p>`;
    })
    .join('');
}

function sanitizeStyle(style: string): string {
  return style
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separator = declaration.indexOf(':');
      if (separator < 0) return '';
      const property = declaration.slice(0, separator).trim().toLowerCase();
      const value = declaration.slice(separator + 1).trim();
      return SAFE_STYLE_PROPERTIES.includes(property) ? `${property}: ${value}` : '';
    })
    .filter(Boolean)
    .join('; ');
}

export function sanitizeHtml(html: string): string {
  if (!html) return '';

  if (typeof document === 'undefined') {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/ on[a-z]+="[^"]*"/gi, '');
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  const clean = (parent: ParentNode) => {
    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;

      const element = child as HTMLElement;
      const tag = element.tagName.toUpperCase();

      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT' || tag === 'EMBED') {
        element.remove();
        continue;
      }

      clean(element);

      if (!ALLOWED_TAGS.has(tag)) {
        element.replaceWith(...Array.from(element.childNodes));
        continue;
      }

      const style = element.getAttribute('style');
      for (const attribute of Array.from(element.attributes)) {
        element.removeAttribute(attribute.name);
      }
      if (style && (tag === 'SPAN' || tag === 'P' || tag === 'DIV')) {
        const safeStyle = sanitizeStyle(style);
        if (safeStyle) element.setAttribute('style', safeStyle);
      }
    }
  };

  clean(template.content);
  return template.innerHTML;
}

export function toEditorHtml(value: string): string {
  if (!value) return '';
  return hasRichTextMarkup(value) ? sanitizeHtml(value) : plainTextToHtml(value);
}

export function contentToPlainText(content: string): string {
  if (!content) return '';
  if (!hasRichTextMarkup(content)) return content;

  if (typeof document !== 'undefined') {
    const container = document.createElement('div');
    container.innerHTML = content;
    for (const br of Array.from(container.querySelectorAll('br'))) {
      br.replaceWith(document.createTextNode('\n'));
    }
    for (const block of Array.from(
      container.querySelectorAll('p, div, li, blockquote, h1, h2, h3, h4, h5, h6'),
    )) {
      block.append(document.createTextNode('\n'));
    }
    return (container.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
  }

  return content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
