// Language-agnostic contract parser using JSON Logic

import * as fs from "fs";
import * as yaml from "yaml";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const jsonLogic = require("json-logic-js");

const logicProcessor = jsonLogic;

export interface Assertion {
  label: string;
  assertion: any; // JSON Logic expression
}

export interface Guarantee {
  name: string;
  preconditions?: Assertion[];
  postconditions?: Assertion[];
  maxDurationMs?: number;
}

export interface ContractSpec {
  spec: string;
  name: string;
  owner: string;
  assumes?: Record<string, any>;
  guarantee: Guarantee;
}

export interface VerificationContext {
  ctx: any;
  result?: any;
  _preState?: any;
  _postState?: any;
  [key: string]: any;
}

export interface AssertionFailure {
  label: string;
  assertion: any;
  context: any;
  type: "precondition" | "postcondition";
}

/**
 * Load a contract from a YAML file
 */
export function loadContract(path: string): ContractSpec {
  const content = fs.readFileSync(path, "utf-8");
  const contract = yaml.parse(content) as ContractSpec;
  
  if (!contract.spec?.startsWith("contract/")) {
    throw new Error(`Invalid contract spec: ${contract.spec}`);
  }
  
  return contract;
}

/**
 * Evaluate a JSON Logic assertion against a context
 */
export function evaluateAssertion(assertion: any, context: VerificationContext): boolean {
  try {
    const result = (logicProcessor as any).apply(assertion, context);
    return result === true;
  } catch (error) {
    console.error(`Assertion evaluation error: ${error}`);
    return false;
  }
}

/**
 * Evaluate all preconditions
 */
export function evaluatePreconditions(
  contract: ContractSpec,
  context: VerificationContext
): { passed: boolean; failures: AssertionFailure[] } {
  const failures: AssertionFailure[] = [];
  
  for (const precondition of contract.guarantee.preconditions ?? []) {
    const passed = evaluateAssertion(precondition.assertion, context);
    if (!passed) {
      failures.push({
        label: precondition.label,
        assertion: precondition.assertion,
        context: { ctx: context.ctx },
        type: "precondition",
      });
    }
  }
  
  return { passed: failures.length === 0, failures };
}

/**
 * Evaluate all postconditions
 */
export function evaluatePostconditions(
  contract: ContractSpec,
  context: VerificationContext
): { passed: boolean; failures: AssertionFailure[] } {
  const failures: AssertionFailure[] = [];
  
  for (const postcondition of contract.guarantee.postconditions ?? []) {
    const passed = evaluateAssertion(postcondition.assertion, context);
    if (!passed) {
      failures.push({
        label: postcondition.label,
        assertion: postcondition.assertion,
        context: {
          ctx: context.ctx,
          result: context.result,
          _preState: context._preState,
          _postState: context._postState,
        },
        type: "postcondition",
      });
    }
  }
  
  return { passed: failures.length === 0, failures };
}

/**
 * Format assertion for display
 */
export function formatAssertion(assertion: any): string {
  return JSON.stringify(assertion, null, 2);
}

/**
 * Add custom operators to JSON Logic
 */
export function setupCustomOperators() {
  // Explicitly register missing core operators to bypass interop issues
  (logicProcessor as any).add_operation("gt", (a: any, b: any) => a > b);
  (logicProcessor as any).add_operation("gte", (a: any, b: any) => a >= b);
  (logicProcessor as any).add_operation("eq", (a: any, b: any) => a == b);
  (logicProcessor as any).add_operation("and", (...args: any[]) => args.every(x => !!x));
  (logicProcessor as any).add_operation("or", (...args: any[]) => args.some(x => !!x));
  (logicProcessor as any).add_operation("-", (a: any, b: any) => a - b);
  (logicProcessor as any).add_operation("*", (a: any, b: any) => a * b);
  (logicProcessor as any).add_operation("/", (a: any, b: any) => a / b);
  (logicProcessor as any).add_operation("count", (a: any) => Array.isArray(a) ? a.length : 0);

  // Custom: "sumBy" - sum array of objects by property
  (logicProcessor as any).add_operation("sumBy", (array: any[], prop: string) => {
    if (!Array.isArray(array)) return 0;
    return array.reduce((sum, item) => {
      const value = item?.[prop] ?? 0;
      return sum + (typeof value === "number" ? value : 0);
    }, 0);
  });

  // Custom: "multiply" - multiply two values
  (logicProcessor as any).add_operation("multiply", (a: number, b: number) => {
    return (a ?? 0) * (b ?? 0);
  });

  // Custom: "totalPrice" - sum items price * quantity
  (logicProcessor as any).add_operation("totalPrice", (items: any[]) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      const price = item?.priceAtAdd ?? item?.price ?? 0;
      const qty = item?.quantity ?? 1;
      return sum + price * qty;
    }, 0);
  });
}

// Initialize custom operators on import
setupCustomOperators();
