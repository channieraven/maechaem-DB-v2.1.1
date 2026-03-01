import { useMemo, useState } from 'react'
import { usePlotImages } from '../../hooks/usePlotImages'
import { deleteImage } from '../../lib/database/firestoreService'
import ImageCard from './ImageCard'
import ImageUpload from './ImageUpload'

type ImageGalleryProps = {
  plotId: string
}

export default function ImageGallery({ plotId }: ImageGalleryProps) {
  const { images, isLoading, error, refresh } = usePlotImages(plotId)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const grouped = useMemo(() => {
    return images.reduce<Record<string, typeof images>>((acc, item) => {
      if (!acc[item.image_type]) {
        acc[item.image_type] = []
      }
      acc[item.image_type].push(item)
      return acc
    }, {})
  }, [images])

  const handleDelete = async (imageId: string) => {
    setDeletingId(imageId)
    try {
      await deleteImage(imageId)
      await refresh()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="space-y-4">
      <ImageUpload plotId={plotId} onUploaded={refresh} />

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-2 text-base font-semibold text-green-800">คลังรูปภาพ</h3>

        {isLoading && <p className="text-sm text-gray-500">กำลังโหลดรูปภาพ...</p>}
        {error && <p className="text-sm text-red-600">{error.message}</p>}
        {!isLoading && !error && images.length === 0 && <p className="text-sm text-gray-500">ยังไม่มีรูปภาพ</p>}

        {!isLoading && !error && images.length > 0 && (
          <div className="space-y-4">
            {Object.entries(grouped).map(([imageType, typeImages]) => (
              <div key={imageType}>
                <h4 className="mb-2 text-sm font-semibold text-gray-700">{imageType}</h4>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {typeImages.map((image) => (
                    <li key={image.id}>
                      <ImageCard
                        image={image}
                        deleting={deletingId === image.id}
                        onDelete={handleDelete}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
