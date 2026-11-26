# Contributing

Contributions to DevTrack are welcome.

## Before opening a change

1. Check existing issues and discussions for related work.
2. For a substantial feature or behavior change, open an issue first to agree on scope.
3. Keep changes focused and preserve the existing React, Express, PostgreSQL, and TypeScript patterns.
4. Never include credentials, real user data, or `.env` files.

## Development checks

Install dependencies and configure PostgreSQL as described in the README. Backend tests require a separate `devtrack_test` database; the test setup truncates that database before each test and refuses any other database name.

Run the relevant checks before submitting:

```sh
npm --prefix client run lint
npm --prefix client run build
npm --prefix server run lint
npm --prefix server run build
npm --prefix server test
```

Add focused tests for behavior changes. Do not disable checks to make a change pass.

## Pull requests

- Explain the problem and the intended change.
- Include the checks you ran and their results.
- Add screenshots for meaningful UI changes when possible.
- Call out migrations, environment variables, or manual setup steps.
- Keep secrets and generated build output out of the pull request.

