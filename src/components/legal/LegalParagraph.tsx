import { Linking, Text, type TextStyle } from 'react-native'

import { SUPPORT_EMAIL, splitAroundSupportEmail } from '@/lib/legalContent'

type Props = {
  text: string
  style?: TextStyle
  linkStyle?: TextStyle
}

export function LegalParagraph({ text, style, linkStyle }: Props) {
  const parts = splitAroundSupportEmail(text)
  if (!parts) {
    return <Text style={style}>{text}</Text>
  }

  return (
    <Text style={style}>
      {parts.before}
      <Text
        style={linkStyle}
        accessibilityRole="link"
        onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
      >
        {SUPPORT_EMAIL}
      </Text>
      {parts.after}
    </Text>
  )
}
