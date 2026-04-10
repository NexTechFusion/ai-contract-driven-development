import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";

interface InitOptions {
  feature: string;
  owner: string;
  directory?: string;
  language?: "typescript" | "javascript" | "json";
}

export function createInitCommand(): Command {
  const cmd = new Command("init");
  cmd
    .description("Initialize a new contract for a feature")
    .requiredOption("-f, --feature <name>", "Feature name (e.g., checkout, auth, search)")
    .requiredOption("-o, --owner <email>", "Contract owner email")
    .option("-d, --directory <path>", "Output directory", "./contracts")
    .option("-l, --language <type>", "Contract language", "typescript");

  cmd.action(async (opts: InitOptions) => {
    await initContract(opts);
  });

  return cmd;
}

async function initContract(opts: InitOptions): Promise<void> {
  const featureName = opts.feature.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const outputDir = opts.directory ?? "./contracts";
  
  // Create directory structure
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.join(outputDir, "generated"), { recursive: true });

  const contractFileName = `${featureName}.feature.ts`;
  const testFileName = `${featureName}.feature.test.ts`;
  const configFileName = "contracts.config.yaml";
  const configPath = path.join(outputDir, "..", configFileName);
  const contractPath = path.join(outputDir, contractFileName);
  const testPath = path.join(outputDir, testFileName);

  // Contract template
  const contractTemplate = `import { Contract } from "@agentic-contracts/core";

/**
 * Contract: ${featureName}
 * Owner: ${opts.owner}
 * 
 * This contract defines the guarantees for the "${featureName}" feature.
 * The agent must satisfy all postconditions before this feature can ship.
 */

export const ${toPascalCase(featureName)}Contract = new Contract({
  name: "${featureName}",
  owner: "${opts.owner}",
  
  // EXPLICIT ASSUMPTIONS
  // These define the context under which the contract holds
  assumes: {
    // networkLatencyMs: 500,        // max expected round-trip
    // dbReadLatencyMs: 100,         // max expected DB read
    // sessionValidMs: 30 * 60 * 1000,
  },

  guarantee: {
    name: "${featureName} feature guarantee",
    
    // PRECONDITIONS: what must be true before the feature runs
    preconditions: [
      // { label: "user authenticated", test: (ctx) => ctx.user?.authenticated === true },
      // { label: "required fields present", test: (ctx) => !!ctx.input?.id },
    ],

    // POSTCONDITIONS: what must be true after the feature completes
    postconditions: [
      // { 
      //   label: "result has expected shape", 
      //   test: (ctx, result) => {
      //     return result !== null && typeof result === "object";
      //   }
      // },
    ],

    // TEMPORAL BOUND: max time the feature should take
    maxDurationMs: 2000,
  },
});

export default ${toPascalCase(featureName)}Contract;
`;

  // Test template
  const testTemplate = `import { ContractRunner, formatResult } from "@agentic-contracts/core";
import { ${toPascalCase(featureName)}Contract } from "./${featureName}.feature";

/**
 * Contract verification test for "${featureName}"
 * 
 * Run: npx contract verify --contract ${featureName}.feature
 * Or:   npx tsx src/commands/verify.ts --contract ${featureName}.feature
 */

async function main() {
  console.log(chalk.blue("🔍 Verifying contract: ${featureName}"));
  console.log(chalk.gray("Owner: ${opts.owner}"));
  console.log("");

  const runner = new ContractRunner({
    contract: ${toPascalCase(featureName)}Contract,
    maxIterations: 3,
    timeoutMs: 30000,
  });

  // Setup: create a valid test context
  const setup = async () => ({
    // TODO: Replace with your actual test setup
    user: { id: "test-user-001", authenticated: true },
    input: { id: "test-001" },
  });

  // The feature implementation to test
  const testFn = async (ctx: any) => {
    // TODO: Replace with your actual feature call
    // Example:
    // return await run${toPascalCase(featureName)}(ctx.input);
    return { id: ctx.input.id, success: true };
  };

  const result = await runner.verify(testFn, setup);
  
  console.log(formatResult(result));
  
  if (!result.passed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(chalk.red("Error:"), err.message);
  process.exit(1);
});
`;

  // Config template
  const configTemplate = `contracts:
  ${featureName}.feature:
    owner: ${opts.owner}
    
    thresholds:
      autoApproveLatencyRelax: 0.10      # up to 10% slower = auto-approve
      autoApproveAddsItem: false          # adding new items = human required
    
    failureAction:
      blocking: true                      # fail CI if contract fails
      notifyOwner: true                   # ping owner on failure
      # logTo: "pagerduty"               # uncomment to escalate
    
    reviewEscalation:
      afterRepeatedFailures: 3           # escalate after 3 failures
      requireBlamelessPostmortem: false
`;

  // Write files
  fs.writeFileSync(contractPath, contractTemplate);
  console.log(chalk.green("✅ Created:") + ` ${contractPath}`);

  fs.writeFileSync(testPath, testTemplate);
  console.log(chalk.green("✅ Created:") + ` ${testPath}`);

  // Only create config if it doesn't exist
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, configTemplate);
    console.log(chalk.green("✅ Created:") + ` ${configPath}`);
  } else {
    // Append to existing config
    const existing = fs.readFileSync(configPath, "utf-8");
    const appendSection = `\n  ${featureName}.feature:\n    owner: ${opts.owner}\n    thresholds:\n      autoApproveLatencyRelax: 0.10\n      autoApproveAddsItem: false\n    failureAction:\n      blocking: true\n      notifyOwner: true\n`;
    fs.writeFileSync(configPath, existing + appendSection);
    console.log(chalk.green("✅ Updated:") + ` ${configPath}`);
  }

  console.log("");
  console.log(chalk.bold("Next steps:"));
  console.log(`  1. Edit the contract:`);
  console.log(`     ${chalk.cyan(contractPath)}`);
  console.log(`  2. Write your test:`);
  console.log(`     ${chalk.cyan(testPath)}`);
  console.log(`  3. Verify:`);
  console.log(`     ${chalk.cyan(`npx contract verify --contract ${featureName}.feature`)}`);
  console.log("");
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}
