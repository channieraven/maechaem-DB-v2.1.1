import type { PlotImage } from '../../lib/database.types'

type ImageCardProps = {
  image: PlotImage
  deleting: boolean
  onDelete: (imageId: string) => void
}

export default function ImageCard({ image, deleting, onDelete }: ImageCardProps) {
  return (
    <article className="rounded-lg border border-gray-200 p-2">
      <img
        src={image.legacy_url}
        alt={image.description || image.image_type}
        className="mb-2 h-36 w-full rounded-md object-cover"
      />

      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-800">{image.image_type}</p>
        <p className="text-xs text-gray-600">หมวด: {image.gallery_category}</p>
        <p className="text-xs text-gray-600">{image.description || '-'}</p>
      </div>

      <button
        type="button"
        onClick={() => onDelete(image.id)}
        disabled={deleting}
        className="mt-2 w-full rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 enabled:hover:bg-red-50 disabled:opacity-40"
      >
        {deleting ? 'กำลังลบ...' : 'ลบรูป'}
      </button>
    </article>
  )
}
