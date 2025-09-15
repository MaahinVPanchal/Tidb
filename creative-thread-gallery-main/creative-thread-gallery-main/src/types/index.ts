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