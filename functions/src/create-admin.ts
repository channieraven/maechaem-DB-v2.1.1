#!/usr/bin/env node
/**
 * Script สำหรับสร้าง admin profile ใน Firestore
 * 
 * วิธีใช้:
 * 1. ตรวจสอบว่ามี Firebase Auth user อยู่แล้ว (ลงทะเบียนผ่าน Firebase Console)
 * 2. รัน: cd functions && npm run create-admin -- <email>
 * 
 * หรือ:
 * cd functions && npx tsx src/create-admin.ts <email>
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Read project ID from .firebaserc
function getProjectId(): string {
  const firebasercPath = path.join(__dirname, '../../.firebaserc');
  try {
    const content = fs.readFileSync(firebasercPath, 'utf-8');
    const config = JSON.parse(content);
    return config.projects.default;
  } catch (error) {
    console.error('❌ ไม่สามารถอ่าน .firebaserc ได้');
    console.error('💡 ตรวจสอบว่าไฟล์ .firebaserc มีอยู่และมี project ID');
    process.exit(1);
  }
}

// Initialize Firebase Admin
const projectId = getProjectId();
console.log(`🔥 เชื่อมต่อกับ Firebase Project: ${projectId}\n`);

admin.initializeApp({
  projectId: projectId,
});

const db = admin.firestore();
const auth = admin.auth();

async function createAdminProfile(email: string): Promise<void> {
  try {
    console.log(`🔍 กำลังค้นหา user: ${email}`);
    
    // ค้นหา user จาก Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    console.log(`✅ พบ user: ${userRecord.uid}`);
    
    // ตรวจสอบว่ามี profile อยู่แล้วหรือไม่
    const profileRef = db.collection('profiles').doc(userRecord.uid);
    const profileSnapshot = await profileRef.get();
    
    if (profileSnapshot.exists) {
      console.log('⚠️  มี profile อยู่แล้ว กำลังอัปเดตเป็น admin...');
      
      await profileRef.update({
        role: 'admin',
        approved: true,
      });
      
      console.log('✅ อัปเดต profile เป็น admin สำเร็จ!');
    } else {
      console.log('📝 กำลังสร้าง profile ใหม่...');
      
      const profile = {
        id: userRecord.uid,
        email: userRecord.email || email,
        fullname: userRecord.displayName || email.split('@')[0],
        position: 'Administrator',
        organization: 'System',
        role: 'admin',
        approved: true,
        created_at: new Date().toISOString(),
      };
      
      await profileRef.set(profile);
      console.log('✅ สร้าง admin profile สำเร็จ!');
    }
    
    // แสดงข้อมูล profile
    const updatedProfile = await profileRef.get();
    console.log('\n📋 ข้อมูล Profile:');
    console.log(JSON.stringify(updatedProfile.data(), null, 2));
    
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ ไม่พบ user นี้ใน Firebase Auth');
      console.error('💡 กรุณาลงทะเบียนผ่าน Firebase Console ก่อน:');
      console.error('   https://console.firebase.google.com/project/_/authentication/users');
    } else {
      console.error('❌ เกิดข้อผิดพลาด:', error.message);
    }
    process.exit(1);
  }
}

async function listUsers(): Promise<void> {
  try {
    console.log('📋 รายการ Users ทั้งหมดใน Firebase Auth:');
    console.log('─'.repeat(60));
    
    const listUsersResult = await auth.listUsers(10);
    
    if (listUsersResult.users.length === 0) {
      console.log('⚠️  ไม่มี user ใน Firebase Auth');
      console.log('💡 กรุณาลงทะเบียนผ่าน Firebase Console ก่อน');
      return;
    }
    
    for (const userRecord of listUsersResult.users) {
      console.log(`\n📧 Email: ${userRecord.email || 'N/A'}`);
      console.log(`🆔 UID: ${userRecord.uid}`);
      console.log(`👤 Display Name: ${userRecord.displayName || 'N/A'}`);
      console.log(`📅 Created: ${userRecord.metadata.creationTime}`);
      
      // ตรวจสอบว่ามี profile ใน Firestore หรือไม่
      const profileRef = db.collection('profiles').doc(userRecord.uid);
      const profileSnapshot = await profileRef.get();
      
      if (profileSnapshot.exists) {
        const profile = profileSnapshot.data();
        console.log(`✅ Profile: role=${profile?.role}, approved=${profile?.approved}`);
      } else {
        console.log('❌ ยังไม่มี profile ใน Firestore');
      }
    }
    
    console.log('\n' + '─'.repeat(60));
    console.log(`\n💡 ใช้คำสั่ง: npm run create-admin -- <email>`);
    console.log('   เพื่อสร้าง admin profile สำหรับ user ที่ต้องการ');
    
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    process.exit(1);
  }
}

// Main
const email = process.argv[2];

if (!email || email === '--list' || email === '-l') {
  listUsers().then(() => process.exit(0));
} else {
  createAdminProfile(email).then(() => process.exit(0));
}
