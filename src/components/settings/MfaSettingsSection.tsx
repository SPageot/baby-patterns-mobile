import { useCallback, useEffect, useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'

import {
  beginMfaSetup,
  confirmMfaSetup,
  disableMfa,
  fetchMfaStatus,
  type MfaSetup,
} from '@/api/mfaApi'
import { isApiConfigured } from '@/api/config'
import { Button, Card, ErrorText, Input, Label, SectionTitle, Subtitle } from '@/components/ui/primitives'
import { LoadingState } from '@/components/ui/Loading'
import type { AppPalette } from '@/constants/homeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

const createStyles = (t: AppPalette) => ({
  section: {
    marginTop: Spacing.one,
  },
  success: {
    color: t.accentDeep,
    fontSize: 14,
    marginBottom: Spacing.two,
  },
  secret: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: t.text,
    marginBottom: Spacing.two,
  },
  link: {
    color: t.accentDeep,
    fontWeight: '600' as const,
    marginBottom: Spacing.two,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 15,
    color: t.text,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: Spacing.two,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    alignItems: 'center' as const,
  },
  modeBtnActive: {
    borderColor: t.accentDeep,
    backgroundColor: t.accentSoft,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: t.textMuted,
  },
  modeLabelActive: {
    color: t.accentDeep,
  },
})

export function MfaSettingsSection() {
  const styles = useThemedStyles(createStyles)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [recoveryRemaining, setRecoveryRemaining] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [setup, setSetup] = useState<MfaSetup | null>(null)
  const [confirmCode, setConfirmCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode] = useState('')

  const loadStatus = useCallback(async () => {
    if (!isApiConfigured()) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const status = await fetchMfaStatus()
      setEnabled(status.enabled)
      setRecoveryRemaining(status.recoveryCodesRemaining)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load two-factor settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  if (loading) {
    return (
      <View style={styles.section}>
        <LoadingState label="Loading security settings…" size="sm" inline compact />
      </View>
    )
  }

  return (
    <View style={styles.section}>
      <SectionTitle>Two-factor authentication</SectionTitle>
      <Subtitle>
        Add an authenticator app for an extra layer of protection when signing in.
      </Subtitle>

      {error ? <ErrorText>{error}</ErrorText> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      {enabled ? (
        <Card>
          <Subtitle>
            Two-factor authentication is on.
            {recoveryRemaining > 0
              ? ` ${recoveryRemaining} recovery code${recoveryRemaining === 1 ? '' : 's'} remaining.`
              : ' No recovery codes left.'}
          </Subtitle>
          <Label>Current password</Label>
          <Input secureTextEntry value={disablePassword} onChangeText={setDisablePassword} editable={!busy} />
          <Label>Authenticator code</Label>
          <Input
            keyboardType="number-pad"
            value={disableCode}
            onChangeText={(v) => setDisableCode(v.replace(/\D/g, ''))}
            editable={!busy}
            maxLength={8}
          />
          <Button
            title={busy ? 'Turning off…' : 'Turn off two-factor'}
            variant="secondary"
            loading={busy}
            onPress={() => {
              void (async () => {
                if (!disablePassword) {
                  setError('Enter your current password.')
                  return
                }
                if (disableCode.trim().length < 6) {
                  setError('Enter the 6-digit code from your authenticator app.')
                  return
                }
                setBusy(true)
                setError(null)
                setSuccess(null)
                try {
                  await disableMfa(disablePassword, disableCode)
                  setEnabled(false)
                  setRecoveryRemaining(0)
                  setDisablePassword('')
                  setDisableCode('')
                  setSuccess('Two-factor authentication has been turned off.')
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Could not disable two-factor authentication.')
                } finally {
                  setBusy(false)
                }
              })()
            }}
          />
        </Card>
      ) : setup ? (
        <Card>
          <Subtitle>Enter this secret in your authenticator app, then enter the 6-digit code.</Subtitle>
          <Text style={styles.secret}>{setup.secret}</Text>
          <Pressable onPress={() => void Linking.openURL(setup.otpAuthUri)}>
            <Text style={styles.link}>Open in authenticator app</Text>
          </Pressable>
          <Label>Verification code</Label>
          <Input
            keyboardType="number-pad"
            value={confirmCode}
            onChangeText={(v) => setConfirmCode(v.replace(/\D/g, ''))}
            editable={!busy}
            maxLength={8}
          />
          <Button
            title={busy ? 'Confirming…' : 'Enable two-factor'}
            loading={busy}
            onPress={() => {
              void (async () => {
                if (confirmCode.trim().length < 6) {
                  setError('Enter the 6-digit code from your authenticator app.')
                  return
                }
                setBusy(true)
                setError(null)
                try {
                  const result = await confirmMfaSetup(confirmCode)
                  setEnabled(result.enabled)
                  setRecoveryCodes(result.recoveryCodes)
                  setRecoveryRemaining(result.recoveryCodes.length)
                  setSetup(null)
                  setConfirmCode('')
                  setSuccess('Two-factor authentication is now enabled.')
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Could not confirm authenticator.')
                } finally {
                  setBusy(false)
                }
              })()
            }}
          />
          <Button
            title="Cancel"
            variant="secondary"
            disabled={busy}
            onPress={() => {
              setSetup(null)
              setConfirmCode('')
            }}
          />
        </Card>
      ) : recoveryCodes ? (
        <Card>
          <Subtitle>Save these recovery codes in a safe place. Each can be used once.</Subtitle>
          {recoveryCodes.map((code) => (
            <Text key={code} style={styles.code}>
              {code}
            </Text>
          ))}
          <Button title="Done" onPress={() => setRecoveryCodes(null)} />
        </Card>
      ) : (
        <Button
          title={busy ? 'Starting…' : 'Set up authenticator'}
          loading={busy}
          onPress={() => {
            void (async () => {
              setBusy(true)
              setError(null)
              setSuccess(null)
              setRecoveryCodes(null)
              try {
                const next = await beginMfaSetup()
                setSetup(next)
                setConfirmCode('')
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not start setup.')
              } finally {
                setBusy(false)
              }
            })()
          }}
        />
      )}
    </View>
  )
}
