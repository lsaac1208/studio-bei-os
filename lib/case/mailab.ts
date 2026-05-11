/**
 * 案例 02 麦研所烘焙 — 数据模型 + 默认 seed
 * 商品库存 + 订单流转 + 近 7 日销售趋势（纯 demo，存于 localStorage）。
 */

export type OrderStatus = "paid" | "shipped" | "completed";

export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  safeStock: number;
  maxStock: number;
  mark: string;
};

export type Order = {
  id: string;
  customer: string;
  productId: string;
  productName: string;
  productMark: string;
  quantity: number;
  amount: number;
  status: OrderStatus;
  createdAt: string;
};

export const PRODUCTS_SEED: Product[] = [
  {
    id: "P001",
    name: "可颂礼盒 · 6 入",
    sku: "CR-006",
    price: 158,
    stock: 22,
    safeStock: 12,
    maxStock: 60,
    mark: "颂",
  },
  {
    id: "P002",
    name: "手作司康 · 4 入",
    sku: "SK-004",
    price: 78,
    stock: 6,
    safeStock: 12,
    maxStock: 50,
    mark: "司",
  },
  {
    id: "P003",
    name: "肉桂卷 · 8 入",
    sku: "CN-008",
    price: 128,
    stock: 16,
    safeStock: 10,
    maxStock: 40,
    mark: "桂",
  },
  {
    id: "P004",
    name: "私房磅蛋糕",
    sku: "PD-001",
    price: 168,
    stock: 4,
    safeStock: 8,
    maxStock: 30,
    mark: "糕",
  },
];

export const SPARK_SEED = [1240, 1820, 1560, 2030, 1880, 2410];

export const createDefaultOrders = (): Order[] => [
  {
    id: "SO260601",
    customer: "小红书 · 林同学",
    productId: "P001",
    productName: "可颂礼盒 · 6 入",
    productMark: "颂",
    quantity: 2,
    amount: 316,
    status: "paid",
    createdAt: new Date().toISOString(),
  },
  {
    id: "SO260602",
    customer: "线下顾客 · 张老师",
    productId: "P003",
    productName: "肉桂卷 · 8 入",
    productMark: "桂",
    quantity: 1,
    amount: 128,
    status: "paid",
    createdAt: new Date().toISOString(),
  },
  {
    id: "SO260603",
    customer: "公司团购 · 越秀文创",
    productId: "P001",
    productName: "可颂礼盒 · 6 入",
    productMark: "颂",
    quantity: 6,
    amount: 948,
    status: "shipped",
    createdAt: new Date().toISOString(),
  },
  {
    id: "SO260604",
    customer: "微信熟客 · 周姐",
    productId: "P002",
    productName: "手作司康 · 4 入",
    productMark: "司",
    quantity: 3,
    amount: 234,
    status: "completed",
    createdAt: new Date().toISOString(),
  },
];

export const stockStatus = (p: Product): "ok" | "low" | "out" => {
  if (p.stock <= 0) return "out";
  if (p.stock <= p.safeStock) return "low";
  return "ok";
};
