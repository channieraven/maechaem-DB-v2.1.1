# maechaem-DB-v2.1.1
ระบบฐานข้อมูลโครงการปลูกป่าอเนกประสงค์ในพื้นที่คทช.

## ความต้องการของระบบ (Prerequisites)

| เครื่องมือ | เวอร์ชันขั้นต่ำ |
|-----------|--------------|
| Node.js   | 20+          |
| npm       | 9+           |
| Git       | ใดก็ได้       |
| Firebase CLI | ใดก็ได้   |

## ตรวจสอบเครื่องมือ

```bash
node --version      # ต้อง 20+
npm --version       # ต้อง 9+
git --version
firebase --version  # ถ้ายังไม่มี ติดตั้งด้านล่าง
```

## ติดตั้ง Firebase CLI (ถ้ายังไม่มี)

```bash
npm install -g firebase-tools
firebase login
```

## เริ่มต้นใช้งาน

```bash
# โคลน repo
git clone https://github.com/channieraven/maechaem-DB-v2.1.1.git
cd maechaem-DB-v2.1.1

# ล็อกอิน Firebase (ถ้ายังไม่ได้ล็อกอิน)
firebase login

# เชื่อม Firebase project
firebase use --add
```

## โครงสร้างโปรเจกต์

```
maechaem-DB-v2.1.1/
├── firebase.json          # การตั้งค่า Firebase (Hosting + Firestore)
├── .firebaserc            # ชื่อ Firebase project
├── firestore.rules        # กฎความปลอดภัย Firestore
├── firestore.indexes.json # Index สำหรับ query
└── public/
    └── index.html         # หน้าหลัก
```

## โครงสร้างฐานข้อมูล (Firestore Collections)

| Collection | รายละเอียด |
|-----------|-----------|
| `projects` | ข้อมูลโครงการปลูกป่า (name, area, createdAt) |
| `projects/{id}/plots` | พื้นที่ย่อยของแต่ละโครงการ |
| `trees`    | ข้อมูลต้นไม้ (species, projectId, plantedAt) |
| `users`    | ข้อมูลผู้ใช้งาน |

## Deploy

```bash
# Deploy Firestore rules และ indexes
firebase deploy --only firestore

# Deploy Hosting
firebase deploy --only hosting

# Deploy ทั้งหมด
firebase deploy
```
