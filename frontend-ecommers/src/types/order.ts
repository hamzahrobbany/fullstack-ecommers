export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}
