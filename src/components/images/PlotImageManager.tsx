import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { usePlotImages } from '../../hooks/usePlotImages'
import type { GalleryCategory, ImageType } from '../../lib/database.types'
import { deleteImage, uploadImage } from '../../lib/database/firestoreService'

type PlotImageManagerProps = {
  plotId: string | null
}

const IMAGE_TYPE_OPTIONS: ImageType[] = ['plan_pre_1', 'plan_pre_2', 'plan_post_1', 'gallery']
const GALLERY_CATEGORY_OPTIONS: GalleryCategory[] = ['tree', 'soil', 'atmosphere', 'other']

export default function PlotImageManager({ plotId }: PlotImageManagerProps) {
  const { user } = useAuth()
  const { images, isLoading, error, refresh } = usePlotImages(plotId)
  const [imageType, setImageType] = useState<ImageType>('gallery')
  const [galleryCategory, setGalleryCategory] = useState<GalleryCategory>('tree')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const canSubmit = Boolean(plotId && user?.uid && selectedFile && !isSubmitting)

  const handleUpload = async () => {
    if (!plotId || !user?.uid || !selectedFile) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await uploadImage({
        plotId,
        imageType,
        galleryCategory,
        file: selectedFile,
        uploadedBy: user.uid,
        description,
      })

      setDescription('')
      setSelectedFile(null)
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'อัปโหลดรูปไม่สำเร็จ'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (imageId: string) => {
    setDeletingId(imageId)
    setSubmitError(null)

    try {
      await deleteImage(imageId)
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ลบรูปไม่สำเร็จ'
      setSubmitError(message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-green-800">Plot Images</h2>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={!plotId}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          รีเฟรช
        </button>
      </div>

      {!plotId && <p className="text-sm text-gray-500">กรุณาเลือกแปลงก่อน</p>}

      {plotId && (
        <div className="mb-4 grid gap-2 rounded-lg border border-gray-200 p-3 md:grid-cols-2">
          <select
            value={imageType}
            onChange={(event) => setImageType(event.target.value as ImageType)}
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
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
            className="rounded-md border border-gray-300 px-2 py-2 text-sm"
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
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm md:col-span-2"
          />

          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="คำอธิบายรูป (ไม่บังคับ)"
            className="rounded-md border border-gray-300 px-2 py-2 text-sm md:col-span-2"
          />

          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={!canSubmit}
            className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white enabled:hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40 md:col-span-2"
          >
            {isSubmitting ? 'กำลังอัปโหลด...' : 'อัปโหลดรูป'}
          </button>
        </div>
      )}

      {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}
      {plotId && isLoading && <p className="text-sm text-gray-500">กำลังโหลดรูปภาพ...</p>}
      {plotId && error && <p className="text-sm text-red-600">{error.message}</p>}

      {plotId && !isLoading && !error && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <li key={image.id} className="rounded-lg border border-gray-200 p-2">
              <img
                src={image.legacy_url}
                alt={image.description || image.image_type}
                className="mb-2 h-36 w-full rounded-md object-cover"
              />
              <p className="text-xs font-medium text-gray-800">{image.image_type}</p>
              <p className="mb-2 text-xs text-gray-600">{image.description || '-'}</p>
              <button
                type="button"
                onClick={() => void handleDelete(image.id)}
                disabled={deletingId === image.id}
                className="w-full rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 enabled:hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deletingId === image.id ? 'กำลังลบ...' : 'ลบรูป'}
              </button>
            </li>
          ))}
          {images.length === 0 && <li className="text-sm text-gray-500">ยังไม่มีรูปภาพในแปลงนี้</li>}
        </ul>
      )}
    </section>
  )
}
