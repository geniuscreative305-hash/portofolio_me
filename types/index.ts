import { OrderStatus, PortfolioStatus } from "@prisma/client";

// ─── Re-export Prisma Enums ───────────────────────────────────────────────────
export { OrderStatus, PortfolioStatus };

// ─── API Response Types ───────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Service Types ────────────────────────────────────────────────────────────
export interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  shortDesc: string;
  priceStart: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Portfolio Types ──────────────────────────────────────────────────────────
export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  shortDesc: string;
  fullDescription: string;
  thumbnailUrl: string;
  techStack: string[];
  liveDemoUrl: string | null;
  relatedServiceId: string | null;
  relatedService?: { id: string; title: string; slug: string } | null;
  status: PortfolioStatus;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Order Types ──────────────────────────────────────────────────────────────
export interface OrderItem {
  id: string;
  orderCode: string;
  clientName: string;
  clientWhatsapp: string;
  serviceId: string;
  service?: { title: string; slug: string };
  projectBrief: string;
  budgetEstimate: string;
  status: OrderStatus;
  adminNote: string | null;
  hasSubmittedTestimonial: boolean;
  createdAt: string;
  updatedAt: string;
}

// Public tracker — no WhatsApp exposed
export type TrackerOrderItem = Omit<OrderItem, "clientWhatsapp"> & {
  adminWhatsapp?: string;
};

// ─── Testimonial Types ────────────────────────────────────────────────────────
export interface TestimonialItem {
  id: string;
  orderCode: string;
  clientName: string;
  clientRole: string;
  rating: number;
  content: string;
  isApproved: boolean;
  createdAt: string;
}

// ─── Activity Log Types ───────────────────────────────────────────────────────
export interface ActivityLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  createdAt: string;
}

// ─── SiteSetting Types ────────────────────────────────────────────────────────
export interface SiteSettingItem {
  id: string;
  ownerName: string;
  profilePhotoUrl: string | null;
  aboutBio: string | null;
  experienceYears: number;
  heroRoles: string[];
  heroHeadline: string;
  heroSubheadline: string;
  whatsappNumber: string;
  isOpenOrder: boolean;
  updatedAt: string;
  // adminPinHash is never returned to client
}

// ─── Form Types ───────────────────────────────────────────────────────────────
export interface OrderFormData {
  clientName: string;
  clientWhatsapp: string;
  serviceId: string;
  projectBrief: string;
  budgetEstimate: string;
}

export interface TestimonialFormData {
  orderCode: string;
  clientName: string;
  clientRole: string;
  rating: number;
  content: string;
}

// ─── Bulk Action Types ────────────────────────────────────────────────────────
export interface BulkActionPayload {
  ids: string[];
  action: "delete" | "approve" | "unapprove" | "activate" | "deactivate" | "publish" | "draft";
}

// ─── Toast Types ─────────────────────────────────────────────────────────────
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

