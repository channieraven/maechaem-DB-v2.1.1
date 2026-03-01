import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { GalleryCategory, ImageType } from '../../lib/database.types'
import { uploadImage } from '../../lib/database/firestoreService'

type ImageUploadProps = {
  plotId: string
  onUploaded?: () => Promise<void> | void
}

const IMAGE_TYPE_OPTIONS: ImageType[] = ['plan_pre_1', 'plan_pre_2', 'plan_post_1', 'gallery']
const GALLERY_CATEGORY_OPTIONS: GalleryCategory[] = ['tree', 'soil', 'atmosphere', 'other']

export default function ImageUpload({ plotId, onUploaded }: ImageUploadProps) {
  const { user } = useAuth()

  const [imageType, setImageType] = useState<ImageType>('gallery')
  const [galleryCategory, setGalleryCategory] = useState<GalleryCategory>('tree')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = Boolean(file && user?.uid && !submitting)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file || !user?.uid) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await uploadImage({
        plotId,
        imageType,
        galleryCategory,
        file,
        uploadedBy: user.uid,
        description,
      })

      setFile(null)
      setDescription('')
      await onUploaded?.()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'อัปโหลดรูปไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="grid gap-2 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <h3 className="md:col-span-2 text-base font-semibold text-green-800">อัปโหลดรูปภาพ</h3>

      <select
        value={imageType}
        onChange={(event) => setImageType(event.target.value as ImageType)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        {IMAGE_TYPE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <select
        value={galleryCategory}
        onChange={(event) => setGalleryCategory(event.target.value as GalleryCategory)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        {GALLERY_CATEGORY_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <input
        type="file"
        accept="image/*"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm md:col-span-2"
      />

      <input
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="คำอธิบายรูป"
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm md:col-span-2"
      />

      {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="md:col-span-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white enabled:hover:bg-green-800 disabled:opacity-40"
      >
        {submitting ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
      </button>
    </form>
  )
}
