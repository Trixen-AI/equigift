import {
  AtSign, Baby, BadgeDollarSign, Banknote, BookOpen, Briefcase, Cake, ChartCandlestick, ChartLine, Gem, Gift,
  GraduationCap, HandHeart, Heart, History, House, KeyRound, LifeBuoy, Link, ListChecks, Mail, Map, PartyPopper,
  Plus, QrCode, Receipt, Snowflake, Sparkles, Sunset, Ticket, TrendingUp, Users, WalletMinimal, Zap,
  type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  gift: Gift, chart: ChartLine, tracker: ListChecks, pools: Users, tickets: Ticket, receipt: Receipt, map: Map,
  history: History, plus: Plus, cash: Banknote, help: LifeBuoy, book: BookOpen,
  cake: Cake, cap: GraduationCap, heart: Heart, baby: Baby, snow: Snowflake, thanks: HandHeart, briefcase: Briefcase,
  gem: Gem, house: House, sunset: Sunset, sparkles: Sparkles,
  candles: ChartCandlestick, at: AtSign, nowallet: WalletMinimal, zap: Zap, dollar: BadgeDollarSign,
  link: Link, mail: Mail, trend: TrendingUp, party: PartyPopper, qr: QrCode, key: KeyRound,
};

export function Icon({ name, size = 20, strokeWidth = 1.75 }: { name: string; size?: number; strokeWidth?: number }) {
  const C = MAP[name] ?? Gift;
  return <C size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}
