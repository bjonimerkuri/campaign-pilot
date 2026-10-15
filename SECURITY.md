# Security policy

## Reporting a vulnerability

Please do not open a public issue for security problems. Use GitHub's private vulnerability reporting on this repository (Security tab, "Report a vulnerability") and include steps to reproduce and the affected version or commit.

You can expect an acknowledgement within a few days.

## Scope notes

- API keys are stored only as SHA-256 hashes and are shown once by the seed script.
- The OpenAI API key lives in SSM Parameter Store and must never be committed or placed in Lambda environment variables.
- Never commit `*.tfvars`, `*.tfstate` or `.env` files. They are ignored by `.gitignore`.
