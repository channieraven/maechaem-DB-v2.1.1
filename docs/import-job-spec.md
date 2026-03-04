# ImportJob Spec (PDF Batch Import)

วัตถุประสงค์: เก็บร่องรอยการนำเข้าข้อมูลแบบ batch จากไฟล์ PDF (เช่น `ข้อมูลไม้ป่า P5.pdf`) โดยรองรับทั้ง Dry Run และ Commit จริง

## Collection

- `import_jobs`

## Document Shape

```ts
{
  id: string
  source_file_name: string
  source_plot_code: string
  mode: 'dry_run' | 'commit'
  parser_version: string
  status: 'queued' | 'dry_run_completed' | 'validated' | 'committed' | 'failed'
  summary: {
    total_rows: number
    valid_rows: number
    invalid_rows: number
    plots_resolved: number
    trees_resolved: number
    species_resolved: number
  }
  survey_date: string // ISO date (YYYY-MM-DD)
  parsed_rows: ParsedGrowthRow[]
  issues: Array<{
    code: string
    message: string
    severity: 'error' | 'warning'
    row_index?: number
    field?: string
  }>
  created_by: string
  created_at: string // ISO-8601
  updated_at: string // ISO-8601
  committed_at?: string // ISO-8601
  commit_result?: {
    committed_rows: number
    created_trees: number
    updated_trees: number
    upserted_growth_logs: number
    upserted_growth_dbh: number
  }
}
```

`ParsedGrowthRow` (forest P5):

```ts
{
  tree_number: number
  row_main: number
  row_sub: number
  species_code?: string
  species_name_th?: string
  height_m: number
  dbh_cm: number
  status?: 'alive' | 'dead' | 'missing'
  note?: string
}
```

## Status Lifecycle

1. `queued` เมื่อรับคำขอเข้าระบบ
2. `dry_run_completed` เมื่อ parse + validate เสร็จ (ยังไม่เขียนข้อมูลหลัก)
3. `validated` เตรียมพร้อม commit (ไม่มี error ที่บล็อก)
4. `committed` เขียนข้อมูลลง `plots/trees/growth_logs/growth_dbh` สำเร็จ
5. `failed` เกิดข้อผิดพลาดระดับ job

## Dry Run Contract (Callable)

Input:

```ts
{
  fileName: string
  fileBase64: string
  sourcePlotCode?: string
}
```

Output:

```ts
{
  jobId: string
  status: 'dry_run_completed' | 'failed'
  summary: ImportJob['summary']
  issues: ImportJob['issues']
}
```

## Notes

- Dry Run ต้องไม่เขียนข้อมูลลงคอลเลกชันหลัก (`plots`, `trees`, `growth_logs`)
- ควรบันทึกผล validation ทั้งหมดใน `import_jobs`
- commit จริงทำแบบ upsert และ idempotent key (`jobId + tree_number + survey_date`) ผ่าน field `growth_logs.import_key`

---

## Tree Batch Import (CSV/TXT)

รองรับการนำเข้าต้นไม้แบบชุดผ่านหน้าแปลง (แท็บต้นไม้) โดยอ้างอิงไฟล์ตัวอย่าง `P5-A-02.csv` และ `P5-B.txt`

คอลัมน์ที่ต้องมี:

- `ต้นที่`
- `เลขแท็กต้นไม้`
- `เลขรหัสต้นไม้`
- `ชนิดพันธุ์`

คอลัมน์ทางเลือก:

- `หมายเหตุ`

กติกาหลัก:

- ข้ามแถวที่ `ต้นที่` ไม่เป็นตัวเลข (เช่น แถวปลูกแทรก)
- ข้ามแถวที่รหัสต้นไม้ซ้ำในไฟล์เดียวกัน
- ข้ามแถวที่รหัสต้นไม้มีอยู่แล้วในแปลง
- จับคู่ชนิดพันธุ์ด้วยชื่อไทย (`species.name_th`) ในระบบ
- หาก parse ตำแหน่งแถวจากเลขแท็กไม่ได้ จะ fallback โดยใช้ `ต้นที่` เป็น `row_main` และ `row_sub`
