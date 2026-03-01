type DbhFieldsProps = {
  dbhCm: number
  onChange: (value: number) => void
}

export default function DbhFields({ dbhCm, onChange }: DbhFieldsProps) {
  return (
    <div>
      <label htmlFor="dbhCm" className="mb-1 block text-xs font-medium text-gray-600">
        RCD (ซม.)
        <span className="ml-1 font-normal text-gray-400">— ความโตที่ระดับคอราก</span>
      </label>
      <input
        id="dbhCm"
        type="number"
        min={0}
        step="0.01"
        value={dbhCm}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  )
}
