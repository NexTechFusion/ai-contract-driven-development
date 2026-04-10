// YAML Contract Runner - Language-agnostic verification

import {
  ContractSpec,
  VerificationContext,
  AssertionFailure,
  loadContract,
  evaluatePreconditions,
  evaluatePostconditions,
  setupCustomOperators,
} from "./yaml-contract.js";

// Re-export types for external use
export type { ContractSpec, AssertionFailure };

export interface YamlRunnerConfig {
  contractPath: string;
  maxIterations?: number;
  timeoutMs?: number;
}

export interface YamlVerificationResult {
  passed: boolean;
  failures: AssertionFailure[];
  iterations: number;
  durationMs: number;
  timestamp: Date;
  contractName: string;
  contractOwner: string;
}

export interface TestSetup {
  ctx: any;
  _preState?: any;
}

export interface TestResult {
  result: any;
  _postState?: any;
}

/**
 * YAML Contract Runner
 * 
 * Usage:
 *   const runner = new YamlContractRunner({ contractPath: 'contracts/checkout.contract.yaml' });
 *   const result = await runner.verify(
 *     async (ctx) => myFunction(ctx),
 *     async () => ({ ctx: {...}, _preState: {...} })
 *   );
 */
export class YamlContractRunner {
  private contract: ContractSpec;
  private maxIterations: number;
  private timeoutMs: number;

  constructor(config: YamlRunnerConfig) {
    this.contract = loadContract(config.contractPath);
    this.maxIterations = config.maxIterations ?? 3;
    this.timeoutMs = config.timeoutMs ?? 30000;
    
    // Ensure operators are initialized
    setupCustomOperators();
  }

  /**
   * Run verification against the contract
   */
  async verify(
    testFn: (ctx: any) => Promise<any> | any,
    setupFn?: () => Promise<TestSetup> | TestSetup
  ): Promise<YamlVerificationResult> {
    const startTime = Date.now();
    const failures: AssertionFailure[] = [];
    let iterations = 0;

    for (iterations = 1; iterations <= this.maxIterations; iterations++) {
      failures.length = 0;

      try {
        // Setup context
        const setup = setupFn ? await setupFn() : { ctx: {} };
        
        const context: VerificationContext = {
          ctx: setup.ctx,
          _preState: setup._preState,
        };

        // Evaluate preconditions
        const preResult = evaluatePreconditions(this.contract, context);
        if (!preResult.passed) {
          failures.push(...preResult.failures);
          continue; // Retry
        }

        // Run the test function
        const testOutput: any = await this.withTimeout(
          testFn(setup.ctx),
          this.timeoutMs
        );

        // Build full context for postconditions
        context.result = testOutput?.result ?? testOutput;
        context._postState = testOutput?._postState;

        // Evaluate postconditions
        const postResult = evaluatePostconditions(this.contract, context);
        if (!postResult.passed) {
          failures.push(...postResult.failures);
          continue; // Retry
        }

        // Check temporal bound
        if (this.contract.guarantee.maxDurationMs !== undefined) {
          const duration = Date.now() - startTime;
          if (duration > this.contract.guarantee.maxDurationMs) {
            failures.push({
              label: "Temporal bound exceeded",
              assertion: { lte: [{ var: "_durationMs" }, this.contract.guarantee.maxDurationMs] },
              context: { _durationMs: duration },
              type: "postcondition",
            });
            continue;
          }
        }

        // All checks passed
        return {
          passed: true,
          failures: [],
          iterations,
          durationMs: Date.now() - startTime,
          timestamp: new Date(),
          contractName: this.contract.name,
          contractOwner: this.contract.owner,
        };

      } catch (error: any) {
        failures.push({
          label: "Runtime error",
          assertion: { error: error.message },
          context: {},
          type: "postcondition",
        });
      }
    }

    // Exhausted retries
    return {
      passed: false,
      failures,
      iterations,
      durationMs: Date.now() - startTime,
      timestamp: new Date(),
      contractName: this.contract.name,
      contractOwner: this.contract.owner,
    };
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    ms: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
      ),
    ]);
  }
}

/**
 * Format verification result for display
 */
export function formatYamlResult(result: YamlVerificationResult): string {
  const lines: string[] = [];

  lines.push(`\n📋 Contract: ${result.contractName}`);
  lines.push(`   Owner: ${result.contractOwner}`);
  lines.push("");

  if (result.passed) {
    lines.push("✅ Contract satisfied — feature can ship");
    lines.push(`   Iterations: ${result.iterations}`);
    lines.push(`   Duration: ${result.durationMs}ms`);
  } else {
    lines.push("❌ Contract failed:");
    for (const failure of result.failures) {
      lines.push(`   - [${failure.type}] ${failure.label}`);
      if (failure.assertion) {
        lines.push(`     Assertion: ${JSON.stringify(failure.assertion)}`);
      }
    }
    lines.push("");
    lines.push("⚠️  Feature blocked — owner must review or fix.");
    lines.push(`   Iterations attempted: ${result.iterations}`);
    lines.push(`   Duration: ${result.durationMs}ms`);
  }

  return lines.join("\n");
}
