# Contract Spec v1.0 — Language-Agnostic Format

## Overview

Contracts are defined in YAML with assertions expressed in JSON Logic. This format is portable to 20+ languages that have JSON Logic implementations.

## Example Contract

```yaml
spec: contract/v1
name: shop.checkout
owner: dom@example.com
assumes:
  maxLatencyMs: 2000
  cartMaxItems: 50
guarantee:
  name: "User can complete checkout for valid cart"
  preconditions:
    - label: "cart not empty"
      assertion:
        gt: [{ var: "cart.items.length" }, 0]
    - label: "user authenticated"
      assertion:
        eq: [{ var: "user.authenticated" }, true]
  postconditions:
    - label: "order created with success status"
      assertion:
        and:
          - eq: [{ var: "result.success" }, true]
          - eq: [{ var: "result.order.status" }, "paid"]
    - label: "order total equals sum of cart items"
      assertion:
        eq:
          - { var: "result.order.total" }
          - { var: "_expectedTotal" }
    - label: "order linked to correct user"
      assertion:
        eq:
          - { var: "result.order.userId" }
          - { var: "user.id" }
  maxDurationMs: 2000
```

## JSON Logic Operators (Subset)

| Operator | Description | Example |
|---|---|---|
| `eq` | Equal | `{eq: [a, b]}` |
| `ne` | Not equal | `{ne: [a, b]}` |
| `gt` | Greater than | `{gt: [a, b]}` |
| `gte` | Greater than or equal | `{gte: [a, b]}` |
| `lt` | Less than | `{lt: [a, b]}` |
| `lte` | Less than or equal | `{lte: [a, b]}` |
| `and` | Logical AND | `{and: [a, b, c]}` |
| `or` | Logical OR | `{or: [a, b]}` |
| `not` | Logical NOT | `{not: a}` |
| `if` | Conditional | `{if: [cond, then, else]}` |
| `in` | Value in array | `{in: [needle, haystack]}` |
| `var` | Variable access | `{var: "path.to.value"}` |
| `missing` | Check missing keys | `{missing: ["a", "b"]}` |
| `count` | Array length | `{count: array}` |
| `sum` | Sum array values | `{sum: array}` |
| `+`, `-`, `*`, `/` | Arithmetic | `{'+': [a, b]}` |
| `map`, `filter`, `reduce` | Array ops | `{map: [array, fn]}` |

## Variable Context

| Variable | Description |
|---|---|
| `ctx` | Input context passed to verification |
| `result` | Output from the function being verified |
| `_preState` | State snapshot before execution (for mutation checks) |
| `_postState` | State snapshot after execution |
| `_expected*` | Computed expected values (helper vars) |

## Runner Interface

Each language implements:

```
verify(contractPath, testFn, setupFn) -> VerificationResult
```

1. Load contract YAML
2. Run setupFn to create context
3. Run testFn with context
4. Evaluate preconditions against context
5. Evaluate postconditions against context + result
6. Return { passed, failures, iterations, durationMs }
```

## Language Implementations

- JavaScript/TypeScript: `json-logic-js`
- Python: `json-logic-py`
- Go: `github.com/diegoholiveira/jsonlogic`
- Rust: `jsonlogic`
- Java: `json-logic-java`
- Ruby: `json-logic-ruby`
- PHP: `json-logic-php`

## File Extension

`.contract.yaml` or `.contract.json`
