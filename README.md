# Contract-Driven Development CLI

A CLI for **contract-based agentic development** — where coding agents implement features against explicit, verifiable guarantees. No shipping until contracts are satisfied.

## Quick Start

```bash
# Install
npm install -g @agentic-contracts/cli

# Initialize a contract for a feature
contract init --feature checkout --owner priya@company

# Edit the contract
# contracts/checkout.feature.ts

# Verify implementation against contract
contract verify --contract checkout.feature
```

## The Core Loop

```
Owner approves contract → Agent implements → Contract verifies → Feature ships
```

1. **Owner writes contract** — explicit guarantees, preconditions, postconditions
2. **Agent implements** — must satisfy all postconditions
3. **Contract verifies** — runs verification tests
4. **Feature ships only when contract passes**

## Commands

### `contract init`

Initialize a new contract for a feature:

```bash
contract init --feature checkout --owner priya@company
```

Creates:
- `contracts/checkout.feature.ts` — the contract definition
- `contracts/checkout.feature.test.ts` — verification test
- `contracts.config.yaml` — governance config

### `contract verify`

Verify an implementation against a contract:

```bash
contract verify --contract checkout.feature
```

Exit code 0 = passed. Exit code 1 = failed (blocks deploy).

### `contract report`

Generate a contract review report for the owner:

```bash
contract report --contract checkout.feature --owner priya@company
```

## Contract Structure

```typescript
export const CheckoutContract = new Contract({
  name: "checkout",
  owner: "priya@company",
  
  assumes: {
    maxLatencyMs: 500,
    cartMaxItems: 50,
  },

  guarantee: {
    name: "user can complete checkout",
    
    preconditions: [
      { label: "cart not empty", test: (ctx) => ctx.cart.items.length > 0 },
    ],

    postconditions: [
      { 
        label: "order created", 
        test: (ctx, result) => result.status === "success" 
      },
    ],

    maxDurationMs: 2000,
  },
});
```

## CI Integration

```yaml
# .github/workflows/contracts.yml
name: Contract Verification

on:
  pull_request:
    paths:
      - "features/**"
      - "contracts/**"

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm install
      - run: npx contract verify --contract checkout.feature --ci --blocking
```

## Governance

Contracts have a single human owner. The owner:

- Approves the initial contract
- Reviews failures and decides: fix or waive
- Updates contracts for breaking changes

```yaml
# contracts.config.yaml
contracts:
  checkout.feature:
    owner: priya@company
    failureAction:
      blocking: true      # fail CI on contract failure
      notifyOwner: true  # ping owner on failure
```

## License

MIT
