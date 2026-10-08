import { OCCASIONS } from '@/data/site';

export const occasionName = (key: string) => OCCASIONS.find((o) => o.key === key)?.name ?? 'Just because';
