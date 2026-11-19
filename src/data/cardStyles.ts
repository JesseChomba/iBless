import type { CardStyleId } from '../types/ibless';

export interface CardStyleMeta {
  id: CardStyleId;
  name: string;
  tagline: string;
  bgHex: string;
  borderHex: string;
  textHex: string;
  mutedHex: string;
  accentHex: string;
  sealBgHex: string;
  sealTextHex: string;
  previewClass: string;
}

export const CARD_STYLES: CardStyleMeta[] = [
  {
    id: 'sunbeam',
    name: 'Warm Sunbeam',
    tagline: 'Cream cotton & marigold seal',
    bgHex: '#FFFBEB',
    borderHex: '#FDE68A',
    textHex: '#292524',
    mutedHex: '#78716C',
    accentHex: '#D97706',
    sealBgHex: '#F59E0B',
    sealTextHex: '#FFFFFF',
    previewClass: 'bg-[#FFFBEB] border-[#FDE68A] text-stone-800',
  },
  {
    id: 'coral',
    name: 'Coral Post',
    tagline: 'Peach blush & terracotta ink',
    bgHex: '#FFF1F2',
    borderHex: '#FECDD3',
    textHex: '#292524',
    mutedHex: '#881337',
    accentHex: '#E11D48',
    sealBgHex: '#EA580C',
    sealTextHex: '#FFFFFF',
    previewClass: 'bg-[#FFF1F2] border-[#FECDD3] text-stone-900',
  },
  {
    id: 'mint',
    name: 'Garden Mint',
    tagline: 'Fresh sage & botanical press',
    bgHex: '#ECFDF5',
    borderHex: '#A7F3D0',
    textHex: '#064E3B',
    mutedHex: '#047857',
    accentHex: '#059669',
    sealBgHex: '#10B981',
    sealTextHex: '#FFFFFF',
    previewClass: 'bg-[#ECFDF5] border-[#A7F3D0] text-emerald-950',
  },
  {
    id: 'sky',
    name: 'Morning Sky',
    tagline: 'Airy horizon & crisp cobalt',
    bgHex: '#F0F9FF',
    borderHex: '#BAE6FD',
    textHex: '#0C4A6E',
    mutedHex: '#0369A1',
    accentHex: '#0284C7',
    sealBgHex: '#0EA5E9',
    sealTextHex: '#FFFFFF',
    previewClass: 'bg-[#F0F9FF] border-[#BAE6FD] text-sky-950',
  },
  {
    id: 'lavender',
    name: 'Soft Lavender',
    tagline: 'Evening iris & quiet ink',
    bgHex: '#F5F3FF',
    borderHex: '#DDD6FE',
    textHex: '#2E1065',
    mutedHex: '#6D28D9',
    accentHex: '#7C3AED',
    sealBgHex: '#8B5CF6',
    sealTextHex: '#FFFFFF',
    previewClass: 'bg-[#F5F3FF] border-[#DDD6FE] text-violet-950',
  },
  {
    id: 'midnight',
    name: 'Midnight Press',
    tagline: 'Deep charcoal & warm gold foil',
    bgHex: '#1C1917',
    borderHex: '#44403C',
    textHex: '#FAF9F6',
    mutedHex: '#D6D3D1',
    accentHex: '#FBBF24',
    sealBgHex: '#F59E0B',
    sealTextHex: '#1C1917',
    previewClass: 'bg-[#1C1917] border-[#44403C] text-[#FAF9F6]',
  },
];

export function getCardStyleMeta(id: CardStyleId | string): CardStyleMeta {
  return CARD_STYLES.find((s) => s.id === id) ?? CARD_STYLES[0];
}
