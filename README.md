# Flowbit AI Agent 

** Watch the Demo:** [(https://www.loom.com/share/6ddbdc1dd764454b9a2bfeb8eefa9f0d)]

---

##  Design & Logic
This agent uses a **Memory-First Architecture** to handle invoice errors. Instead of hard-coding rules for every vendor, the agent learns from human corrections and remembers them for future use.

### 1. Memory Layer (`MemoryManager.ts`)
* **Persistence:** The agent maintains a persistent knowledge base in `data/memory.json`.
* **Dynamic Learning:** When a human corrects a field (e.g., mapping "Leistungsdatum" -> "serviceDate"), the agent saves this pattern. The next time it processes an invoice from the same vendor, it automatically applies the correction.
* **Duplicate Prevention:** Before processing, the agent hashes the `Vendor Name + Invoice Number` to create a unique fingerprint, ensuring no invoice is processed twice.

### 2. Processing Engine (`Processor.ts`)
The processor executes a 4-step logic pipeline:
1.  **Recall:** It first checks memory for known patterns (e.g., currency defaults or field mappings) for the specific vendor.
2.  **Validation Logic:**
    * **VAT Reconstruction:** If "Prices incl. VAT" is detected, it reverse-calculates the Net Amount to ensure mathematical consistency.
    * **Currency Recovery:** It scans raw text for symbols (€, $) or ISO codes (EUR, USD) if the structured data is missing them.
    * **PO Matching:** It performs fuzzy matching on total amounts to link invoices to Purchase Orders, even when the PO number is missing.
3.  **Learning:** It identifies new correction patterns and updates the memory file.
4.  **Audit:** It logs every decision and correction for transparency.

---

## How to Run
1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Run the Simulation:**
    ```bash
    npx ts-node src/index.ts
    ```

##  Tech Stack
* **Language:** TypeScript / Node.js
* **Data:** JSON-based persistence
* **Architecture:** Feedback-loop learning system


