type BambooValues = {
  culmCount: number
  dbh1Cm: number
  dbh2Cm: number
  dbh3Cm: number
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
          จำนวนลำ
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
        <label htmlFor="dbh1" className="mb-1 block text-xs font-medium text-gray-600">
          DBH 1 (ซม.)
        </label>
        <input
          id="dbh1"
          type="number"
          min={0}
          step="0.01"
          value={values.dbh1Cm}
          onChange={(event) => onChange('dbh1Cm', Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="dbh2" className="mb-1 block text-xs font-medium text-gray-600">
          DBH 2 (ซม.)
        </label>
        <input
          id="dbh2"
          type="number"
          min={0}
          step="0.01"
          value={values.dbh2Cm}
          onChange={(event) => onChange('dbh2Cm', Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="dbh3" className="mb-1 block text-xs font-medium text-gray-600">
          DBH 3 (ซม.)
        </label>
        <input
          id="dbh3"
          type="number"
          min={0}
          step="0.01"
          value={values.dbh3Cm}
          onChange={(event) => onChange('dbh3Cm', Number(event.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  )
}
