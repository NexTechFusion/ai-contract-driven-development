import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";

interface VerifyOptions {
  contract: string;
  config?: string;
  ci?: boolean;
  blocking?: boolean;
}

export function createVerifyCommand(): Command {
  const cmd = new Command("verify");
  cmd
    .description("Verify a contract against its test implementation")
    .requiredOption("-c, --contract <name>", "Contract name (e.g., checkout.feature)")
    .option("--config <path>", "Path to contracts.config.yaml")
    .option("--ci", "Run in CI mode (non-interactive)")
    .option("--blocking", "Exit with code 1 on failure (for CI gates)");

  cmd.action(async (opts: VerifyOptions) => {
    await verifyContract(opts);
  });

  return cmd;
}

async function verifyContract(opts: VerifyOptions): Promise<void> {
  const contractName = opts.contract.replace(/\.(ts|js|json)$/, "");
  const contractDir = path.join(process.cwd(), "contracts");
  const configPath = opts.config ?? path.join(contractDir, "..", "contracts.config.yaml");

  console.log(chalk.blue("🔍 Contract Verification"));
  console.log(chalk.gray(`Contract: ${contractName}`));
  console.log("");

  // Load config if exists
  let config: Record<string, any> = {};
  if (fs.existsSync(configPath)) {
    try {
      const yaml = await import("yaml");
      const content = fs.readFileSync(configPath, "utf-8");
      config = yaml.parse(content) ?? {};
      console.log(chalk.gray(`Config: ${configPath}`));
    } catch (e) {
      console.log(chalk.yellow("⚠️  Could not parse config file, using defaults"));
    }
  }

  // Find the contract test file
  const testPaths = [
    path.join(contractDir, `${contractName}.test.ts`),
    path.join(contractDir, `${contractName}.test.js`),
    path.join(contractDir, `${contractName}.feature.test.ts`),
    path.join(contractDir, `${contractName}.feature.test.js`),
    path.join(process.cwd(), `${contractName}.test.ts`),
  ];

  let testPath: string | null = null;
  for (const p of testPaths) {
    if (fs.existsSync(p)) {
      testPath = p;
      break;
    }
  }

  if (!testPath) {
    console.log(chalk.red("❌ Test file not found"));
    console.log(chalk.gray(`Looked in:`));
    for (const p of testPaths) {
      console.log(chalk.gray(`  - ${p}`));
    }
    console.log("");
    console.log(chalk.yellow("💡 Run 'contract init --feature <name>' to create a contract first"));
    process.exit(1);
  }

  console.log(chalk.gray(`Test: ${testPath}`));
  console.log("");

  // Run the test using Node's module system
  try {
    // Dynamic import of the test module
    const testModule = await import(testPath);
    
    if (typeof testModule.default === "function") {
      await testModule.default();
    } else {
      console.log(chalk.yellow("⚠️  Test file doesn't export a default function"));
      console.log(chalk.gray("Expected: export default async function() { ... }"));
    }
  } catch (error: any) {
    console.log(chalk.red("❌ Verification failed"));
    console.log(chalk.red(`   ${error.message}`));
    
    if (opts.blocking || opts.ci) {
      process.exit(1);
    }
  }

  // CI mode summary
  if (opts.ci) {
    console.log("");
    console.log(chalk.blue("📊 CI Mode Summary:"));
    console.log(chalk.gray(`   Contract: ${contractName}`));
    console.log(chalk.gray(`   Status: verification complete`));
  }
}
