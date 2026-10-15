# Contributing

## Setup

```bash
nvm use
npm install
npm run verify
```

`npm run verify` runs lint, format check, typecheck, tests with coverage and the build, which is the same set of checks CI runs.

## Workflow

- Branch from `main` and keep pull requests small and focused.
- Use conventional commit messages (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- Add or update tests with every behaviour change. Coverage thresholds are enforced in CI.
- Run `terraform fmt -recursive` and `terraform validate` in `infra/` when touching infrastructure.
- Record significant architectural decisions as a short ADR in `docs/adr`.

## Code conventions

- TypeScript strict mode, no implicit any.
- Handlers stay thin: validate input, call a collaborator, return a response.
- The tenant id comes only from the authorizer context, never from the request payload.
- Code explains itself through naming and structure rather than comments.
