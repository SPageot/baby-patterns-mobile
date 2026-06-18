import { Platform } from 'react-native'
import type { jsPDF } from 'jspdf'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'

export async function sharePdfDocument(doc: jsPDF, filename: string): Promise<void> {
  if (Platform.OS === 'web') {
    doc.save(filename)
    return
  }

  const dataUri = doc.output('datauristring')
  const base64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri
  if (!base64) {
    throw new Error('Could not generate PDF data.')
  }

  const directory = FileSystem.cacheDirectory
  if (!directory) {
    throw new Error('No cache directory available for PDF export.')
  }

  const uri = `${directory}${filename}`
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 })

  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) {
    throw new Error('Sharing is not available on this device.')
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: filename,
  })
}
