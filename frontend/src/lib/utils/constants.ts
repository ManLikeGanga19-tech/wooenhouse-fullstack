// src/lib/utils/constants.ts

// ============================================
// BRAND COLORS
// ============================================
export const BRAND_COLORS = {
    // Primary browns
    primary: '#8B5E3C',
    primaryLight: '#C49A6C',
    primaryDark: '#5D3A1A',

    // Status colors
    new: '#3B82F6',        // Blue
    contacted: '#F59E0B',  // Yellow/Amber
    quoted: '#8B5CF6',     // Purple
    converted: '#10B981',  // Green
    closed: '#6B7280',     // Gray

    // UI colors
    danger: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
} as const;

// ============================================
// STATUS CONFIGURATIONS
// ============================================
export const STATUS_CONFIG = {
    new: {
        label: 'New',
        color: BRAND_COLORS.new,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200',
    },
    contacted: {
        label: 'Contacted',
        color: BRAND_COLORS.contacted,
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-800',
        borderColor: 'border-amber-200',
    },
    quoted: {
        label: 'Quoted',
        color: BRAND_COLORS.quoted,
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        borderColor: 'border-purple-200',
    },
    converted: {
        label: 'Converted',
        color: BRAND_COLORS.converted,
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
    },
    closed: {
        label: 'Closed',
        color: BRAND_COLORS.closed,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200',
    },
} as const;

// ============================================
// PRIORITY CONFIGURATIONS
// ============================================
export const PRIORITY_CONFIG = {
    low: {
        label: 'Low',
        color: '#6B7280',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
    },
    normal: {
        label: 'Normal',
        color: '#3B82F6',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
    },
    high: {
        label: 'High',
        color: '#F59E0B',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
    },
    urgent: {
        label: 'Urgent',
        color: '#EF4444',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
    },
} as const;

// ============================================
// QUOTE STATUS CONFIGURATIONS
// ============================================
export const QUOTE_STATUS_CONFIG = {
    draft: {
        label: 'Draft',
        color: '#6B7280',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
    },
    sent: {
        label: 'Sent',
        color: '#3B82F6',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
    },
    viewed: {
        label: 'Viewed',
        color: '#8B5CF6',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
    },
    accepted: {
        label: 'Accepted',
        color: '#10B981',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
    },
    rejected: {
        label: 'Rejected',
        color: '#EF4444',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
    },
    expired: {
        label: 'Expired',
        color: '#6B7280',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
    },
} as const;

// ============================================
// NAVIGATION MENU
// ============================================
export const NAVIGATION_ITEMS = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
    },
    {
        title: 'Contacts',
        href: '/dashboard/contacts',
        icon: 'Users',
        badge: 'new',
    },
    {
        title: 'Newsletter',
        href: '/dashboard/newsletter',
        icon: 'Mail',
    },
    {
        title: 'Quotes',
        href: '/dashboard/quotes',
        icon: 'FileText',
    },
    {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: 'Settings',
    },
] as const;

// ============================================
// DEFAULT VALUES
// ============================================
export const DEFAULT_QUOTE_VALUES = {
    validityPeriod: '30 days',
    paymentTerms: '50% deposit, 50% on completion',
    deliveryTimeline: '2-3 weeks',
};

export const HOUSE_TYPE_PRICES = {
    'cabin': 200000,
    '2-bedroom': 500000,
    '3-bedroom': 800000,
    'custom': 0,
};

// ============================================
// PAGINATION
// ============================================
export const PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ============================================
// DATE FORMATS
// ============================================
export const DATE_FORMATS = {
    display: 'MMM dd, yyyy',
    displayWithTime: 'MMM dd, yyyy HH:mm',
    input: 'yyyy-MM-dd',
    full: 'EEEE, MMMM dd, yyyy',
} as const;