import { getCardStyleMeta } from '../data/cardStyles';
import { getCategoryMeta } from '../data/categories';
import type { CardStyleId } from '../types/ibless';

export interface BlessingCardExportPayload {
  message: string;
  senderName: string;
  recipientName: string;
  category: string;
  cardStyle: CardStyleId;
  dateLabel: string;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const testLine = `${currentLine} ${words[i]}`;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
  }
  return lines;
}

export async function downloadBlessingCardPng(
  payload: BlessingCardExportPayload,
  fileName = 'ibless-card.png'
): Promise<void> {
  const style = getCardStyleMeta(payload.cardStyle);
  const cat = getCategoryMeta(payload.category);

  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available in this browser.');
  }

  // Outer card background
  ctx.fillStyle = style.bgHex;
  ctx.fillRect(0, 0, width, height);

  // Subtle decorative border frame
  const pad = 56;
  ctx.strokeStyle = style.borderHex;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(pad, pad, width - pad * 2, height - pad * 2, 36);
  ctx.stroke();

  // Inner hairline accent frame
  ctx.strokeStyle = style.accentHex + '33';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(pad + 18, pad + 18, width - (pad + 18) * 2, height - (pad + 18) * 2, 24);
  ctx.stroke();

  // Header brand + category
  ctx.fillStyle = style.accentHex;
  ctx.font = '600 26px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('iBLESS OFFICIAL DISPATCH', pad + 56, pad + 96);

  ctx.fillStyle = style.mutedHex;
  ctx.font = '500 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(`${cat.emoji}  ${cat.name}  ·  ${payload.dateLabel}`, pad + 56, pad + 140);

  // Divider line
  ctx.strokeStyle = style.borderHex;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad + 56, pad + 178);
  ctx.lineTo(width - pad - 56, pad + 178);
  ctx.stroke();

  // Recipient salutation
  ctx.fillStyle = style.mutedHex;
  ctx.font = '500 28px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(`For ${payload.recipientName},`, pad + 56, pad + 260);

  // Blessing message
  ctx.fillStyle = style.textHex;
  const msgFontSize = payload.message.length > 260 ? 38 : payload.message.length > 140 ? 44 : 52;
  const lineHeight = Math.round(msgFontSize * 1.42);
  ctx.font = `600 ${msgFontSize}px "Bricolage Grotesque", Georgia, serif`;
  const lines = wrapLines(ctx, `“${payload.message}”`, width - (pad + 56) * 2);

  let y = pad + 350;
  for (const line of lines.slice(0, 12)) {
    ctx.fillText(line, pad + 56, y);
    y += lineHeight;
  }

  // Wax seal stamp in bottom right
  const sealX = width - pad - 126;
  const sealY = height - pad - 130;
  ctx.fillStyle = style.sealBgHex;
  ctx.beginPath();
  ctx.arc(sealX, sealY, 54, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = style.sealTextHex + '66';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sealX, sealY, 44, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = style.sealTextHex;
  ctx.font = '700 22px "Bricolage Grotesque", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BLESSED', sealX, sealY + 8);
  ctx.textAlign = 'left';

  // Footer signature
  ctx.strokeStyle = style.borderHex;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad + 56, height - pad - 205);
  ctx.lineTo(width - pad - 56, height - pad - 205);
  ctx.stroke();

  ctx.fillStyle = style.mutedHex;
  ctx.font = '500 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Warmly dispatched by', pad + 56, height - pad - 145);

  ctx.fillStyle = style.textHex;
  ctx.font = '700 34px "Bricolage Grotesque", sans-serif';
  ctx.fillText(payload.senderName, pad + 56, height - pad - 98);

  ctx.fillStyle = style.mutedHex;
  ctx.font = '500 20px "JetBrains Mono", monospace';
  ctx.fillText('ibless · spread blessings, share smiles', pad + 56, height - pad - 52);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  );
  if (!blob) {
    throw new Error('Could not export blessing card image.');
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export async function shareViaNativeOrFallback(data: {
  title: string;
  text: string;
  url?: string;
}): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return 'failed';
      }
    }
  }
  const combined = data.url ? `${data.text}\n${data.url}` : data.text;
  const copied = await copyTextToClipboard(combined);
  return copied ? 'copied' : 'failed';
}
