import { Product, StockMovement, DocumentInfo, User, AppNotification, Customer } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'ปณิธาน ศรีบุญเรือง',
    email: 'auzza38@gmail.com',
    role: 'admin',
    phone: '082-369-2868',
    department: 'ผู้ดูแลระบบ (Admin) KAEN GREEN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    approved: true,
    createdAt: '2026-01-01T08:00:00Z',
    loginMethod: 'google'
  },
  {
    id: 'usr-member-1',
    name: 'สุดา เจ้าหน้าที่สต็อค (Member)',
    email: 'suda@kaengreen.com',
    role: 'member',
    phone: '089-876-5432',
    department: 'แผนกคลังและจัดส่ง Cold Chain',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    approved: true,
    createdAt: '2026-01-15T09:30:00Z',
    loginMethod: 'email'
  },
  {
    id: 'usr-member-2',
    name: 'กิตติศักดิ์ พนักงานขาย POS',
    email: 'kitti@kaengreen.com',
    role: 'member',
    phone: '086-555-1234',
    department: 'หน้าร้าน POS ขอนแก่น',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    approved: true,
    createdAt: '2026-07-28T07:00:00Z',
    loginMethod: 'email'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'โรงแรม Ad Lib Khon Kaen (HoReCa Partner)',
    recipientName: 'เชฟกิตติ (หัวหน้าห้องอาหาร)',
    customerType: 'B2B_HORECA',
    defaultShippingMethod: 'ส่งเอง',
    taxId: '0405562001234',
    phone: '043-123456',
    email: 'purchasing@adlibkhonkaen.com',
    address: '999 ถนนศรีจันทร์ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000',
    notes: 'ลูกค้า B2B HoReCa ประจำ · จัดส่งระบบ Cold Chain รอบ 07:30 น. ทุกวัน',
    createdAt: '2026-01-10T10:00:00Z'
  },
  {
    id: 'cust-2',
    name: 'บริษัท กรีนฮาร์เวสท์ ขอนแก่น จำกัด',
    recipientName: 'คุณสมศักดิ์ (แผนกจัดซื้อ)',
    customerType: 'CORPORATE',
    defaultShippingMethod: 'ขนส่งเอกชน',
    taxId: '0405559008888',
    phone: '081-999-8877',
    email: 'contact@greenharvest.co.th',
    address: '123/45 ถนนมิตรภาพ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000',
    notes: 'ต้องการใบรับรอง GAP แนบพร้อมใบส่งของทุกครั้ง',
    createdAt: '2026-02-01T11:00:00Z'
  },
  {
    id: 'cust-3',
    name: 'คุณแม่พิมพ์ใจ และครอบครัว (สมาชิก Family Box)',
    recipientName: 'คุณพิมพ์ใจ ใจดี',
    customerType: 'GENERAL',
    defaultShippingMethod: 'ลูกค้ารับเอง',
    taxId: '',
    phone: '086-777-6655',
    email: 'pimjai.family@gmail.com',
    address: '45/2 หมู่บ้านสีวลี ถนนมะลิวัลย์ อ.เมือง จ.ขอนแก่น 40000',
    notes: 'รับชุด Family Box 500g ทุกวันจันทร์และพฤหัสบดี',
    createdAt: '2026-03-15T14:30:00Z'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    code: '8850123456789',
    qrCode: 'KG-BAG-150',
    name: 'ผักสลัดคัดสด Premium Salad Mix (Salad Mix Bag)',
    category: 'Salad Mix Bag',
    unit: 'ถุง (150g)',
    costPrice: 32,
    sellingPrice: 55,
    quantity: 48,
    minQuantity: 15,
    location: 'ห้องเย็น Cold-A01',
    imageUrl: '/assets/aistudio/ChatGPT_Image_25__._._2569_17_08_27_d8eb9991.png',
    description: 'ผักสลัดรวมคัดพิเศษ ปลอดสารเคมี มาตรฐาน GAP ปลูกโดยเกษตรกรขอนแก่น บรรจุถุงซิปล็อกเก็บความสด 150 กรัม',
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'p-2',
    code: '8850123456790',
    qrCode: 'KG-PACK-BH',
    name: 'บัตเตอร์เฮด คัดพิเศษ (Butterhead Lettuce Premium Pack)',
    category: 'Premium Pack',
    unit: 'แพ็ค (200g)',
    costPrice: 38,
    sellingPrice: 65,
    quantity: 34,
    minQuantity: 15,
    location: 'ห้องเย็น Cold-A02',
    imageUrl: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&auto=format&fit=crop&q=80',
    description: 'ผักสลัดบัตเตอร์เฮดใบกรอบนุ่ม รสหวานธรรมชาติ บรรจุกล่องใสพรีเมียม 200 กรัม',
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'p-3',
    code: '8850123456800',
    qrCode: 'KG-PACK-GO',
    name: 'กรีนโอ๊ค ออร์แกนิค (Green Oak Premium Pack)',
    category: 'Premium Pack',
    unit: 'แพ็ค (200g)',
    costPrice: 35,
    sellingPrice: 60,
    quantity: 9, // Low stock
    minQuantity: 15,
    location: 'ห้องเย็น Cold-A03',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80',
    description: 'กรีนโอ๊คและเรดโอ๊คอินทรีย์ปลอดภัย มาตรฐาน Organic Thailand บรรจุกล่องพรีเมียม 200 กรัม',
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'p-4',
    code: '8850123456811',
    qrCode: 'KG-CUP-50',
    name: 'ผักพื้นบ้านคัดสดพร้อมทาน (Local Herbs & Veggies Cup)',
    category: 'Herb Cup',
    unit: 'ถ้วย (50g)',
    costPrice: 18,
    sellingPrice: 35,
    quantity: 42,
    minQuantity: 20,
    location: 'ห้องเย็น Cold-B01',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=80',
    description: 'ผักพื้นบ้านและสมุนไพรสดจากชุมชนขอนแก่น ล้างสะอาดพร้อมรับประทาน ขนาดถ้วย 50 กรัม',
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'p-5',
    code: '8850123456822',
    qrCode: 'KG-BOX-500',
    name: 'ชุดผักครอบครัวออร์แกนิค (KAEN GREEN Family Box)',
    category: 'Family Box',
    unit: 'กล่อง (500g)',
    costPrice: 95,
    sellingPrice: 159,
    quantity: 7, // Low stock
    minQuantity: 10,
    location: 'ห้องเย็น Cold-C01',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
    description: 'กล่องรวมผักสลัดและผักปลอดภัยสำหรับครอบครัว ขนาดสุดคุ้ม 500 กรัม สดใหม่ส่งตรงจากฟาร์ม',
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'p-6',
    code: '8850123456833',
    qrCode: 'KG-B2B-2000',
    name: 'กล่องวัตถุดิบผักสด HoReCa (B2B Solution Box)',
    category: 'B2B Solution',
    unit: 'กล่อง (2 กก.)',
    costPrice: 310,
    sellingPrice: 480,
    quantity: 25,
    minQuantity: 10,
    location: 'คลังจัดส่ง Cold-D01',
    imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&auto=format&fit=crop&q=80',
    description: 'วัตถุดิบผักสดคัดเกรดสำหรับโรงแรมและร้านอาหาร (HoReCa) ควบคุมอุณหภูมิ Cold Chain',
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

export const INITIAL_MOVEMENTS: StockMovement[] = [
  {
    id: 'm-1',
    productId: 'p-1',
    productCode: '8850123456789',
    productName: 'ผักสลัดคัดสด Premium Salad Mix (Salad Mix Bag)',
    type: 'IN',
    quantity: 55,
    balanceAfter: 55,
    refDocumentNo: 'LOT-KK-202607',
    note: 'รับผักสดรอบเช้าจากกลุ่มเกษตรกรไทขอนแก่น (GAP Certified)',
    createdBy: 'ปณิธาน ศรีบุญเรือง',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'm-2',
    productId: 'p-1',
    productCode: '8850123456789',
    productName: 'ผักสลัดคัดสด Premium Salad Mix (Salad Mix Bag)',
    type: 'SALE',
    quantity: 7,
    balanceAfter: 48,
    refDocumentNo: 'REC-202607-001',
    note: 'จำหน่ายหน้าร้าน POS',
    createdBy: 'กิตติศักดิ์ พนักงานขาย POS',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'm-3',
    productId: 'p-3',
    productCode: '8850123456800',
    productName: 'กรีนโอ๊ค ออร์แกนิค (Green Oak Premium Pack)',
    type: 'SALE',
    quantity: 16,
    balanceAfter: 9,
    refDocumentNo: 'DO-202607-001',
    note: 'จัดส่งลูกค้า B2B โรงแรม Ad Lib Khon Kaen',
    createdBy: 'สุดา เจ้าหน้าที่สต็อค (Member)',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

export const INITIAL_DOCUMENTS: DocumentInfo[] = [
  {
    id: 'doc-1',
    documentNo: 'DO-202607-001',
    type: 'DELIVERY_NOTE',
    customerId: 'cust-1',
    customerName: 'โรงแรม Ad Lib Khon Kaen (HoReCa Partner)',
    customerAddress: '999 ถนนศรีจันทร์ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000',
    customerTaxId: '0405562001234',
    customerPhone: '043-123456',
    recipientName: 'เชฟกิตติ (หัวหน้าห้องอาหาร)',
    shippingMethod: 'ส่งเอง',
    items: [
      {
        productCode: '8850123456833',
        productName: 'กล่องวัตถุดิบผักสด HoReCa (B2B Solution Box)',
        unit: 'กล่อง (2 กก.)',
        quantity: 4,
        unitPrice: 480,
        amount: 1920
      },
      {
        productCode: '8850123456800',
        productName: 'กรีนโอ๊ค ออร์แกนิค (Green Oak Premium Pack)',
        unit: 'แพ็ค (200g)',
        quantity: 10,
        unitPrice: 60,
        amount: 600
      }
    ],
    subtotal: 2520,
    tax: 176.4,
    discount: 0,
    totalAmount: 2696.4,
    paymentMethod: 'TRANSFER',
    deliveryStatus: 'IN_TRANSIT',
    trackingNo: 'KG-COLD-0891',
    deliveryCompany: 'KAEN GREEN Cold Chain',
    notes: 'ส่งที่จุดรับของห้องครัวหลัก อุณหภูมิรถควบคุม 4°C',
    issuedBy: 'สุดา เจ้าหน้าที่สต็อค (Member)',
    issuedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 14).toISOString()
  },
  {
    id: 'doc-2',
    documentNo: 'INV-202607-001',
    type: 'BILLING_NOTE',
    customerId: 'cust-2',
    customerName: 'บริษัท กรีนฮาร์เวสท์ ขอนแก่น จำกัด',
    customerAddress: '123/45 ถนนมิตรภาพ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000',
    customerTaxId: '0405559008888',
    customerPhone: '081-999-8877',
    recipientName: 'คุณสมศักดิ์ (แผนกจัดซื้อ)',
    shippingMethod: 'ขนส่งเอกชน',
    items: [
      {
        productCode: '8850123456790',
        productName: 'บัตเตอร์เฮด คัดพิเศษ (Butterhead Lettuce Premium Pack)',
        unit: 'แพ็ค (200g)',
        quantity: 20,
        unitPrice: 65,
        amount: 1300
      }
    ],
    subtotal: 1300,
    tax: 91,
    discount: 0,
    totalAmount: 1391,
    paymentMethod: 'CREDIT',
    deliveryStatus: 'DELIVERED',
    trackingNo: 'KG-EXP-1102',
    deliveryCompany: 'ขนส่งเอกชนควบคุมอุณหภูมิ',
    notes: 'ต้องการใบรับรอง GAP แนบพร้อมใบวางบิล',
    issuedBy: 'ปณิธาน ศรีบุญเรือง',
    issuedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 30).toISOString()
  },
  {
    id: 'doc-3',
    documentNo: 'REC-202607-001',
    type: 'RECEIPT',
    customerId: 'cust-3',
    customerName: 'คุณแม่พิมพ์ใจ และครอบครัว (สมาชิก Family Box)',
    customerAddress: '45/2 หมู่บ้านสีวลี ถนนมะลิวัลย์ อ.เมือง จ.ขอนแก่น 40000',
    customerPhone: '086-777-6655',
    recipientName: 'คุณพิมพ์ใจ ใจดี',
    shippingMethod: 'ลูกค้ารับเอง',
    items: [
      {
        productCode: '8850123456822',
        productName: 'ชุดผักครอบครัวออร์แกนิค (KAEN GREEN Family Box)',
        unit: 'กล่อง (500g)',
        quantity: 2,
        unitPrice: 159,
        amount: 318
      },
      {
        productCode: '8850123456789',
        productName: 'ผักสลัดคัดสด Premium Salad Mix (Salad Mix Bag)',
        unit: 'ถุง (150g)',
        quantity: 2,
        unitPrice: 55,
        amount: 110
      }
    ],
    subtotal: 428,
    tax: 0,
    discount: 0,
    totalAmount: 428,
    paymentMethod: 'PROMPTPAY',
    deliveryStatus: 'DELIVERED',
    issuedBy: 'กิตติศักดิ์ พนักงานขาย POS',
    issuedAt: new Date(Date.now() - 3600000 * 3).toISOString()
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-1',
    title: 'แจ้งเตือนสต็อคใกล้หมด (Low Stock)',
    message: 'กรีนโอ๊ค ออร์แกนิค (Green Oak Premium Pack) เหลือ 9 แพ็ค (ต่ำกว่าเกณฑ์ 15 แพ็ค)',
    type: 'warning',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false
  },
  {
    id: 'n-2',
    title: 'แจ้งเตือนสต็อคใกล้หมด (Low Stock)',
    message: 'ชุดผักครอบครัวออร์แกนิค (Family Box 500g) เหลือ 7 กล่อง (ต่ำกว่าเกณฑ์ 10 กล่อง)',
    type: 'warning',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    read: false
  },
  {
    id: 'n-3',
    title: 'จัดส่ง Cold Chain สำเร็จ',
    message: 'ใบส่งของ DO-202607-001 กำลังจัดส่งไปยัง โรงแรม Ad Lib Khon Kaen',
    type: 'success',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true
  }
];
