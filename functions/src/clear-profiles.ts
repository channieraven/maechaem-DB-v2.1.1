#!/usr/bin/env node
/**
 * Script สำหรับเคลียร์ profiles collection ใน Firestore
 * ใช้เมื่อต้องการเริ่มต้นใหม่หลังจากเคลียร์ Firebase Authentication
 * 
 * วิธีใช้:
 * cd functions && npm run clear-profiles
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Read project ID from .firebaserc
function getProjectId(): string {
  const firebasercPath = path.join(__dirname, '../../.firebaserc');
  try {
    const content = fs.readFileSync(firebasercPath, 'utf-8');
    const config = JSON.parse(content);
    return config.projects.default;
  } catch (error) {
    console.error('❌ ไม่สามารถอ่าน .firebaserc ได้');
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

// Create readline interface for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function askConfirmation(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function clearProfiles(): Promise<void> {
  try {
    // ดึงข้อมูล profiles ทั้งหมด
    const profilesSnapshot = await db.collection('profiles').get();
    
    if (profilesSnapshot.empty) {
      console.log('✅ Profiles collection ว่างอยู่แล้ว ไม่ต้องเคลียร์');
      rl.close();
      return;
    }

    console.log(`📋 พบ ${profilesSnapshot.size} profiles:`);
    console.log('─'.repeat(60));
    
    profilesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`\n📧 ${data.email}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Role: ${data.role} | Approved: ${data.approved}`);
    });
    
    console.log('\n' + '─'.repeat(60));
    console.log('⚠️  คำเตือน: การลบจะไม่สามารถย้อนกลับได้!');
    
    const confirmed = await askConfirmation('\n❓ คุณแน่ใจที่จะลบ profiles ทั้งหมดใช่หรือไม่? (y/N): ');
    
    if (!confirmed) {
      console.log('❌ ยกเลิกการลบ');
      rl.close();
      return;
    }

    console.log('\n🗑️  กำลังลบ profiles...');
    
    // ลบทีละ document
    const batch = db.batch();
    profilesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    console.log(`✅ ลบ ${profilesSnapshot.size} profiles สำเร็จ!`);
    console.log('\n💡 ตอนนี้คุณสามารถลงทะเบียนบัญชีใหม่ได้แล้ว');
    console.log('   บัญชีแรกจะได้รับสิทธิ์ admin และการอนุมัติอัตโนมัติ');
    
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Main
clearProfiles().then(() => process.exit(0));
