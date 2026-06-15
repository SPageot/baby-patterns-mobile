import { useMemo, useState } from 'react'
import { Link } from 'expo-router'
import { Pressable, Text, TextInput, View } from 'react-native'

import { Button, Label } from '@/components/ui/primitives'
import { createBrand, createProduct } from '@/api/reviewsApi'
import {
  filterBrandsByName,
  filterProductsByName,
  findBrandByName,
  findProductByName,
  parseApiErrorMessage,
} from '@/lib/reviewNames'
import type { Brand } from '@/schemas/review'
import type { AppPalette } from '@/constants/homeTheme'
import { HomeRadius } from '@/constants/homeTheme'
import { useHomeTheme } from '@/hooks/useHomeTheme'
import { useThemedStyles } from '@/hooks/useThemedStyles'
import { Spacing } from '@/constants/theme'

type Props = {
  brands: Brand[]
  isLoggedIn: boolean
  onAdded: () => void
}

type AddMode = 'brand' | 'product'

const createStyles = (t: AppPalette) => ({
  collapsed: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  panel: {
    borderRadius: HomeRadius.xl,
    borderWidth: 1,
    borderColor: t.strokeSubtle,
    backgroundColor: t.card,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    gap: 8,
  },
  head: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: t.text,
  },
  hide: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: t.textMuted,
  },
  row: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  halfBtn: {
    flex: 1,
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
    marginBottom: 8,
  },
  suggestions: {
    gap: 6,
    marginBottom: 8,
  },
  suggestion: {
    fontSize: 13,
    color: t.textMuted,
  },
  pickBtn: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: t.accentDeep,
    paddingVertical: 6,
  },
  selectedRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
    padding: 10,
    borderRadius: HomeRadius.md,
    backgroundColor: t.card2,
  },
  selectedText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: t.text,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: t.accentDeep,
  },
  hint: {
    fontSize: 12,
    color: t.textMuted,
  },
  warn: {
    fontSize: 12,
    color: '#b45309',
    marginBottom: 4,
  },
  error: {
    fontSize: 13,
    color: '#b42318',
  },
  success: {
    fontSize: 13,
    color: '#027a48',
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: t.accentDeep,
  },
})

function PanelHead({ title, onClose }: { title: string; onClose: () => void }) {
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.head}>
      <Text style={styles.title}>{title}</Text>
      <Pressable onPress={onClose}>
        <Text style={styles.hide}>Hide</Text>
      </Pressable>
    </View>
  )
}

export function AddBrandProductPanel({ brands, isLoggedIn, onAdded }: Props) {
  const palette = useHomeTheme()
  const styles = useThemedStyles(createStyles)
  const [mode, setMode] = useState<AddMode | null>(null)
  const [brandDraft, setBrandDraft] = useState('')
  const [brandSaving, setBrandSaving] = useState(false)
  const [brandError, setBrandError] = useState<string | null>(null)
  const [brandSuccess, setBrandSuccess] = useState<string | null>(null)

  const [brandPickerDraft, setBrandPickerDraft] = useState('')
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [productDraft, setProductDraft] = useState('')
  const [productCategory, setProductCategory] = useState('General')
  const [productSaving, setProductSaving] = useState(false)
  const [productError, setProductError] = useState<string | null>(null)
  const [productSuccess, setProductSuccess] = useState<string | null>(null)

  const brandSuggestions = useMemo(() => filterBrandsByName(brands, brandDraft), [brands, brandDraft])
  const brandPickerSuggestions = useMemo(
    () => filterBrandsByName(brands, brandPickerDraft),
    [brands, brandPickerDraft],
  )
  const selectedBrand = useMemo(
    () => brands.find((brand) => brand.id === selectedBrandId),
    [brands, selectedBrandId],
  )
  const productSuggestions = useMemo(
    () => filterProductsByName(selectedBrand, productDraft),
    [selectedBrand, productDraft],
  )

  const existingBrand = findBrandByName(brands, brandDraft)
  const canAddBrand = brandDraft.trim().length >= 2 && !existingBrand
  const existingProduct = findProductByName(selectedBrand, productDraft)
  const canAddProduct =
    Boolean(selectedBrandId) && productDraft.trim().length >= 2 && !existingProduct

  const selectBrandForProduct = (brand: Brand) => {
    setSelectedBrandId(brand.id)
    setBrandPickerDraft(brand.name)
    setProductDraft('')
    setProductError(null)
    setProductSuccess(null)
  }

  const clearSelectedBrand = () => {
    setSelectedBrandId(null)
    setBrandPickerDraft('')
    setProductDraft('')
    setProductCategory('General')
  }

  const onAddBrand = async () => {
    setBrandSaving(true)
    setBrandError(null)
    setBrandSuccess(null)
    try {
      const created = await createBrand(brandDraft.trim())
      setBrandSuccess(`Added brand "${created.name}".`)
      setBrandDraft('')
      selectBrandForProduct(created)
      onAdded()
    } catch (e) {
      setBrandError(parseApiErrorMessage(e, 'Could not add brand'))
    } finally {
      setBrandSaving(false)
    }
  }

  const onAddProduct = async () => {
    if (!selectedBrandId) {
      setProductError('Select an existing brand first.')
      return
    }
    setProductSaving(true)
    setProductError(null)
    setProductSuccess(null)
    try {
      const created = await createProduct(
        selectedBrandId,
        productDraft.trim(),
        productCategory.trim() || 'General',
      )
      setProductSuccess(`Added "${created.name}" under ${selectedBrand?.name ?? 'brand'}.`)
      setProductDraft('')
      setProductCategory('General')
      onAdded()
    } catch (e) {
      setProductError(parseApiErrorMessage(e, 'Could not add product'))
    } finally {
      setProductSaving(false)
    }
  }

  if (!mode) {
    return (
      <View style={styles.collapsed}>
        <Text style={styles.title}>Contribute to reviews</Text>
        <Text style={styles.intro}>
          {isLoggedIn
            ? 'Suggest brands and products for other parents to review.'
            : 'Log in to suggest brands and products for other parents to review.'}
        </Text>
        <View style={styles.row}>
          <Button title="Add a brand" variant="secondary" onPress={() => setMode('brand')} style={styles.halfBtn} />
          <Button title="Add a product" variant="secondary" onPress={() => setMode('product')} style={styles.halfBtn} />
        </View>
      </View>
    )
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.panel}>
        <PanelHead title={mode === 'brand' ? 'Add a brand' : 'Add a product'} onClose={() => setMode(null)} />
        <Text style={styles.intro}>Log in to suggest brands and products for other parents to review.</Text>
        <Link href="/login" style={styles.loginLink}>
          Log in to contribute
        </Link>
      </View>
    )
  }

  if (mode === 'brand') {
    return (
      <View style={styles.panel}>
        <PanelHead title="Add a brand" onClose={() => setMode(null)} />
        <Text style={styles.intro}>Add a new brand if it is not already in the list.</Text>

        <Label>Brand name</Label>
        <TextInput
          value={brandDraft}
          onChangeText={(v) => {
            setBrandDraft(v)
            setBrandError(null)
            setBrandSuccess(null)
          }}
          placeholder="Type a brand name"
          placeholderTextColor={palette.textMuted}
          style={styles.input}
        />

        {brandDraft.trim() && brandSuggestions.length > 0 ? (
          <View style={styles.suggestions}>
            {brandSuggestions.map((brand) => (
              <Text key={brand.id} style={styles.suggestion}>
                {brand.name}
              </Text>
            ))}
          </View>
        ) : null}

        {existingBrand ? (
          <Text style={styles.warn}>{`"${existingBrand.name}" is already in the list.`}</Text>
        ) : null}
        {canAddBrand ? <Text style={styles.hint}>No exact match — you can add this brand.</Text> : null}

        <Button
          title={brandSaving ? 'Adding…' : `Add brand "${brandDraft.trim() || '…'}"`}
          loading={brandSaving}
          disabled={!canAddBrand}
          onPress={() => void onAddBrand()}
        />

        {brandError ? <Text style={styles.error}>{brandError}</Text> : null}
        {brandSuccess ? <Text style={styles.success}>{brandSuccess}</Text> : null}
      </View>
    )
  }

  return (
    <View style={styles.panel}>
      <PanelHead title="Add a product" onClose={() => setMode(null)} />
      <Text style={styles.intro}>Pick an existing brand, then add a product under it.</Text>

      <Label>Brand (required)</Label>
      {selectedBrand ? (
        <View style={styles.selectedRow}>
          <Text style={styles.selectedText}>{selectedBrand.name}</Text>
          <Pressable onPress={clearSelectedBrand}>
            <Text style={styles.changeText}>Change</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <TextInput
            value={brandPickerDraft}
            onChangeText={(v) => {
              setBrandPickerDraft(v)
              setSelectedBrandId(null)
              setProductError(null)
              setProductSuccess(null)
            }}
            placeholder="Search existing brands"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
          />
          {brandPickerDraft.trim() && brandPickerSuggestions.length > 0 ? (
            <View style={styles.suggestions}>
              {brandPickerSuggestions.map((brand) => (
                <Pressable key={brand.id} onPress={() => selectBrandForProduct(brand)}>
                  <Text style={styles.pickBtn}>{brand.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {brandPickerDraft.trim() && brandPickerSuggestions.length === 0 ? (
            <Text style={styles.warn}>No brand matches. Add the brand first, then add its product.</Text>
          ) : null}
        </>
      )}

      <Label>Product name</Label>
      <TextInput
        value={productDraft}
        onChangeText={(v) => {
          setProductDraft(v)
          setProductError(null)
          setProductSuccess(null)
        }}
        placeholder={selectedBrand ? 'Type a product name' : 'Select a brand first'}
        placeholderTextColor={palette.textMuted}
        editable={Boolean(selectedBrandId)}
        style={styles.input}
      />

      {selectedBrand && productDraft.trim() && productSuggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {productSuggestions.map((product) => (
            <Text key={product.id} style={styles.suggestion}>
              {product.name}
              {product.category ? ` · ${product.category}` : ''}
            </Text>
          ))}
        </View>
      ) : null}

      {existingProduct ? (
        <Text style={styles.warn}>
          {`"${existingProduct.name}" already exists under ${selectedBrand?.name}.`}
        </Text>
      ) : null}
      {canAddProduct ? <Text style={styles.hint}>No exact match — you can add this product.</Text> : null}

      <Label>Category (optional)</Label>
      <TextInput
        value={productCategory}
        onChangeText={setProductCategory}
        placeholder="e.g. Diapers, Bottles, Formula"
        placeholderTextColor={palette.textMuted}
        editable={Boolean(selectedBrandId)}
        style={styles.input}
      />

      <Button
        title={productSaving ? 'Adding…' : `Add product "${productDraft.trim() || '…'}"`}
        loading={productSaving}
        disabled={!canAddProduct}
        onPress={() => void onAddProduct()}
      />

      {productError ? <Text style={styles.error}>{productError}</Text> : null}
      {productSuccess ? <Text style={styles.success}>{productSuccess}</Text> : null}
    </View>
  )
}
