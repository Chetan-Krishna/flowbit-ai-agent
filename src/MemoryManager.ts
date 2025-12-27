import * as fs from 'fs';
import { MemoryStore, VendorMemory } from './types';

export class MemoryManager {
    private dbPath = './data/memory.json';
    private store: MemoryStore;

    constructor() {
        this.store = this.loadDb();
    }

    private loadDb(): MemoryStore {
        if (!fs.existsSync(this.dbPath)) {
            return { vendors: {}, processedInvoices: [] };
        }
        try {
            const data = fs.readFileSync(this.dbPath, 'utf-8');
            const parsed = JSON.parse(data);
            return {
                vendors: parsed.vendors || {},
                processedInvoices: parsed.processedInvoices || []
            };
        } catch (e) {
            return { vendors: {}, processedInvoices: [] };
        }
    }

    public commit(): void {
        fs.writeFileSync(this.dbPath, JSON.stringify(this.store, null, 2));
    }

    public getMemory(vendor: string): VendorMemory | null {
        return this.store.vendors[vendor] || null;
    }

    public isDuplicate(vendor: string, invoiceNum: string): boolean {
        const key = `${vendor}|${invoiceNum}`;
        if (this.store.processedInvoices.includes(key)) {
            return true;
        }
        this.store.processedInvoices.push(key);
        this.commit();
        return false;
    }

    
    public clearDuplicate(vendor: string, invoiceNum: string): void {
        const key = `${vendor}|${invoiceNum}`;
        this.store.processedInvoices = this.store.processedInvoices.filter(k => k !== key);
        this.commit();
    }
    

    public updateVendor(vendor: string, type: 'fieldMapping' | 'discount', data: any): void {
        if (!this.store.vendors[vendor]) {
            this.store.vendors[vendor] = {
                vendorName: vendor,
                fieldMappings: {},
                knownDiscounts: []
            };
        }
        const mem = this.store.vendors[vendor];

        if (type === 'fieldMapping') {
            mem.fieldMappings[data.raw] = data.target;
        } else if (type === 'discount' && !mem.knownDiscounts.includes(data)) {
            mem.knownDiscounts.push(data);
        }
        this.commit();
    }
}