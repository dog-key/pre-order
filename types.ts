export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  category: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  distance: string; // e.g., "1.2 km"
  imageUrl: string;
  address: string;
  menu: MenuItem[];
}

export enum OrderStatus {
  PENDING = 'Pending',
  PREPARING = 'Preparing',
  READY = 'Ready for Pickup',
  COMPLETED = 'Picked Up',
  REJECTED = 'Rejected'
}

export interface CartItem extends MenuItem {
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  pickupTime: string; // ISO string or simple time string
  createdAt: string;
  qrCodeData: string;
}

export enum AppView {
  SPLASH = 'SPLASH',
  HOME = 'HOME',
  RESTAURANT_DETAILS = 'RESTAURANT_DETAILS',
  CART = 'CART',
  ORDERS = 'ORDERS',
  PROFILE = 'PROFILE',
  MERCHANT_DASHBOARD = 'MERCHANT_DASHBOARD'
}

export type Category = 'Food' | 'Groceries' | 'Pharmacy' | 'Cafe';
