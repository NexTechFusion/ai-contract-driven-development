import { z } from "zod";
import type {
  ContractDefinition,
  ContractFile,
  Assumption,
  Guarantee,
  Precondition,
  Postcondition,
} from "./types.js";

// Schema for contract file validation
export const AssumptionSchema = z.record(z.union([
  z.number(),
  z.string(),
  z.boolean(),
]));

export const PreconditionSchema = z.object({
  label: z.string(),
  test: z.function().optional(), // runtime only
});

export const PostconditionSchema = z.object({
  label: z.string(),
  test: z.function().optional(), // runtime only
});

export const GuaranteeSchema = z.object({
  name: z.string(),
  preconditions: z.array(PreconditionSchema).optional(),
  postconditions: z.array(PostconditionSchema).optional(),
  maxDurationMs: z.number().optional(),
});

export const ContractFileSchema = z.object({
  name: z.string(),
  owner: z.string().email(),
  assumes: AssumptionSchema.optional(),
  guarantee: GuaranteeSchema,
});

export class Contract {
  readonly name: string;
  readonly owner: string;
  readonly assumes: Assumption;
  readonly guarantee: Guarantee;

  constructor(definition: ContractDefinition) {
    this.name = definition.name;
    this.owner = definition.owner;
    this.assumes = definition.assumes ?? {};
    this.guarantee = definition.guarantee;
  }

  static fromFile(file: ContractFile): Contract {
    return new Contract({
      name: file.name,
      owner: file.owner,
      assumes: file.assumes,
      guarantee: file.guarantee,
    });
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim() === "") {
      errors.push("Contract name is required");
    }

    if (!this.owner || !this.owner.includes("@")) {
      errors.push("Contract owner must be a valid email");
    }

    if (!this.guarantee?.name) {
      errors.push("Guarantee name is required");
    }

    if (this.guarantee?.maxDurationMs !== undefined && this.guarantee.maxDurationMs <= 0) {
      errors.push("maxDurationMs must be positive");
    }

    return { valid: errors.length === 0, errors };
  }

  getAssumption(key: string): number | string | boolean | undefined {
    return this.assumes[key];
  }

  checkPreconditions(preconditions: Precondition[], ctx: unknown): { passed: boolean; failures: string[] } {
    const failures: string[] = [];
    for (const pc of preconditions ?? []) {
      try {
        const result = pc.test(ctx as never);
        if (!result) {
          failures.push(`Precondition failed: ${pc.label}`);
        }
      } catch (e) {
        failures.push(`Precondition error [${pc.label}]: ${e}`);
      }
    }
    return { passed: failures.length === 0, failures };
  }

  checkPostconditions(postconditions: Postcondition[], ctx: unknown, result: unknown): { passed: boolean; failures: string[] } {
    const failures: string[] = [];
    for (const pc of postconditions ?? []) {
      try {
        const pcResult = pc.test(ctx as never, result);
        if (!pcResult) {
          failures.push(`Postcondition failed: ${pc.label}`);
        }
      } catch (e) {
        failures.push(`Postcondition error [${pc.label}]: ${e}`);
      }
    }
    return { passed: failures.length === 0, failures };
  }
}

export function loadContractFile(path: string): ContractFile {
  // Dynamic import for ESM
  const fs = require("fs");
  const ext = path.split(".").pop()?.toLowerCase();

  if (ext === "json") {
    const content = fs.readFileSync(path, "utf-8");
    return JSON.parse(content) as ContractFile;
  }

  if (ext === "ts" || ext === "js") {
    // For .ts files, we'd need ts-node or similar
    // For now, try to load as JS or throw helpful error
    const content = fs.readFileSync(path, "utf-8");
    
    // Simple detection: if it's a JS/TS module, note that we need transpilation
    if (content.includes("export")) {
      throw new Error(
        `TypeScript contracts require transpilation. ` +
        `Use 'contract verify --contract <name>.json' with a JSON contract, ` +
        `or build your .ts contract first.`
      );
    }
    
    throw new Error(`Unsupported contract file type: ${ext}`);
  }

  throw new Error(`Unsupported file type: ${ext}`);
}
