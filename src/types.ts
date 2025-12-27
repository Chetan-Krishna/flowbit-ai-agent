export interface Invoice {
    invoiceId: string;       
    vendor: string;
    invoiceNumber: string;
    rawText: string;
    
    // Optional fields (mimicking imperfect extraction)
    invoiceDate?: string;
    serviceDate?: string;     // Target for learning
    currency?: string;
    poNumber?: string;        // Target for DB matching
    
    // Financials (PDF Source 14-17)
    netTotal?: number;
    taxRate?: number;
    taxTotal?: number;
    grossTotal?: number;
    
    lineItems?: LineItem[];
}

export interface LineItem {
    sku?: string | null;
    description?: string;
    qty: number;
    unitPrice: number;
}

export interface ProcessingResult {
    normalizedInvoice: Invoice;
    proposedCorrections: string[];
    requiresHumanReview: boolean;
    reasoning: string;
    confidenceScore: number;
    memoryUpdates: string[];
    auditTrail: AuditStep[];
}

export interface AuditStep {
    step: string;
    timestamp: string;
    details: string;
}

export interface VendorMemory {
    vendorName: string;
    fieldMappings: Record<string, string>;
    knownDiscounts: string[];
}

export interface MemoryStore {
    vendors: Record<string, VendorMemory>;
    processedInvoices: string[]; // For duplicate detection
}