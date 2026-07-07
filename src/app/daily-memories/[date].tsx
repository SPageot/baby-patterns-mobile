import { useLocalSearchParams } from 'expo-router'

import { DailyMemoryDayScreen } from '@/components/dailyMemories/DailyMemoryDayScreen'

export default function DailyMemoryDayRoute() {
  const { date } = useLocalSearchParams<{ date: string | string[] }>()
  const ymd = Array.isArray(date) ? date[0] ?? '' : date ?? ''

  return <DailyMemoryDayScreen ymd={ymd} />
}
