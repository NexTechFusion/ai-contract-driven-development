import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
export function createInitCommand() {
    const cmd = new Command("init");
    cmd
        .description("Initialize a new contract for a feature")
        .requiredOption("-f, --feature <name>", "Feature name (e.g., checkout, auth, search)")
        .requiredOption("-o, --owner <email>", "Contract owner email")
        .option("-d, --directory <path>", "Output directory", "./contracts")
        .option("--format <type>", "Contract format (yaml or typescript)", "yaml");
    cmd.action(async (opts) => {
        await initContract(opts);
    });
    return cmd;
}
async function initContract(opts) {
    const featureName = opts.feature.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const outputDir = opts.directory ?? "./contracts";
    const format = opts.format ?? "yaml";
    // Create directory
    fs.mkdirSync(outputDir, { recursive: true });
    const contractFileName = format === "yaml"
        ? `${featureName}.contract.yaml`
        : `${featureName}.feature.ts`;
    const contractPath = path.join(outputDir, contractFileName);
    if (format === "yaml") {
        createYamlContract(contractPath, featureName, opts.owner);
    }
    else {
        createTypeScriptContract(contractPath, featureName, opts.owner);
    }
    console.log(chalk.green("✅ Created:") + ` ${contractPath}`);
    console.log("");
    console.log(chalk.bold("Next steps:"));
    console.log(`  1. Edit the contract:`);
    console.log(`     ${chalk.cyan(contractPath)}`);
    console.log(`  2. Write your test implementation`);
    console.log(`  3. Verify:`);
    console.log(`     ${chalk.cyan(`npx contract verify-yaml -c ${featureName}.contract.yaml`)}`);
    console.log("");
}
function createYamlContract(path, featureName, owner) {
    const template = `# Contract: ${featureName}
# Owner: ${owner}
# Format: Language-agnostic (JSON Logic)
#
# This contract defines the guarantees for the "${featureName}" feature.
# Assertions use JSON Logic - portable to 20+ languages.

spec: contract/v1
name: ${featureName}
owner: ${owner}

# Explicit assumptions - the context under which this contract holds
assumes:
  maxLatencyMs: 2000
  # Add more assumptions as needed

guarantee:
  name: "${featureName} feature guarantee"
  
  # PRECONDITIONS: what must be true before the feature runs
  # Each assertion is a JSON Logic expression evaluated against { ctx, result }
  preconditions:
    # Example: ctx.input must exist
    # - label: "input provided"
    #   assertion:
    #     truthy: { var: "ctx.input" }
  
  # POSTCONDITIONS: what must be true after the feature completes
  postconditions:
    # Example: result must have success flag
    # - label: "returns success"
    #   assertion:
    #     eq: [{ var: "result.success" }, true]
    
    # Example: result has expected shape
    # - label: "result has id"
    #   assertion:
    #     truthy: { var: "result.id" }
  
  # TEMPORAL BOUND: max execution time in milliseconds
  maxDurationMs: 2000

# ─── JSON LOGIC REFERENCE ───
# 
# Operators:
#   eq, ne, gt, gte, lt, lte  - comparisons
#   and, or, not              - boolean logic
#   truthy, falsy             - truth checks
#   in                        - value in array
#   var                       - access variable (e.g., { var: "ctx.user.id" })
#   count                     - array length
#   sum                       - sum array values
#   +, -, *, /                - arithmetic
#
# Variables available:
#   ctx        - input context
#   result     - function output
#   _preState  - state before execution
#   _postState - state after execution
#
# Examples:
#   { gt: [{ var: "ctx.items.length" }, 0] }
#   { eq: [{ var: "result.status" }, "success"] }
#   { and: [
#       { gt: [{ var: "ctx.value" }, 0] },
#       { lt: [{ var: "ctx.value" }, 100] }
#   ]}
`;
    fs.writeFileSync(path, template);
}
function createTypeScriptContract(path, featureName, owner) {
    const pascalName = toPascalCase(featureName);
    const template = `import { Contract } from "@agentic-contracts/core";

/**
 * Contract: ${featureName}
 * Owner: ${owner}
 */

export const ${pascalName}Contract = new Contract({
  name: "${featureName}",
  owner: "${owner}",
  
  assumes: {
    // maxLatencyMs: 500,
  },

  guarantee: {
    name: "${featureName} feature guarantee",
    
    preconditions: [
      // { label: "user authenticated", test: (ctx) => ctx.user?.authenticated === true },
    ],

    postconditions: [
      // { 
      //   label: "result has expected shape", 
      //   test: (ctx, result) => result !== null && typeof result === "object"
      // },
    ],

    maxDurationMs: 2000,
  },
});

export default ${pascalName}Contract;
`;
    fs.writeFileSync(path, template);
}
function toPascalCase(str) {
    return str
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("");
}
