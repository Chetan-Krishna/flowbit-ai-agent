import { InvoiceProcessor } from './Processor';
import { Invoice } from './types';

const processor = new InvoiceProcessor();

const INCOMING_STREAM: Invoice[] = [
    {
        invoiceId: "INV-A-001",
        invoiceNumber: "INV-2024-001",
        vendor: "Supplier GmbH",
        netTotal: 2500.0,
        grossTotal: 2975.0,
        lineItems: [{ sku: "WIDGET-001", qty: 100, unitPrice: 25.0 }],
        rawText: "Rechnungsnr: INV-2024-001\nLeistungsdatum: 01.01.2024"
    },
    {
        invoiceId: "INV-B-002",
        invoiceNumber: "PA-7799",
        vendor: "Parts AG",
        netTotal: 1785.0, 
        grossTotal: 1785.0,
        lineItems: [{ sku: "BOLT-99", qty: 150, unitPrice: 10.0 }],
        rawText: "Invoice No: PA-7799\nPrices incl. VAT\nTotal: 1785.00 EUR"
    },
    {
        invoiceId: "INV-C-002",
        invoiceNumber: "FC-1002",
        vendor: "Freight & Co",
        netTotal: 1000.0,
        grossTotal: 1190.0,
        lineItems: [{ sku: null, description: "Seefracht / Shipping", qty: 1, unitPrice: 1000.0 }],
        rawText: "Invoice: FC-1002\nService: Seefracht\n2% Skonto"
    },
    {
        invoiceId: "INV-A-003",
        invoiceNumber: "INV-2024-003",
        vendor: "Supplier GmbH",
        poNumber: undefined, 
        netTotal: 500.0, 
        lineItems: [{ sku: "WIDGET-002", qty: 20, unitPrice: 25.0 }],
        rawText: "Rechnungsnr: INV-2024-003\nWidget Supply..."
    },
    {
        invoiceId: "INV-B-003",
        invoiceNumber: "PA-7810",
        vendor: "Parts AG",
        currency: undefined, 
        netTotal: 1000.0,
        rawText: "Invoice No: PA-7810\nCurrency: EUR"
    },
    {
        invoiceId: "INV-A-001-DUP",
        invoiceNumber: "INV-2024-001", 
        vendor: "Supplier GmbH",
        netTotal: 2500.0,
        rawText: "Duplicate copy..."
    }
];

async function runBatch() {
    console.log("\n FLOWBIT AGENT - DATA SIMULATION\n");

    for (const invoice of INCOMING_STREAM) {
        console.log(`\n Processing: ${invoice.invoiceId} (${invoice.vendor})`);
        
        let result = processor.process(invoice);

        // DEMO LOGIC: If we failed to get the date, teach and retry.
        if (invoice.vendor === "Supplier GmbH" && invoice.invoiceId === "INV-A-001" && result.proposedCorrections.length === 0) {
            console.log("     [Insight] System missed 'Leistungsdatum'.");
            console.log("     [Action] Applying Human Correction...");
            
            
            processor.learnCorrection("Supplier GmbH", "Leistungsdatum", "serviceDate");
            
            
            processor.db.clearDuplicate(invoice.vendor, invoice.invoiceNumber);

            console.log("     Re-processing with new memory...");
            result = processor.process(invoice);
        }

        if (result.proposedCorrections.length > 0) {
            result.proposedCorrections.forEach(fix => console.log(`    Correction: ${fix}`));
        } else {
            console.log("   ℹ  No corrections applied.");
        }
        
        if (result.memoryUpdates.length > 0) {
            console.log(`    Memory Update: ${result.memoryUpdates[0]}`);
        }
    }
    
}

runBatch();