type RcdFieldsProps = {
  rcdCm: number
  onChange: (value: number) => void
}

export default function RcdFields({ rcdCm, onChange }: RcdFieldsProps) {
  return (
    <div>
      <label htmlFor="rcdCm" className="mb-1 block text-xs font-medium text-gray-600">
        RCD ความโตที่ระดับคอราก (ซม.)
      </label>
      <p className="mb-2 text-xs text-gray-500">เส้นผ่านศูนย์กลางลำต้นที่ระดับอก (สูงจากพื้น 1.3 ม.)</p>
      <input
        id="rcdCm"
        type="number"
        min={0}
        step="0.01"
        value={rcdCm}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  )
}
