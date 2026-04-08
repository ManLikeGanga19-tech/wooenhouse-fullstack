// src/lib/utils/exporters.ts
import Papa from 'papaparse';
import { Contact, NewsletterSubscriber, Quote } from '@/types';
import { formatDate, formatCurrency } from './formatters';

// ============================================
// CSV EXPORT FOR CONTACTS
// ============================================
export const exportContactsToCSV = (contacts: Contact[]) => {
    const csvData = contacts.map(contact => ({
        'Name': contact.name,
        'Email': contact.email,
        'Phone': contact.phone,
        'Service Type': contact.serviceType,
        'Location': contact.location,
        'Budget': contact.budget,
        'Timeline': contact.timeline,
        'Status': contact.status,
        'Priority': contact.priority || 'normal',
        'Message': contact.message,
        'Notes': contact.notes || '',
        'Created At': formatDate(contact.createdAt, 'yyyy-MM-dd HH:mm'),
        'Contacted At': contact.contactedAt ? formatDate(contact.contactedAt, 'yyyy-MM-dd HH:mm') : '',
    }));

    const csv = Papa.unparse(csvData);
    downloadCSV(csv, `contacts-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`);
};

// ============================================
// CSV EXPORT FOR NEWSLETTER
// ============================================
export const exportNewsletterToCSV = (subscribers: NewsletterSubscriber[]) => {
    const csvData = subscribers.map(subscriber => ({
        'Email': subscriber.email,
        'Name': subscriber.name || '',
        'Status': subscriber.status,
        'Source': subscriber.source,
        'Subscribed At': formatDate(subscriber.subscribedAt, 'yyyy-MM-dd HH:mm'),
        'Unsubscribed At': subscriber.unsubscribedAt ? formatDate(subscriber.unsubscribedAt, 'yyyy-MM-dd HH:mm') : '',
    }));

    const csv = Papa.unparse(csvData);
    downloadCSV(csv, `newsletter-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`);
};

// ============================================
// CSV EXPORT FOR QUOTES
// ============================================
export const exportQuotesToCSV = (quotes: Quote[]) => {
    const csvData = quotes.map(quote => ({
        'Quote Number': quote.quoteNumber,
        'Customer Name': quote.customerName,
        'Customer Email': quote.customerEmail,
        'Customer Phone': quote.customerPhone || '',
        'House Type': quote.houseType,
        'Location': quote.location,
        'Base Price': formatCurrency(quote.basePrice),
        'Total Price': formatCurrency(quote.totalPrice),
        'Discount': formatCurrency(quote.discount),
        'Final Price': formatCurrency(quote.finalPrice),
        'Status': quote.status,
        'Payment Terms': quote.paymentTerms || '',
        'Delivery Timeline': quote.deliveryTimeline || '',
        'Validity Period': quote.validityPeriod,
        'Created At': formatDate(quote.createdAt, 'yyyy-MM-dd HH:mm'),
        'Sent At': quote.sentAt ? formatDate(quote.sentAt, 'yyyy-MM-dd HH:mm') : '',
    }));

    const csv = Papa.unparse(csvData);
    downloadCSV(csv, `quotes-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`);
};

// ============================================
// DOWNLOAD CSV HELPER
// ============================================
const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// ============================================
// EXPORT SINGLE CONTACT TO PDF (Future)
// ============================================
export const exportContactToPDF = (contact: Contact) => {
    // TODO: Implement PDF export when backend is ready
    console.log('PDF export coming soon', contact);
};