import { z } from "zod";
import type { ContractDefinition, ContractFile, Assumption, Guarantee, Precondition, Postcondition } from "./types.js";
export declare const AssumptionSchema: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodNumber, z.ZodString, z.ZodBoolean]>>;
export declare const PreconditionSchema: z.ZodObject<{
    label: z.ZodString;
    test: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    label: string;
    test?: ((...args: unknown[]) => unknown) | undefined;
}, {
    label: string;
    test?: ((...args: unknown[]) => unknown) | undefined;
}>;
export declare const PostconditionSchema: z.ZodObject<{
    label: z.ZodString;
    test: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    label: string;
    test?: ((...args: unknown[]) => unknown) | undefined;
}, {
    label: string;
    test?: ((...args: unknown[]) => unknown) | undefined;
}>;
export declare const GuaranteeSchema: z.ZodObject<{
    name: z.ZodString;
    preconditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        test: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        test?: ((...args: unknown[]) => unknown) | undefined;
    }, {
        label: string;
        test?: ((...args: unknown[]) => unknown) | undefined;
    }>, "many">>;
    postconditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        test: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        test?: ((...args: unknown[]) => unknown) | undefined;
    }, {
        label: string;
        test?: ((...args: unknown[]) => unknown) | undefined;
    }>, "many">>;
    maxDurationMs: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    preconditions?: {
        label: string;
        test?: ((...args: unknown[]) => unknown) | undefined;
    }[] | undefined;
    postconditions?: {
        label: string;
        test?: ((...args: unknown[]) => unknown) | undefined;
    }[] | undefined;
    maxDurationMs?: number | undefined;
}, {
    name: string;
    preconditions?: {
        label: string;
        test?: ((...args: unknown[]) => unknown) | undefined;
    }[] | undefined;
    postconditions?: {
        label: string;
        test?: ((...args: unknown[]) => unknown) | undefined;
    }[] | undefined;
    maxDurationMs?: number | undefined;
}>;
export declare const ContractFileSchema: z.ZodObject<{
    name: z.ZodString;
    owner: z.ZodString;
    assumes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodNumber, z.ZodString, z.ZodBoolean]>>>;
    guarantee: z.ZodObject<{
        name: z.ZodString;
        preconditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            test: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            label: string;
            test?: ((...args: unknown[]) => unknown) | undefined;
        }, {
            label: string;
            test?: ((...args: unknown[]) => unknown) | undefined;
        }>, "many">>;
        postconditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            test: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            label: string;
            test?: ((...args: unknown[]) => unknown) | undefined;
        }, {
            label: string;
            test?: ((...args: unknown[]) => unknown) | undefined;
        }>, "many">>;
        maxDurationMs: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        preconditions?: {
            label: string;
            test?: ((...args: unknown[]) => unknown) | undefined;
        }[] | undefined;
        postconditions?: {
            label: string;
            test?: ((...args: unknown[]) => unknown) | undefined;
        }[] | undefined;
        maxDurationMs?: number | undefined;
    }, {
        name: string;
        preconditions?: {
            label: string;
            test?: ((...args: unknown[]) => unknown) | undefined;
        }[] | undefined;
        postconditions?: {
            label: string;
            test?: ((...args: unknown[]) => unknown) | undefined;
        }[] | undefined;
        maxDurationMs?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    name: string;
    owner: string;
    guarantee: {
        name: string;
        preconditions?: {
            label: string;
            test?: ((...args: unknown[]) => unknown) | undefined;
        }[] | undefined;
        postconditions?: {
            label: string;
            test?: ((...args: unknown[]) => unknown) | undefined;
        }[] | undefined;
        maxDurationMs?: number | undefined;
    };
    assumes?: Record<string, string | number | boolean> | undefined;
}, {
    name: string;
    owner: string;
    guarantee: {
        name: string;
        preconditions?: {
            label: string;
            test?: ((...args: unknown[]) => unknown) | undefined;
        }[] | undefined;
        postconditions?: {
            label: string;
            test?: ((...args: unknown[]) => unknown) | undefined;
        }[] | undefined;
        maxDurationMs?: number | undefined;
    };
    assumes?: Record<string, string | number | boolean> | undefined;
}>;
export declare class Contract {
    readonly name: string;
    readonly owner: string;
    readonly assumes: Assumption;
    readonly guarantee: Guarantee;
    constructor(definition: ContractDefinition);
    static fromFile(file: ContractFile): Contract;
    validate(): {
        valid: boolean;
        errors: string[];
    };
    getAssumption(key: string): number | string | boolean | undefined;
    checkPreconditions(preconditions: Precondition[], ctx: unknown): {
        passed: boolean;
        failures: string[];
    };
    checkPostconditions(postconditions: Postcondition[], ctx: unknown, result: unknown): {
        passed: boolean;
        failures: string[];
    };
}
export declare function loadContractFile(path: string): ContractFile;
