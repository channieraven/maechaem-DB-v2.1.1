type BambooValues = {
  culmCount: number
  rcd1Cm: number
  rcd2Cm: number
  rcd3Cm: number
}

type BambooFieldsProps = {
  values: BambooValues
  onChange: <K extends keyof BambooValues>(key: K, value: BambooValues[K]) => void
}

export default function BambooFields({ values, onChange }: BambooFieldsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <label htmlFor="culmCount" className="mb-1 block text-xs font-medium text-gray-600">
          จำนวนลำ (culm_count)
        </label>
        <input
          id="culmCount"
          type="number"
          min={0}
          value={values.culmCount}
          onChange={(event) => onChange('culmCount', Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="rcd1" className="mb-1 block text-xs font-medium text-gray-600">
          RCD 1 ความโตที่ระดับคอราก (ซม.)
        </label>
        <input
          id="rcd1"
          type="number"
          min={0}
          step="0.01"
          value={values.rcd1Cm}
          onChange={(event) => onChange('rcd1Cm', Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="rcd2" className="mb-1 block text-xs font-medium text-gray-600">
          RCD 2 ความโตที่ระดับคอราก (ซม.)
        </label>
        <input
          id="rcd2"
          type="number"
          min={0}
          step="0.01"
          value={values.rcd2Cm}
          onChange={(event) => onChange('rcd2Cm', Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="rcd3" className="mb-1 block text-xs font-medium text-gray-600">
          RCD 3 ความโตที่ระดับคอราก (ซม.)
        </label>
        <input
          id="rcd3"
          type="number"
          min={0}
          step="0.01"
          value={values.rcd3Cm}
          onChange={(event) => onChange('rcd3Cm', Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  )
}
