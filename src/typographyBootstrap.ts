import * as React from 'react'
import {
  Platform,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native'

import { appFont } from '@/constants/typography'

type AnyComponent = React.ComponentType<Record<string, unknown>>

function resolveRobotoStyle(style: StyleProp<TextStyle>): StyleProp<TextStyle> {
  const flat = StyleSheet.flatten(style) ?? {}
  const weight = flat.fontWeight ?? '400'
  const resolved = appFont({ weight })

  if (Platform.OS === 'ios') {
    return [resolved, style, { fontWeight: undefined }]
  }

  return [resolved, style]
}

function patchTextComponent<T extends AnyComponent>(Original: T, displayName: string): T {
  const Patched = React.forwardRef<unknown, TextProps | TextInputProps>(function BpRobotoText(
    props,
    ref,
  ) {
    return React.createElement(Original, {
      ...props,
      ref,
      style: resolveRobotoStyle(props.style),
    })
  })

  Patched.displayName = displayName
  return Patched as unknown as T
}

let patched = false

export function installAppTypography(): void {
  if (patched) return
  patched = true

  const rn = require('react-native') as {
    Text: typeof RNText
    TextInput: typeof RNTextInput
  }

  rn.Text = patchTextComponent(rn.Text, 'Text')
  rn.TextInput = patchTextComponent(rn.TextInput, 'TextInput')
}
