type BananaValues = {
  totalPlants: number
  plants1yr: number
  yieldBunches: number
  yieldHands: number
  pricePerHand: number
}

type BananaFieldsProps = {
  values: BananaValues
  onChange: <K extends keyof BananaValues>(key: K, value: BananaValues[K]) => void
}

export default function BananaFields({ values, onChange }: BananaFieldsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <label htmlFor="totalPlants" className="mb-1 block text-xs font-medium text-gray-600">
          จำนวนต้นทั้งหมด
        </label>
        <input
          id="totalPlants"
          type="number"
          min={0}
          value={values.totalPlants}
          onChange={(event) => onChange('totalPlants', Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="plants1yr" className="mb-1 block text-xs font-medium text-gray-600">
          ต้นอายุ 1 ปี
        </label>
        <input
          id="plants1yr"
          type="number"
          min={0}
          value={values.plants1yr}
          onChange={(event) => onChange('plants1yr', Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="yieldBunches" className="mb-1 block text-xs font-medium text-gray-600">
          ผลผลิต (เครือ)
        </label>
        <input
          id="yieldBunches"
          type="number"
          min={0}
          value={values.yieldBunches}
          onChange={(event) => onChange('yieldBunches', Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="yieldHands" className="mb-1 block text-xs font-medium text-gray-600">
          ผลผลิต (หวี)
        </label>
        <input
          id="yieldHands"
          type="number"
          min={0}
          value={values.yieldHands}
          onChange={(event) => onChange('yieldHands', Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="md:col-span-2">
        <label htmlFor="pricePerHand" className="mb-1 block text-xs font-medium text-gray-600">
          ราคาต่อหวี
        </label>
        <input
          id="pricePerHand"
          type="number"
          min={0}
          step="0.01"
          value={values.pricePerHand}
          onChange={(event) => onChange('pricePerHand', Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  )
}
