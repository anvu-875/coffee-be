export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  createdAt: Date;
}

export interface Order {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  status: string;
  createdAt: Date;
}
