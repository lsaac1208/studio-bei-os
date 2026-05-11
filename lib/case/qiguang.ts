/**
 * 案例 01 栖光摄影 — 数据模型 + 默认 seed
 * 完全 demo 性质，存于浏览器 localStorage，刷新可重置。
 */

import { addDays } from "./format";

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
  mark: string;
  desc: string;
};

export type Appointment = {
  id: string;
  customer: string;
  service: string;
  date: string;
  time: string;
  phone: string;
  note: string;
  status: AppointmentStatus;
  createdAt: string;
};

export const SERVICES: Service[] = [
  {
    id: "S01",
    name: "城市轻写真",
    duration: 90,
    price: 880,
    mark: "光",
    desc: "60 张精修 · 2 套场景",
  },
  {
    id: "S02",
    name: "闺蜜双人照",
    duration: 120,
    price: 1280,
    mark: "影",
    desc: "80 张精修 · 化妆造型",
  },
  {
    id: "S03",
    name: "主理人形象照",
    duration: 60,
    price: 680,
    mark: "形",
    desc: "30 张精修 · 单一妆造",
  },
  {
    id: "S04",
    name: "周末出片日",
    duration: 180,
    price: 1980,
    mark: "日",
    desc: "全天跟拍 · 100 张精修",
  },
];

export const TIME_SLOTS = ["09:30", "11:00", "14:00", "16:30", "19:00"];

export const createDefaultAppointments = (): Appointment[] => [
  {
    id: "A001",
    customer: "林女士",
    service: "城市轻写真",
    date: addDays(0),
    time: "10:00",
    phone: "138****0821",
    note: "想要日系胶片感",
    status: "confirmed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "A002",
    customer: "陈小姐",
    service: "闺蜜双人照",
    date: addDays(0),
    time: "14:00",
    phone: "136****7230",
    note: "两位都需要妆造",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "A003",
    customer: "王同学",
    service: "主理人形象照",
    date: addDays(0),
    time: "16:30",
    phone: "159****5612",
    note: "毕业用",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "A004",
    customer: "Tessa",
    service: "周末出片日",
    date: addDays(2),
    time: "09:30",
    phone: "186****0123",
    note: "婚前纪念",
    status: "confirmed",
    createdAt: new Date().toISOString(),
  },
];
