# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x     | ✅ Yes             |

## Reporting a Vulnerability

If you discover a security vulnerability in BigO Lens, please report it responsibly.

### How to Report

1. **Do NOT** open a public issue
2. Email details to the maintainer via [GitHub profile](https://github.com/YTTHEMIGHTY)
3. Or use [GitHub Security Advisories](https://github.com/YTTHEMIGHTY/bigo-lens/security/advisories/new)

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Assessment:** Within 1 week
- **Fix & Release:** As soon as possible, typically within 2 weeks

## Scope

BigO Lens is a **fully offline** VS Code extension that performs local AST analysis only. It:
- ❌ Does NOT make network requests
- ❌ Does NOT collect telemetry
- ❌ Does NOT access external APIs
- ❌ Does NOT read files outside the workspace

The attack surface is minimal by design.
