// src/types/index.ts

// ============================================
// CONTACT TYPES
// ============================================
export interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    serviceType: 'wooden-house' | 'carpentry' | 'consultation' | 'other';
    location: string;
    budget: 'under-500k' | '500k-1m' | '1m-2m' | '2m-5m' | 'over-5m' | 'flexible';
    timeline: 'urgent' | '1-3months' | '3-6months' | '6-12months' | 'planning';
    message: string;
    status: 'new' | 'contacted' | 'quoted' | 'converted' | 'closed';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    notes?: string;
    createdAt: Date;
    updatedAt?: Date;
    contactedAt?: Date;
}

export interface ContactFilters {
    search: string;
    status: string;
    serviceType: string;
    dateFrom?: Date;
    dateTo?: Date;
}

// ============================================
// NEWSLETTER TYPES
// ============================================
export interface NewsletterSubscriber {
    id: string;
    email: string;
    name?: string;
    status: 'active' | 'unsubscribed';
    source: 'website' | 'contact-form' | 'manual';
    subscribedAt: Date;
    unsubscribedAt?: Date;
}

// ============================================
// QUOTE TYPES (ENTERPRISE-GRADE)
// ============================================

/**
 * QuoteSummary
 * Used in:
 * - Quotes table
 * - Dashboard stats
 * - Search & filters
 */
export interface Quote {
    id: string;
    quoteNumber: string;
    contactId?: string;

    customerName: string;
    customerEmail: string;
    customerPhone?: string;

    // House Details
    houseType: '2-bedroom' | '3-bedroom' | 'cabin' | 'custom';
    houseSize?: string;
    location: string;

    // Pricing (SUMMARY ONLY)
    basePrice: number;
    additionalCosts: AdditionalCost[];
    totalPrice: number;
    discount: number;
    finalPrice: number;

    // Terms
    paymentTerms?: string;
    deliveryTimeline?: string;
    validityPeriod: string;

    // Status
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
    notes?: string;

    // Timestamps
    createdAt: Date;
    updatedAt?: Date;
    sentAt?: Date;
    viewedAt?: Date;
    acceptedAt?: Date;
}

/**
 * QuoteDetails
 * (NOT USED YET — backend / PDF ready)
 */
export interface QuoteDetails extends Quote {
    items: QuoteItem[];
    subtotal: number;
    tax: number;
    totalWithTax: number;
}

export interface QuoteItem {
    id: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface AdditionalCost {
    id: string;
    item: string;
    description?: string;
    cost: number;
}

// ============================================
// DASHBOARD TYPES
// ============================================
export interface DashboardStats {
    totalContacts: number;
    pendingContacts: number;
    activeSubscribers: number;
    quotesThisMonth: number;
    contactsThisMonth: number;
    conversionRate: number;
}

export interface ActivityItem {
    id: string;
    type: 'contact' | 'newsletter' | 'quote' | 'status_change';
    title: string;
    description: string;
    timestamp: Date;
    icon?: string;
}

export interface ChartData {
    date: string;
    contacts: number;
    quotes: number;
}

// ============================================
// AUTH TYPES
// ============================================
export interface AuthUser {
    email: string;
    name: string;
    role: 'admin';
    isAuthenticated: boolean;
}

// ============================================
// LABEL MAPPINGS
// ============================================
export const SERVICE_TYPE_LABELS: Record<Contact['serviceType'], string> = {
    'wooden-house': 'Wooden House Construction',
    'carpentry': 'General Carpentry',
    'consultation': 'Design Consultation',
    'other': 'Other Services',
};

export const BUDGET_LABELS: Record<Contact['budget'], string> = {
    'under-500k': 'Under 500K',
    '500k-1m': '500K - 1M',
    '1m-2m': '1M - 2M',
    '2m-5m': '2M - 5M',
    'over-5m': 'Over 5M',
    'flexible': 'Flexible',
};

export const TIMELINE_LABELS: Record<Contact['timeline'], string> = {
    'urgent': 'Urgent (Within 1 month)',
    '1-3months': '1-3 months',
    '3-6months': '3-6 months',
    '6-12months': '6-12 months',
    'planning': 'Just planning',
};

export const STATUS_LABELS: Record<Contact['status'], string> = {
    'new': 'New',
    'contacted': 'Contacted',
    'quoted': 'Quoted',
    'converted': 'Converted',
    'closed': 'Closed',
};

export const HOUSE_TYPE_LABELS: Record<Quote['houseType'], string> = {
    '2-bedroom': '2-Bedroom Bungalow',
    '3-bedroom': '3-Bedroom House',
    'cabin': 'Small Cabin',
    'custom': 'Custom Design',
};
