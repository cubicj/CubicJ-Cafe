export type BadgeTone =
  | 'yellow'
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'gray'
  | 'purple'
  | 'emerald'
  | 'teal'
  | 'rose'
  | 'indigo'
  | 'cyan'
  | 'amber'
  | 'violet';

export const BADGE_TONES: Record<BadgeTone, string> = {
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
};
