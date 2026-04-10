#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { createInitCommand } from "./commands/init.js";
import { createVerifyCommand } from "./commands/verify.js";
import { createVerifyYamlCommand } from "./commands/verify-yaml.js";
import { createReportCommand } from "./commands/report.js";
const program = new Command();
// CLI Info
program
    .name("contract")
    .description(chalk.cyan("Contract-based agentic development CLI") + "\n" +
    chalk.gray("Verify agent implementations against explicit, verifiable guarantees"))
    .version("0.1.0");
// Register commands
program.addCommand(createInitCommand());
program.addCommand(createVerifyCommand());
program.addCommand(createVerifyYamlCommand());
program.addCommand(createReportCommand());
// Global options
program
    .option("-v, --verbose", "Verbose output")
    .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.verbose) {
        console.log(chalk.gray("[verbose] Full command:"), thisCommand.args);
    }
});
// Handle no command
program.on("command:*", () => {
    console.error(chalk.red(`Unknown command: ${program.args.join(" ")}`));
    console.log(chalk.yellow("\nAvailable commands:"));
    console.log("  " + chalk.cyan("init") + "      Initialize a new contract");
    console.log("  " + chalk.cyan("verify") + "    Verify a contract against implementation");
    console.log("  " + chalk.cyan("report") + "    Generate a contract review report");
    console.log("");
    console.log(chalk.gray("Run 'contract <command> --help' for more options"));
    process.exit(1);
});
// Parse and execute
program.parse();
