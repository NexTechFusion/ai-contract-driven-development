import { Command } from "commander";
import chalk from "chalk";

interface ReportOptions {
  contract: string;
  owner: string;
  ci?: boolean;
  blocking?: boolean;
}

export function createReportCommand(): Command {
  const cmd = new Command("report");
  cmd
    .description("Generate a contract review report for the owner")
    .requiredOption("-c, --contract <name>", "Contract name")
    .requiredOption("-o, --owner <email>", "Owner email")
    .option("--ci", "Run in CI mode")
    .option("--blocking", "Exit with code 1 on failures");

  cmd.action(async (opts: ReportOptions) => {
    await generateReport(opts);
  });

  return cmd;
}

async function generateReport(opts: ReportOptions): Promise<void> {
  const now = new Date().toISOString();

  console.log(chalk.blue("┌──────────────────────────────────────────────┐"));
  console.log(chalk.blue("│  📋 Contract Review Request                  │"));
  console.log(chalk.blue("└──────────────────────────────────────────────┘"));
  console.log("");
  console.log(`  Contract: ${chalk.bold(opts.contract)}`);
  console.log(`  Owner: ${chalk.bold(opts.owner)}`);
  console.log(`  Requested: ${now}`);
  console.log("");
  console.log(chalk.gray("  This report should be sent to the contract owner"));
  console.log(chalk.gray("  for review and sign-off."));
  console.log("");
  console.log(chalk.bold("  Actions:"));
  console.log("");
  console.log(`  [ ] ${chalk.green("Approve as-is")} — waive contract requirements`);
  console.log(`  [ ] ${chalk.yellow("Require fix")} — agent must fix before ship`);
  console.log(`  [ ] ${chalk.cyan("Update contract")} — breaking change requires sign-off`);
  console.log("");
  console.log(chalk.gray("  Signed: ____________________    Date: ____________"));
  console.log("");

  if (opts.ci) {
    console.log(chalk.blue("📊 CI Mode Report:"));
    console.log(chalk.gray(`   Contract: ${opts.contract}`));
    console.log(chalk.gray(`   Owner: ${opts.owner}`));
    console.log(chalk.gray(`   Generated: ${now}`));
  }
}
