// src/lib/utils/formatters.ts
import { format, formatDistanceToNow } from 'date-fns';

// ============================================
// DATE FORMATTERS
// ============================================
export const formatDate = (date: Date | string, formatStr: string = 'MMM dd, yyyy'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr);
};

export const formatDateTime = (date: Date | string): string => {
    return formatDate(date, 'MMM dd, yyyy HH:mm');
};

export const formatRelativeTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
};

// ============================================
// CURRENCY FORMATTERS
// ============================================
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-KE').format(num);
};

// ============================================
// PHONE FORMATTERS
// ============================================
export const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    // Format Kenyan numbers
    if (cleaned.startsWith('254')) {
        return `+254 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }

    if (cleaned.startsWith('0')) {
        return `+254 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }

    return phone;
};

// ============================================
// TEXT FORMATTERS
// ============================================
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text: string): string => {
    return text
        .split(' ')
        .map(word => capitalizeFirst(word))
        .join(' ');
};

// ============================================
// PERCENTAGE FORMATTERS
// ============================================
export const formatPercentage = (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`;
};

// ============================================
// STATUS FORMATTERS
// ============================================
export const getStatusBadgeColor = (status: string): string => {
    const colors: Record<string, string> = {
        new: 'bg-blue-100 text-blue-800',
        contacted: 'bg-amber-100 text-amber-800',
        quoted: 'bg-purple-100 text-purple-800',
        converted: 'bg-green-100 text-green-800',
        closed: 'bg-gray-100 text-gray-800',
        draft: 'bg-gray-100 text-gray-800',
        sent: 'bg-blue-100 text-blue-800',
        viewed: 'bg-purple-100 text-purple-800',
        accepted: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        expired: 'bg-gray-100 text-gray-800',
        active: 'bg-green-100 text-green-800',
        unsubscribed: 'bg-gray-100 text-gray-800',
    };

    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
};