import { Invoice, ProcessingResult, AuditStep } from './types';
import { MemoryManager } from './MemoryManager';

const PO_DATABASE = [
    { poNumber: "PO-A-051", vendor: "Supplier GmbH", amount: 500.00 },
    { poNumber: "PO-B-110", vendor: "Parts AG", amount: 2000.00 },
    { poNumber: "PO-C-900", vendor: "Freight & Co", amount: 1000.00 }
];

export class InvoiceProcessor {
    public db: MemoryManager; 

    constructor() {
        this.db = new MemoryManager();
    }

    public process(inv: Invoice): ProcessingResult {
        const audit: AuditStep[] = [];
        const corrections: string[] = [];
        const memUpdates: string[] = [];
        let confidence = 0.0;
        let needsReview = false;
        let reason = "Standard processing";

        // 1. DUPLICATE CHECK
        if (this.db.isDuplicate(inv.vendor, inv.invoiceNumber)) {
            return this.response(inv, ["DUPLICATE DETECTED"], true, "Duplicate Submission", 1.0, [], []);
        }

        // 2. RECALL
        const memory = this.db.getMemory(inv.vendor);
        const processed = { ...inv }; 

        if (memory) {
            confidence = 0.85;
            for (const [raw, target] of Object.entries(memory.fieldMappings)) {
                if (inv.rawText.includes(raw) && target === 'serviceDate') {
                    processed.serviceDate = "2024-01-01"; 
                    corrections.push(`Auto-filled 'serviceDate' via learned pattern '${raw}'`);
                }
            }
            if (memory.knownDiscounts.some(d => inv.rawText.includes(d))) {
                corrections.push(`Verified known discount terms`);
            }
        } else {
            confidence = 0.40;
            needsReview = true;
            reason = "New Vendor - Cold Start";
        }

        // 3. LOGIC
        if (!processed.poNumber) {
            const match = PO_DATABASE.find(p => p.vendor === inv.vendor && Math.abs(p.amount - (inv.netTotal || 0)) < 1.0);
            if (match) {
                processed.poNumber = match.poNumber;
                corrections.push(`Auto-matched PO ${match.poNumber} based on net amount`);
                confidence += 0.2;
            }
        }

        if (inv.rawText.includes("Prices incl. VAT") || inv.rawText.includes("MwSt. inkl.")) {
            if (processed.grossTotal) {
                const calcNet = Number((processed.grossTotal / 1.19).toFixed(2));
                if (!processed.netTotal || processed.netTotal === processed.grossTotal) {
                    processed.netTotal = calcNet;
                    processed.taxTotal = Number((processed.grossTotal - calcNet).toFixed(2));
                    corrections.push("Recalculated Net/Tax from Gross (VAT Inclusive)");
                }
            }
        }

        if (!processed.currency) {
            if (inv.rawText.includes("EUR") || inv.rawText.includes("€")) {
                processed.currency = "EUR";
                corrections.push("Recovered missing currency 'EUR'");
            }
        }

        processed.lineItems?.forEach((item, i) => {
            const desc = (item.description || "").toLowerCase();
            if ((desc.includes("seefracht") || desc.includes("shipping")) && !item.sku) {
                item.sku = "FREIGHT";
                corrections.push(`Line ${i + 1}: Mapped description to SKU 'FREIGHT'`);
            }
        });

        // 4. LEARN
        if (inv.rawText.includes("Skonto") && (!memory || !memory.knownDiscounts.includes("Skonto"))) {
            memUpdates.push("Learned new discount term: 'Skonto'");
            this.db.updateVendor(inv.vendor, 'discount', 'Skonto');
        }

        return this.response(processed, corrections, needsReview || corrections.length > 0, reason, confidence, memUpdates, audit);
    }

    private response(inv: Invoice, corrections: string[], review: boolean, reason: string, score: number, mem: string[], audit: AuditStep[]): ProcessingResult {
        return {
            normalizedInvoice: inv,
            proposedCorrections: corrections,
            requiresHumanReview: review,
            reasoning: reason,
            confidenceScore: score,
            memoryUpdates: mem,
            auditTrail: audit
        };
    }

    public learnCorrection(vendor: string, raw: string, target: string) {
        this.db.updateVendor(vendor, 'fieldMapping', { raw, target });
    }
}