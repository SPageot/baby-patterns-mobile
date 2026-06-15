export const homeFeatures = [
  {
    icon: 'drop.fill' as const,
    emoji: '💧',
    title: 'Diaper Changes',
    body: 'Track wet, dirty, and mixed.',
  },
  {
    icon: 'moon.fill' as const,
    emoji: '🌙',
    title: 'Sleep',
    body: 'Monitor naps and night sleep.',
  },
  {
    icon: 'chart.bar.fill' as const,
    emoji: '📊',
    title: 'Trends & Insights',
    body: 'Understand patterns and get insights.',
  },
  {
    icon: 'person.2.fill' as const,
    emoji: '👥',
    title: 'Share with Partners',
    body: 'Stay in sync with caregivers.',
  },
] as const

export const homeStats = [
  { value: '50K+', label: 'Happy Parents' },
  { value: '1M+', label: 'Logs Created' },
  { value: '100%', label: 'Privacy Focused' },
] as const

export const homeTestimonial = {
  quote:
    'Baby Patterns has been a game-changer! It’s so easy to use and helps our whole family stay on the same page.',
  author: 'Sarah T.',
  meta: 'Mom of one',
} as const
