import type { IconName } from '@/components/ui/Icon';

export const PARENT_NAV: { icon: IconName; label: string; short: string; href: string }[] = [
  { icon: 'grid', label: 'Today', short: 'Today', href: '/parent/dashboard' },
  { icon: 'goals', label: 'Goals', short: 'Goals', href: '/parent/goals' },
  { icon: 'gift', label: 'Rewards', short: 'Rewards', href: '/parent/rewards' },
  { icon: 'sword', label: 'Family Boss', short: 'Boss', href: '/parent/family-boss' },
  { icon: 'clock', label: 'Screen Energy', short: 'Screen', href: '/parent/screen-energy' },
  { icon: 'cog', label: 'Settings', short: 'Settings', href: '/parent/settings' },
];

export function isParentNavActive(pathname: string, href: string) {
  return pathname === href || (href !== '/parent/dashboard' && pathname.startsWith(`${href}/`));
}
