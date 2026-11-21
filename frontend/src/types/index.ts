export type Role = 'BUYER' | 'ADMIN' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  quota: number;
  reservedCount: number;
  remaining: number;
  soldOut: boolean;
  // Aliases for compatibility
  totalQuota?: number;
  reservedQuota?: number;
  paidQuota?: number;
  remainingQuota?: number;
  isSoldOut?: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  eventDate?: string;
  imageUrl?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  soldOut: boolean;
  isSoldOut?: boolean;
  ticketTypes: TicketType[];
}

export interface OrderItem {
  id: string;
  ticketTypeId: string;
  quantity: number;
  unitPrice: number;
  ticketType?: TicketType;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  paymentMethod: string;
  paidAt?: string;
}

export interface Ticket {
  id: string;
  code: string;
  ticketCode?: string; // alias
  orderId: string;
  orderItemId: string;
  seq: number;
  ticketTypeId: string;
  userId: string;
  status: 'VALID' | 'USED' | 'CANCELLED';
  issuedAt: string;
  ticketType?: TicketType;
  order?: Order;
}

export interface Order {
  id: string;
  userId: string;
  eventId: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  totalAmount: number;
  expiresAt: string;
  paidAt?: string;
  cancelledAt?: string;
  createdAt: string;
  event?: Event;
  items: OrderItem[];
  payment?: Payment;
  tickets?: Ticket[];
  user?: User;
}
