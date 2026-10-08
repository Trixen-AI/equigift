// Third-party logos, inlined unmodified from the official files in src/assets/logos
// (sources listed in src/assets/logos/SOURCES.md). Resize only.
import apple from '@/assets/logos/apple.svg?raw';
import nvidia from '@/assets/logos/nvidia.svg?raw';
import tesla from '@/assets/logos/tesla.svg?raw';
import solana from '@/assets/logos/solanaLogo.svg?raw';
import solanaMark from '@/assets/logos/solanaLogoMark.svg?raw';
import { SP500_TEXT } from './logoData';

const RAW = { apple, nvidia, tesla, solana, solanaMark } as const;
export type BrandKey = keyof typeof RAW | 'sp500';

const LABEL: Record<BrandKey, string> = {
  apple: 'Apple',
  nvidia: 'NVIDIA',
  tesla: 'Tesla',
  solana: 'Solana',
  solanaMark: 'Solana',
  sp500: 'S&P 500',
};

export function BrandLogo({ name, className }: { name: BrandKey; className?: string }) {
  if (name === 'sp500') {
    // Neutral mark: the index has no official logo file, so its name is set as outlined text.
    return (
      <svg className={`brand-logo brand-logo--sp500 ${className ?? ''}`} viewBox={`0 0 ${SP500_TEXT.w} ${SP500_TEXT.h}`} role="img" aria-label={LABEL.sp500}>
        <path d={SP500_TEXT.d} fill="currentColor" />
      </svg>
    );
  }
  return (
    <span
      className={`brand-logo brand-logo--${name} ${className ?? ''}`}
      role="img"
      aria-label={LABEL[name]}
      dangerouslySetInnerHTML={{ __html: RAW[name] }}
    />
  );
}
