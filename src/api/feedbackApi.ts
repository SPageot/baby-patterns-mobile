import { apiFetch } from '@/api/client'

export type FeedbackPhotoUpload = {
  uri: string
  name: string
  type: string
}

export type FeedbackSubmitInput = {
  subject: string
  message: string
  email?: string
  photo?: FeedbackPhotoUpload | null
}

export type FeedbackSubmitResult = {
  message: string
}

/** POST `api/feedback` (multipart). */
export async function submitFeedback(input: FeedbackSubmitInput): Promise<FeedbackSubmitResult> {
  const form = new FormData()
  form.append('subject', input.subject.trim())
  form.append('message', input.message.trim())
  if (input.email?.trim()) {
    form.append('email', input.email.trim())
  }
  if (input.photo) {
    form.append('photo', {
      uri: input.photo.uri,
      name: input.photo.name,
      type: input.photo.type,
    } as unknown as Blob)
  }

  const data = await apiFetch<unknown>('api/feedback', {
    method: 'POST',
    body: form,
  })

  if (
    data &&
    typeof data === 'object' &&
    'message' in data &&
    typeof (data as { message: unknown }).message === 'string'
  ) {
    return { message: (data as { message: string }).message }
  }

  return { message: 'Thanks — your feedback was sent to the development team.' }
}
