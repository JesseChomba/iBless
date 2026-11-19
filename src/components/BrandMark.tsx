import React from 'react';

export const BrandMark: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const iconDims = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const textClass =
    size === 'sm'
      ? 'text-lg'
      : size === 'lg'
      ? 'text-2xl'
      : 'text-xl';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <svg
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className={`${iconDims} shrink-0`}
      >
        <rect width="64" height="64" rx="16" fill="#EA580C" />
        <path
          d="M32 10V15M19 15L22.5 18.5M45 15L41.5 18.5"
          stroke="#FDE68A"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="13" y="22" width="38" height="27" rx="5" fill="#FAF9F6" />
        <path
          d="M15 24.5L32 37L49 24.5"
          stroke="#EA580C"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="37" r="5.5" fill="#F59E0B" />
      </svg>
      <span
        className={`font-display font-bold tracking-tight text-stone-900 dark:text-stone-100 ${textClass}`}
      >
        iBless
      </span>
    </span>
  );
};
