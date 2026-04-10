import type { VerificationResult, ContractContext } from "./types.js";
import { Contract } from "./contract.js";
export interface RunnerConfig {
    contract: Contract;
    maxIterations?: number;
    timeoutMs?: number;
}
export interface TestContext extends ContractContext {
    setup?: () => Promise<ContractContext>;
    teardown?: (ctx: ContractContext) => Promise<void>;
}
export declare class ContractRunner {
    private contract;
    private maxIterations;
    private timeoutMs;
    constructor(config: RunnerConfig);
    verify(testFn: (ctx: ContractContext) => Promise<unknown>, setup?: () => Promise<ContractContext>): Promise<VerificationResult>;
    private defaultSetup;
    private withTimeout;
}
export declare function formatResult(result: VerificationResult): string;
