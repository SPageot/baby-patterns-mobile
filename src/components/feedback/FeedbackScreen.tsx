import { useEffect, useState } from 'react'
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useTranslation } from 'react-i18next'

import { submitFeedback, type FeedbackPhotoUpload } from '@/api/feedbackApi'
import { isApiConfigured } from '@/api/config'
import { NavIcon } from '@/components/icons/NavIcon'
import { Button, Eyebrow, Label } from '@/components/ui/primitives'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { heading } from '@/constants/typography'
import { useApp } from '@/context/AppContext'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { parseApiErrorMessage } from '@/lib/reviewNames'
import { Spacing } from '@/constants/theme'

const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

function prepareFeedbackPhoto(asset: ImagePicker.ImagePickerAsset): FeedbackPhotoUpload {
  const name = asset.fileName ?? asset.uri.split('/').pop() ?? 'feedback.jpg'
  const type = (asset.mimeType ?? 'image/jpeg').trim().toLowerCase() || 'image/jpeg'
  if (type && !ALLOWED_MIME.has(type) && !type.startsWith('image/')) {
    throw new Error('Photo must be JPG, PNG, GIF, or WEBP.')
  }
  if (asset.fileSize != null && asset.fileSize > MAX_PHOTO_BYTES) {
    throw new Error('Photo must be 10 MB or smaller.')
  }
  return { uri: asset.uri, name, type: ALLOWED_MIME.has(type) ? type : 'image/jpeg' }
}

const createStyles = (t: AppPalette) => ({
  scroll: {
    flex: 1,
    backgroundColor: t.background,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  hero: {
    gap: 8,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.accentSoft,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
  },
  title: {
    ...heading(28, { weight: '700' }),
    color: t.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: t.textMuted,
  },
  panel: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    padding: Spacing.three,
    gap: 14,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: t.text,
  },
  field: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    borderRadius: HomeRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: t.text,
    backgroundColor: t.card2,
  },
  inputReadonly: {
    opacity: 0.85,
  },
  textarea: {
    minHeight: 140,
    textAlignVertical: 'top' as const,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    color: t.textMuted,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    color: t.error,
  },
  success: {
    fontSize: 14,
    lineHeight: 20,
    color: t.accentDeep,
  },
  preview: {
    gap: 10,
    alignItems: 'flex-start' as const,
  },
  previewImage: {
    width: 180,
    height: 140,
    borderRadius: HomeRadius.md,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card2,
  },
  pickBtn: {
    alignSelf: 'flex-start' as const,
    paddingVertical: 8,
  },
  pickBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
})

export function FeedbackScreen() {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const { t } = useTranslation()
  const { user, authReady } = useApp()

  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [photo, setPhoto] = useState<FeedbackPhotoUpload | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const signedInEmail = user?.email?.trim() ?? ''
  const emailLocked = Boolean(signedInEmail)

  useEffect(() => {
    if (signedInEmail) setEmail(signedInEmail)
  }, [signedInEmail])

  const pickPhoto = async () => {
    setError(null)
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setError(t('community.feedback.photoPermission'))
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    })

    if (result.canceled || !result.assets[0]) return

    try {
      setPhoto(prepareFeedbackPhoto(result.assets[0]))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('community.feedback.photoType'))
      setPhoto(null)
    }
  }

  const onSubmit = async () => {
    setError(null)
    setSuccess(null)

    if (!isApiConfigured()) {
      setError(t('errors.apiRequired'))
      return
    }

    const trimmedSubject = subject.trim()
    const trimmedMessage = message.trim()
    const trimmedEmail = (emailLocked ? signedInEmail : email).trim()

    if (!trimmedSubject) {
      setError(t('community.feedback.subjectRequired'))
      return
    }
    if (!trimmedMessage) {
      setError(t('community.feedback.messageRequired'))
      return
    }
    if (!trimmedEmail) {
      setError(t('community.feedback.emailRequired'))
      return
    }

    setSubmitting(true)
    try {
      const result = await submitFeedback({
        subject: trimmedSubject,
        message: trimmedMessage,
        email: trimmedEmail,
        photo,
      })
      setSuccess(result.message || t('community.feedback.success'))
      setSubject('')
      setMessage('')
      setPhoto(null)
      if (!emailLocked) setEmail('')
    } catch (err) {
      setError(parseApiErrorMessage(err, t('community.feedback.sendFailed')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <NavIcon name="edit" size={22} color={palette.accentDeep} />
        </View>
        <Eyebrow>Community</Eyebrow>
        <Text style={styles.title}>{t('community.feedback.title')}</Text>
        <Text style={styles.subtitle}>{t('community.feedback.subtitle')}</Text>
      </View>

      {!authReady ? (
        <Text style={styles.hint}>{t('common.loading')}</Text>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{t('community.feedback.formHeading')}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          <View style={styles.field}>
            <Label>{t('community.feedback.subject')}</Label>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              maxLength={200}
              autoCapitalize="sentences"
              editable={!submitting}
            />
          </View>

          <View style={styles.field}>
            <Label>{t('community.feedback.message')}</Label>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={10000}
              editable={!submitting}
            />
          </View>

          <View style={styles.field}>
            <Label>{t('community.feedback.email')}</Label>
            <TextInput
              style={[styles.input, emailLocked ? styles.inputReadonly : null]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!emailLocked && !submitting}
            />
            <Text style={styles.hint}>
              {emailLocked
                ? t('community.feedback.emailLockedHint')
                : t('community.feedback.emailGuestHint')}
            </Text>
          </View>

          <View style={styles.field}>
            <Label>{t('community.feedback.photo')}</Label>
            <Pressable style={styles.pickBtn} onPress={() => void pickPhoto()} disabled={submitting}>
              <Text style={styles.pickBtnText}>
                {photo ? t('community.feedback.changePhoto') : t('community.feedback.choosePhoto')}
              </Text>
            </Pressable>
            <Text style={styles.hint}>{t('community.feedback.photoHint')}</Text>
            {photo ? (
              <View style={styles.preview}>
                <Image source={{ uri: photo.uri }} style={styles.previewImage} resizeMode="contain" />
                <Pressable onPress={() => setPhoto(null)} disabled={submitting}>
                  <Text style={styles.pickBtnText}>{t('community.feedback.removePhoto')}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <Button
            title={submitting ? t('community.feedback.sending') : t('community.feedback.send')}
            onPress={() => void onSubmit()}
            loading={submitting}
            disabled={submitting}
          />
        </View>
      )}
    </ScrollView>
  )
}
