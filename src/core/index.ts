// Core exports
export { Contract, ContractFileSchema, loadContractFile } from "./contract.js";
export { ContractRunner, formatResult } from "./runner.js";

// YAML Contract exports (language-agnostic)
export {
  loadContract,
  evaluateAssertion,
  evaluatePreconditions,
  evaluatePostconditions,
  setupCustomOperators,
  formatAssertion,
} from "./yaml-contract.js";
export { YamlContractRunner, formatYamlResult } from "./yaml-runner.js";

// Types
export type {
  ContractDefinition,
  ContractFile,
  Assumption,
  Guarantee,
  Precondition,
  Postcondition,
  ContractContext,
  ContractFailure,
  VerificationResult,
  OwnerConfig,
  GovernanceConfig,
} from "./types.js";

export type {
  ContractSpec,
  Assertion,
  VerificationContext,
  AssertionFailure,
} from "./yaml-contract.js";

export type {
  YamlRunnerConfig,
  YamlVerificationResult,
  TestSetup,
  TestResult,
} from "./yaml-runner.js";
