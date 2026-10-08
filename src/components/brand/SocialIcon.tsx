// Official X mark (see src/assets/social/SOURCES.md), inlined with its geometry
// unchanged; fill follows currentColor like the rest of the footer icons.
import x from '@/assets/social/x-mark.svg?raw';

const RAW = { x } as const;

export function SocialIcon({ name }: { name: keyof typeof RAW }) {
  return <span className={`soc-ico soc-ico--${name}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: RAW[name] }} />;
}
