export type Role = 'admin' | 'member';

export type ShippingMethod = 'ส่งเอง' | 'ขนส่งเอกชน' | 'ลูกค้ารับเอง';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  department?: string;
  avatarUrl?: string;
  approved: boolean;
  suspended?: boolean;
  createdAt: string;
  password?: string;
  loginMethod?: 'email' | 'google';
}

export interface Customer {
  id: string;
  name: string; // ชื่อลูกค้า / บริษัท / ผู้รับสินค้า
  recipientName?: string; // ชื่อผู้รับสินค้า (กรณีแตกต่างจากชื่อสั่งซื้อ)
  customerType?: 'B2B_HORECA' | 'CORPORATE' | 'GENERAL';
  defaultShippingMethod?: ShippingMethod;
  taxId?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  code: string; // Barcode or SKU
  qrCode?: string;
  name: string;
  category: string;
  unit: string; // e.g. ชิ้น, กล่อง, กก., ถุง
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  minQuantity: number; // Alert threshold
  location: string; // e.g. A-01, คลัง 1
  imageUrl?: string;
  description?: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUST' | 'SALE' | 'RETURN';
  quantity: number;
  balanceAfter: number;
  refDocumentNo?: string;
  note?: string;
  createdBy: string;
  createdAt: string; // ISO String
}

export type DeliveryStatus = 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  total: number;
}

export interface DocumentInfo {
  id: string;
  documentNo: string; // e.g. INV-202607001, DO-202607001, REC-202607001
  type: 'DELIVERY_NOTE' | 'BILLING_NOTE' | 'RECEIPT'; // ใบส่งของ, ใบวางบิล, ใบเสร็จรับเงิน
  customerId?: string; // รหัสอ้างอิงเชื่อมโยงฐานข้อมูลลูกค้า/ผู้รับสินค้า
  customerName: string;
  recipientName?: string; // ผู้รับสินค้า
  customerAddress?: string;
  customerTaxId?: string;
  customerPhone?: string;
  shippingMethod?: ShippingMethod; // ส่งเอง, ขนส่งเอกชน, ลูกค้ารับเอง
  items: {
    productCode: string;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  subtotal: number;
  tax: number; // VAT 7%
  discount: number;
  totalAmount: number;
  paymentMethod?: 'CASH' | 'PROMPTPAY' | 'TRANSFER' | 'CREDIT';
  deliveryStatus: DeliveryStatus;
  trackingNo?: string;
  deliveryCompany?: string;
  notes?: string;
  issuedBy: string;
  issuedAt: string; // ISO date
  dueDate?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'error';
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface BackupRecord {
  id: string;
  filename: string;
  size: string;
  itemCount: number;
  movementCount: number;
  docCount: number;
  createdAt: string;
  auto: boolean;
}

export interface SystemLog {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: string;
}
