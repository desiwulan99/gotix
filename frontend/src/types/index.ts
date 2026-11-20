export type Role = 'CUSTOMER' | 'ADMIN';

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
  totalQuota: number;
  reservedQuota: number;
  paidQuota: number;
  remainingQuota: number;
  isSoldOut: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  imageUrl?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  isSoldOut: boolean;
  ticketTypes: TicketType[];
}

export interface OrderItem {
  id: string;
  ticketTypeId: string;
  quantity: number;
  unitPrice: number;
  ticketType?: TicketType;
}

export interface Order {
  id: string;
  userId: string;
  eventId: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  totalAmount: number;
  expiresAt: string;
  createdAt: string;
  event?: Event;
  items: OrderItem[];
  tickets?: Ticket[];
  user?: User;
}

export interface Ticket {
  id: string;
  ticketCode: string;
  orderId: string;
  ticketTypeId: string;
  status: 'VALID' | 'USED' | 'CANCELLED';
  issuedAt: string;
  ticketType?: TicketType;
  order?: Order;
}
