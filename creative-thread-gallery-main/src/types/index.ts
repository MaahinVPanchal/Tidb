export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  materials: string[];
  care_instructions: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface Design {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  materials: string[];
  care_instructions: string;
  image_urls: string[];
  user_id: string;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface Address {
  id?: string;
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  totalAmount: number;
  shippingCost: number;
  taxAmount: number;
  finalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string;
  razorpayOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    address: string;
  };
  theme: {
    color: string;
  };
  handler: (response: any) => void;
  modal: {
    ondismiss: () => void;
  };
}