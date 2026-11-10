import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_PRODUCTS,
  INITIAL_MOVEMENTS,
  INITIAL_DOCUMENTS,
  INITIAL_USERS,
  INITIAL_NOTIFICATIONS
} from './src/mockData.ts';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// In-Memory Database initialized from file or mockData
interface DBState {
  products: typeof INITIAL_PRODUCTS;
  movements: typeof INITIAL_MOVEMENTS;
  documents: typeof INITIAL_DOCUMENTS;
  users: typeof INITIAL_USERS;
  notifications: typeof INITIAL_NOTIFICATIONS;
  logs: { id: string; action: string; user: string; details: string; timestamp: string }[];
}

function loadDB(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading DB file, falling back to initial data:', err);
  }
  const defaultState: DBState = {
    products: INITIAL_PRODUCTS,
    movements: INITIAL_MOVEMENTS,
    documents: INITIAL_DOCUMENTS,
    users: INITIAL_USERS,
    notifications: INITIAL_NOTIFICATIONS,
    logs: [
      {
        id: 'log-1',
        action: 'SYSTEM_INIT',
        user: 'System',
        details: 'เริ่มต้นระบบคลังสินค้า StockSmart POS',
        timestamp: new Date().toISOString()
      }
    ]
  };
  saveDB(defaultState);
  return defaultState;
}

function saveDB(state: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB file:', err);
  }
}

let db = loadDB();

// Automatic periodic backup every 6 hours or on system boot
function performAutoBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `auto-backup-${timestamp}.json`;
    const backupPath = path.join(BACKUPS_DIR, backupFileName);
    fs.writeFileSync(backupPath, JSON.stringify(db, null, 2), 'utf-8');
    console.log(`[Auto Backup] Successfully backed up database to ${backupFileName}`);
  } catch (e) {
    console.error('[Auto Backup Error]', e);
  }
}

performAutoBackup();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get full current application data state
  app.get('/api/data', (req, res) => {
    res.json(db);
  });

  // Save / Add / Update Product
  app.post('/api/products', (req, res) => {
    const { product, operatorName } = req.body;
    if (!product || !product.code || !product.name) {
      return res.status(400).json({ error: 'ข้อมูลสินค้าไม่ครบถ้วน' });
    }

    const existingIndex = db.products.findIndex(p => p.id === product.id || p.code === product.code);
    let updatedProduct;

    if (existingIndex >= 0) {
      const oldProd = db.products[existingIndex];
      const qtyDiff = (product.quantity || 0) - oldProd.quantity;

      updatedProduct = {
        ...oldProd,
        ...product,
        updatedAt: new Date().toISOString()
      };
      db.products[existingIndex] = updatedProduct;

      // Log movement if quantity changed
      if (qtyDiff !== 0) {
        db.movements.unshift({
          id: `m-${Date.now()}`,
          productId: updatedProduct.id,
          productCode: updatedProduct.code,
          productName: updatedProduct.name,
          type: qtyDiff > 0 ? 'IN' : 'ADJUST',
          quantity: Math.abs(qtyDiff),
          balanceAfter: updatedProduct.quantity,
          refDocumentNo: 'MANUAL_EDIT',
          note: `ปรับปรุงสต็อคโดยผู้ใช้ (${qtyDiff > 0 ? '+' : ''}${qtyDiff})`,
          createdBy: operatorName || 'System',
          createdAt: new Date().toISOString()
        });
      }
    } else {
      updatedProduct = {
        id: product.id || `p-${Date.now()}`,
        code: product.code,
        qrCode: product.qrCode || `QR-${product.code}`,
        name: product.name,
        category: product.category || 'สินค้าทั่วไป',
        unit: product.unit || 'ชิ้น',
        costPrice: Number(product.costPrice) || 0,
        sellingPrice: Number(product.sellingPrice) || 0,
        quantity: Number(product.quantity) || 0,
        minQuantity: Number(product.minQuantity) || 5,
        location: product.location || 'คลังหลัก',
        imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
        description: product.description || '',
        updatedAt: new Date().toISOString()
      };
      db.products.push(updatedProduct);

      db.movements.unshift({
        id: `m-${Date.now()}`,
        productId: updatedProduct.id,
        productCode: updatedProduct.code,
        productName: updatedProduct.name,
        type: 'IN',
        quantity: updatedProduct.quantity,
        balanceAfter: updatedProduct.quantity,
        refDocumentNo: 'INIT_ITEM',
        note: 'เพิ่มรายการสินค้าใหม่เข้าสู่ระบบ',
        createdBy: operatorName || 'System',
        createdAt: new Date().toISOString()
      });
    }

    // Check low stock notification
    if (updatedProduct.quantity <= updatedProduct.minQuantity) {
      const existsNotif = db.notifications.find(n => n.message.includes(updatedProduct.name) && !n.read);
      if (!existsNotif) {
        db.notifications.unshift({
          id: `n-${Date.now()}`,
          title: 'สินค้าใกล้หมด! (Low Stock Warning)',
          message: `${updatedProduct.name} เหลือเพียง ${updatedProduct.quantity} ${updatedProduct.unit} (จุดเตือน ${updatedProduct.minQuantity})`,
          type: 'warning',
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    }

    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: 'UPDATE_PRODUCT',
      user: operatorName || 'System',
      details: `บันทึก/แก้ไขสินค้า: ${updatedProduct.name} (${updatedProduct.code})`,
      timestamp: new Date().toISOString()
    });

    saveDB(db);
    res.json({ success: true, product: updatedProduct, data: db });
  });

  // Delete product
  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { operatorName } = req.query;
    const prod = db.products.find(p => p.id === id);
    if (!prod) return res.status(404).json({ error: 'ไม่พบสินค้า' });

    db.products = db.products.filter(p => p.id !== id);
    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: 'DELETE_PRODUCT',
      user: (operatorName as string) || 'System',
      details: `ลบสินค้า: ${prod.name} (${prod.code})`,
      timestamp: new Date().toISOString()
    });

    saveDB(db);
    res.json({ success: true, data: db });
  });

  // Save / Create Document (Delivery Note, Invoice, Receipt) + Deduct Stock automatically
  app.post('/api/documents', (req, res) => {
    const { document, operatorName } = req.body;
    if (!document || !document.items || document.items.length === 0) {
      return res.status(400).json({ error: 'เอกสารต้องมีรายการสินค้าอย่างน้อย 1 รายการ' });
    }

    const docId = document.id || `doc-${Date.now()}`;
    const docNo = document.documentNo || `${document.type === 'DELIVERY_NOTE' ? 'DO' : document.type === 'BILLING_NOTE' ? 'INV' : 'REC'}-${new Date().toISOString().slice(0,7).replace('-','')}-${Math.floor(100 + Math.random() * 900)}`;

    const newDoc = {
      ...document,
      id: docId,
      documentNo: docNo,
      issuedAt: document.issuedAt || new Date().toISOString()
    };

    // Deduct stock for Delivery Note and Receipt
    const shouldDeductStock = document.type === 'DELIVERY_NOTE' || document.type === 'RECEIPT';

    if (shouldDeductStock) {
      for (const item of newDoc.items) {
        const prod = db.products.find(p => p.code === item.productCode || p.id === item.productId);
        if (prod) {
          const deductQty = item.quantity;
          prod.quantity = Math.max(0, prod.quantity - deductQty);
          prod.updatedAt = new Date().toISOString();

          db.movements.unshift({
            id: `m-${Date.now()}-${Math.random().toString(36).substring(2,5)}`,
            productId: prod.id,
            productCode: prod.code,
            productName: prod.name,
            type: document.type === 'RECEIPT' ? 'SALE' : 'OUT',
            quantity: deductQty,
            balanceAfter: prod.quantity,
            refDocumentNo: docNo,
            note: `${document.type === 'RECEIPT' ? 'ขายสินค้าผ่านระบบ POS / ใบเสร็จ' : 'จัดส่งสินค้าตามใบส่งของ'} (${docNo})`,
            createdBy: operatorName || 'System',
            createdAt: new Date().toISOString()
          });

          if (prod.quantity <= prod.minQuantity) {
            db.notifications.unshift({
              id: `n-${Date.now()}`,
              title: 'สินค้าใกล้หมด! (Low Stock Warning)',
              message: `${prod.name} เหลือเพียง ${prod.quantity} ${prod.unit} (จุดเตือน ${prod.minQuantity})`,
              type: 'warning',
              timestamp: new Date().toISOString(),
              read: false
            });
          }
        }
      }
    }

    db.documents.unshift(newDoc);
    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: 'CREATE_DOCUMENT',
      user: operatorName || 'System',
      details: `ออกเอกสาร ${docNo} (${newDoc.type}) ลูกค้า: ${newDoc.customerName} ยอดรวม: ฿${newDoc.totalAmount.toLocaleString()}`,
      timestamp: new Date().toISOString()
    });

    saveDB(db);
    res.json({ success: true, document: newDoc, data: db });
  });

  // Update Delivery Status
  app.post('/api/documents/status', (req, res) => {
    const { documentId, status, trackingNo, deliveryCompany, operatorName } = req.body;
    const doc = db.documents.find(d => d.id === documentId);
    if (!doc) return res.status(404).json({ error: 'ไม่พบเอกสาร' });

    doc.deliveryStatus = status;
    if (trackingNo) doc.trackingNo = trackingNo;
    if (deliveryCompany) doc.deliveryCompany = deliveryCompany;

    const statusTextTH = status === 'DELIVERED' ? 'จัดส่งสำเร็จ' : status === 'IN_TRANSIT' ? 'อยู่ระหว่างจัดส่ง' : status === 'PREPARING' ? 'กำลังเตรียมสินค้า' : 'ยกเลิกรายการ';

    db.notifications.unshift({
      id: `n-${Date.now()}`,
      title: `อัปเดตสถานะการจัดส่ง (${doc.documentNo})`,
      message: `เอกสาร ${doc.documentNo} ถึงลูกค้า ${doc.customerName} สถานะเปลี่ยนเป็น: ${statusTextTH}`,
      type: status === 'DELIVERED' ? 'success' : 'info',
      timestamp: new Date().toISOString(),
      read: false
    });

    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: 'UPDATE_DELIVERY_STATUS',
      user: operatorName || 'System',
      details: `อัปเดตสถานะส่งของ ${doc.documentNo} -> ${statusTextTH}`,
      timestamp: new Date().toISOString()
    });

    saveDB(db);
    res.json({ success: true, data: db });
  });

  // User Approval / Management by Admin
  app.post('/api/users/approve', (req, res) => {
    const { userId, approved, role, operatorName } = req.body;
    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });

    if (approved !== undefined) user.approved = approved;
    if (role) user.role = role;

    db.logs.unshift({
      id: `log-${Date.now()}`,
      action: 'USER_ROLE_CHANGE',
      user: operatorName || 'Admin',
      details: `ปรับสิทธิ์ผู้ใช้ ${user.name} (${user.email}): สถานะอนุมัติ = ${user.approved}, บทบาท = ${user.role}`,
      timestamp: new Date().toISOString()
    });

    saveDB(db);
    res.json({ success: true, data: db });
  });

  // Backup Endpoints
  app.get('/api/backups', (req, res) => {
    try {
      const files = fs.readdirSync(BACKUPS_DIR);
      const backupList = files.map(file => {
        const filePath = path.join(BACKUPS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          id: file,
          filename: file,
          size: `${(stats.size / 1024).toFixed(1)} KB`,
          createdAt: stats.mtime.toISOString(),
          auto: file.startsWith('auto-')
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(backupList);
    } catch (err) {
      res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลรายการสำรองได้' });
    }
  });

  app.post('/api/backups/create', (req, res) => {
    const { operatorName } = req.body;
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `manual-backup-${timestamp}.json`;
      const filePath = path.join(BACKUPS_DIR, filename);
      fs.writeFileSync(filePath, JSON.stringify(db, null, 2), 'utf-8');

      db.logs.unshift({
        id: `log-${Date.now()}`,
        action: 'CREATE_BACKUP',
        user: operatorName || 'Admin',
        details: `สร้างไฟล์สำรองข้อมูลแบบ Manual: ${filename}`,
        timestamp: new Date().toISOString()
      });
      saveDB(db);

      res.json({ success: true, filename, data: db });
    } catch (err) {
      res.status(500).json({ error: 'สร้างไฟล์สำรองไม่สำเร็จ' });
    }
  });

  app.post('/api/backups/restore', (req, res) => {
    const { filename, backupData, operatorName } = req.body;
    try {
      let targetState: DBState | null = null;
      if (backupData) {
        targetState = backupData;
      } else if (filename) {
        const filePath = path.join(BACKUPS_DIR, filename);
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, 'utf-8');
          targetState = JSON.parse(raw);
        }
      }

      if (!targetState || !targetState.products) {
        return res.status(400).json({ error: 'ไฟล์สำรองไม่ถูกต้อง หรือข้อมูลสูญหาย' });
      }

      db = targetState;
      db.logs.unshift({
        id: `log-${Date.now()}`,
        action: 'RESTORE_BACKUP',
        user: operatorName || 'Admin',
        details: `คืนค่าระบบจากไฟล์สำรองข้อมูล (${filename || 'uploaded-file'})`,
        timestamp: new Date().toISOString()
      });
      saveDB(db);

      res.json({ success: true, message: 'คืนค่าสำรองข้อมูลสำเร็จเรียบร้อย', data: db });
    } catch (err) {
      res.status(500).json({ error: 'เกิดข้อผิดพลาดขณะคืนค่าไฟล์สำรอง' });
    }
  });

  // Server-Side Gemini AI Endpoint
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { message, conversationHistory } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          reply: '⚠️ ไม่พบคีย์ GEMINI_API_KEY ในระบบ โปรดระบุคีย์ในเมนู Secrets ด้านบนเพื่อใช้งาน AI วิเคราะห์สต็อค'
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Context of current inventory
      const lowStockItems = db.products.filter(p => p.quantity <= p.minQuantity);
      const totalInventoryVal = db.products.reduce((acc, p) => acc + (p.quantity * p.costPrice), 0);
      const totalSalesVal = db.documents.reduce((acc, d) => acc + d.totalAmount, 0);

      const systemInstruction = `คุณคือ "StockSmart AI" ผู้ช่วยอัจฉริยะวิเคราะห์คลังสินค้าและระบบ POS ประจำแอปพลิเคชัน
หน้าที่ของคุณคือช่วยวิเคราะห์สต็อคสินค้า แนะนำการสั่งซื้อสินค้าล่วงหน้า วิเคราะห์ยอดขาย เเละตอบคำถามเกี่ยวกับระบบบริหารจัดการคลังสินค้า

ข้อมูลสรุปปัจจุบันในระบบ:
- สินค้าทั้งหมดในคลัง: ${db.products.length} รายการ
- สินค้าใกล้หมด (Low Stock): ${lowStockItems.length} รายการ (${lowStockItems.map(i => `${i.name}: เหลือ ${i.quantity} ${i.unit}`).join(', ') || 'ไม่มี'})
- มูลค่าสต็อคสินค้ารวม (ราคาทุน): ฿${totalInventoryVal.toLocaleString()}
- ยอดขายสุทธิจากเอกสาร: ฿${totalSalesVal.toLocaleString()}
- รายการสินค้าทั้งหมด:
${db.products.map(p => `- [${p.code}] ${p.name} (คงเหลือ: ${p.quantity} ${p.unit}, ราคาขาย: ฿${p.sellingPrice}, จุดเตือน: ${p.minQuantity})`).join('\n')}

คำแนะนำการตอบ:
- ตอบด้วยภาษาไทยที่สุภาพ เป็นมิตร กระชับ เข้าใจง่าย และให้ข้อมูลตัวเลขที่ถูกต้องจากคลังสินค้า
- เมื่อถามเกี่ยวกับการสั่งสินค้าเพิ่ม ให้เจาะจงสินค้าที่ใกล้หมดเตือนเป็นพิเศษ
- สรุปข้อมูลเป็น Bullet point หรือ ตาราง เมื่อต้องแสดงรายการสถิติ`;

      // Build chat input
      const promptText = `คำถามจากผู้ใช้: ${message}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      const reply = response.text || 'ขออภัย ไม่สามารถประมวลผลคำตอบได้ในขณะนี้';
      res.json({ reply });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({
        reply: `เกิดข้อผิดพลาดจาก AI: ${error?.message || 'โปรดลองใหม่อีกครั้ง'}`
      });
    }
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
