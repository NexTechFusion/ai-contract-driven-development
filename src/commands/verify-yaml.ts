import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";

interface VerifyYamlOptions {
  contract: string;
  test?: string;
  ci?: boolean;
}

export function createVerifyYamlCommand(): Command {
  const cmd = new Command("verify-yaml");
  cmd
    .description("Verify a YAML contract against an implementation")
    .requiredOption("-c, --contract <path>", "Path to .contract.yaml file")
    .option("-t, --test <path>", "Path to test file (auto-detected if not specified)")
    .option("--ci", "Run in CI mode (non-interactive)");

  cmd.action(async (opts: VerifyYamlOptions) => {
    await verifyYamlContract(opts);
  });

  return cmd;
}

async function verifyYamlContract(opts: VerifyYamlOptions): Promise<void> {
  const contractPath = opts.contract;
  
  if (!fs.existsSync(contractPath)) {
    console.log(chalk.red(`❌ Contract not found: ${contractPath}`));
    process.exit(1);
  }

  console.log(chalk.blue("🔍 YAML Contract Verification"));
  console.log(chalk.gray(`Contract: ${contractPath}`));
  console.log("");

  // Load contract to display info
  const yaml = await import("yaml");
  const content = fs.readFileSync(contractPath, "utf-8");
  const contract = yaml.parse(content);
  
  console.log(chalk.bold(`Contract: ${contract.name}`));
  console.log(chalk.gray(`Owner: ${contract.owner}`));
  console.log(chalk.gray(`Spec: ${contract.spec}`));
  console.log("");

  // Find test file
  const testPath = opts.test ?? findTestFile(contractPath);
  
  if (!testPath || !fs.existsSync(testPath)) {
    console.log(chalk.yellow("⚠️  No test file found"));
    console.log(chalk.gray("Create a test file that exports a run() function:"));
    console.log("");
    console.log(chalk.cyan(`  // ${contractPath.replace('.contract.yaml', '.test.ts')}`));
    console.log(`  import { YamlContractRunner } from "@agentic-contracts/core";`);
    console.log(`  import { myFeature } from "../features/my-feature";`);
    console.log("");
    console.log(`  async function run() {`);
    console.log(`    const runner = new YamlContractRunner({`);
    console.log(`      contractPath: "${path.basename(contractPath)}"`);
    console.log(`    });`);
    console.log("");
    console.log(`    const result = await runner.verify(`);
    console.log(`      async (ctx) => myFeature(ctx),`);
    console.log(`      async () => ({ ctx: { /* your test context */ } })`);
    console.log(`    );`);
    console.log("");
    console.log(`    if (!result.passed) process.exit(1);`);
    console.log(`  }`);
    console.log("");
    console.log(`  export { run };`);
    process.exit(1);
  }

  console.log(chalk.gray(`Test: ${testPath}`));
  console.log("");

  // Run the test
  try {
    const testModule = await import(path.resolve(testPath));
    if (typeof testModule.run === "function") {
      await testModule.run();
    } else if (typeof testModule.default === "function") {
      await testModule.default();
    } else {
      console.log(chalk.red("❌ Test file must export a run() function"));
      process.exit(1);
    }
  } catch (error: any) {
    console.log(chalk.red("❌ Verification failed"));
    console.log(chalk.red(`   ${error.message}`));
    
    if (opts.ci) {
      process.exit(1);
    }
  }
}

function findTestFile(contractPath: string): string | null {
  const dir = path.dirname(contractPath);
  const base = path.basename(contractPath, ".contract.yaml");
  
  const candidates = [
    path.join(dir, `${base}.test.ts`),
    path.join(dir, `${base}.test.js`),
    path.join(dir, `${base}.contract.test.ts`),
    path.join(dir, `${base}.contract.test.js`),
  ];
  
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  
  return null;
}
