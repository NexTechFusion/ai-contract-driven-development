export interface Assumption {
    [key: string]: number | string | boolean;
}
export interface Precondition {
    label: string;
    test: (ctx: ContractContext) => boolean;
}
export interface Postcondition {
    label: string;
    test: (ctx: ContractContext, result: unknown) => boolean;
}
export interface ContractContext {
    cart?: {
        items: CartItem[];
    };
    user?: {
        id: string;
        authenticated: boolean;
    };
    stockBefore?: Record<string, number>;
    [key: string]: unknown;
}
export interface CartItem {
    id: string;
    price: number;
    quantity: number;
    stock: number;
}
export interface TemporalBound {
    maxDurationMs: number;
}
export interface Guarantee {
    name: string;
    preconditions?: Precondition[];
    postconditions?: Postcondition[];
    maxDurationMs?: number;
}
export interface ContractDefinition {
    name: string;
    owner: string;
    assumes?: Assumption;
    guarantee: Guarantee;
}
export interface OwnerConfig {
    owner: string;
    ownerSlack?: string;
    ownerEmail?: string;
    thresholds: {
        autoApproveLatencyRelax: number;
        autoApproveAddsItem: boolean;
    };
    failureAction: {
        blocking: boolean;
        notifyOwner: boolean;
        logTo?: string;
    };
    reviewEscalation?: {
        afterRepeatedFailures: number;
        requireBlamelessPostmortem: boolean;
    };
}
export interface ContractFailure {
    label: string;
    detail: string;
    input?: unknown;
    output?: unknown;
    type: "precondition" | "postcondition" | "temporal" | "assertion";
}
export interface VerificationResult {
    passed: boolean;
    failures: ContractFailure[];
    iterations: number;
    durationMs: number;
    timestamp: Date;
}
export interface ContractFile {
    name: string;
    owner: string;
    assumes: Assumption;
    guarantee: Guarantee;
}
export interface GovernanceConfig {
    contracts: Record<string, OwnerConfig>;
}
