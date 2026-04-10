import type {
  VerificationResult,
  ContractFailure,
  ContractContext,
  Precondition,
  Postcondition,
} from "./types.js";
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

export class ContractRunner {
  private contract: Contract;
  private maxIterations: number;
  private timeoutMs: number;

  constructor(config: RunnerConfig) {
    this.contract = config.contract;
    this.maxIterations = config.maxIterations ?? 3;
    this.timeoutMs = config.timeoutMs ?? 30000;
  }

  async verify(
    testFn: (ctx: ContractContext) => Promise<unknown>,
    setup?: () => Promise<ContractContext>
  ): Promise<VerificationResult> {
    const startTime = Date.now();
    const failures: ContractFailure[] = [];
    let iterations = 0;

    for (iterations = 1; iterations <= this.maxIterations; iterations++) {
      failures.length = 0;

      try {
        // Setup context
        const ctx = setup ? await setup() : await this.defaultSetup();

        // Check preconditions
        const preResult = this.contract.checkPreconditions(
          this.contract.guarantee.preconditions ?? [],
          ctx
        );

        if (!preResult.passed) {
          for (const f of preResult.failures) {
            failures.push({
              label: f,
              detail: f,
              type: "precondition",
              input: ctx,
            });
          }
          continue; // retry
        }

        // Run the test with timeout
        const result = await this.withTimeout(
          testFn(ctx),
          this.timeoutMs,
          "Test function timed out"
        );

        // Check postconditions
        const postResult = this.contract.checkPostconditions(
          this.contract.guarantee.postconditions ?? [],
          ctx,
          result
        );

        if (!postResult.passed) {
          for (const f of postResult.failures) {
            failures.push({
              label: f,
              detail: f,
              type: "postcondition",
              input: ctx,
              output: result,
            });
          }
          continue; // retry
        }

        // Check temporal bound
        if (this.contract.guarantee.maxDurationMs !== undefined) {
          const duration = Date.now() - startTime;
          if (duration > this.contract.guarantee.maxDurationMs) {
            failures.push({
              label: `Temporal bound exceeded`,
              detail: `Duration ${duration}ms exceeds max ${this.contract.guarantee.maxDurationMs}ms`,
              type: "temporal",
              input: ctx,
              output: result,
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
        };

      } catch (error) {
        failures.push({
          label: "Runtime error",
          detail: error instanceof Error ? error.message : String(error),
          type: "assertion",
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
    };
  }

  private async defaultSetup(): Promise<ContractContext> {
    // Default minimal context for testing
    return {
      cart: { items: [] },
      user: { id: "test-user-001", authenticated: true },
    };
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    message: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(message)), ms)
      ),
    ]);
  }
}

export function formatResult(result: VerificationResult): string {
  const lines: string[] = [];

  if (result.passed) {
    lines.push("✅ Contract satisfied — feature can ship");
    lines.push(`   Iterations: ${result.iterations}`);
    lines.push(`   Duration: ${result.durationMs}ms`);
  } else {
    lines.push("❌ Contract failed:");
    for (const failure of result.failures) {
      lines.push(`   - [${failure.type}] ${failure.label}`);
      if (failure.detail) {
        lines.push(`     ${failure.detail}`);
      }
      if (failure.input !== undefined) {
        lines.push(`     Input: ${JSON.stringify(failure.input).slice(0, 200)}`);
      }
      if (failure.output !== undefined) {
        lines.push(`     Output: ${JSON.stringify(failure.output).slice(0, 200)}`);
      }
    }
    lines.push("");
    lines.push(`⚠️  Feature blocked — owner must review or fix.`);
    lines.push(`   Iterations attempted: ${result.iterations}`);
    lines.push(`   Duration: ${result.durationMs}ms`);
  }

  return lines.join("\n");
}
