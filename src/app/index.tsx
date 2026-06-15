import { View } from 'react-native';

import { HomeSections } from '@/components/home/HomeSections';
import type { AppPalette } from '@/constants/homeTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

const createStyles = (t: AppPalette) => ({
  container: {
    flex: 1,
    backgroundColor: t.background,
  },
});

export default function HomeScreen() {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <HomeSections />
    </View>
  );
}
