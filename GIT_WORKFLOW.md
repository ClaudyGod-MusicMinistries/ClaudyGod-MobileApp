# Git Workflow

This repo now has a GitHub Actions workflow that runs automatically when:

- you open or update a pull request into `main`
- you push directly to `main`
- you trigger the workflow manually from GitHub Actions

## Recommended branch flow

1. Create a branch from `main`
   - `feature/<name>`
   - `fix/<name>`
   - `hotfix/<name>`
2. Make your code changes locally
3. Run local checks if needed:
   - `npm run review:all`
4. Push the branch to GitHub
5. Open a pull request into `main`
6. Wait for the `Quality Gate / Review All` check to pass
7. Merge into `main`
8. After the merge or direct push, GitHub Actions automatically runs:
   - `Review All`
   - `Production Docker Dry Run`

## What the workflow checks

`Review All` runs the same repository checks used locally:

- Docker compose validation
- backend TypeScript build
- admin web production build
- mobile typecheck
- mobile lint

`Production Docker Dry Run` runs only on pushes to `main` and validates the deployable containers:

- renders `docker-compose.production.yml`
- builds the API production image
- builds the Postfix relay image
- builds the admin web production image
- builds the mobile web production image

## Recommended GitHub settings

In GitHub branch protection for `main`, enable:

- require a pull request before merging
- require status checks to pass before merging
- require the `Quality Gate / Review All` check

If you want `main` to always stay deployment-ready, also require:

- `Quality Gate / Production Docker Dry Run`

## Notes

- The workflow creates temporary CI env files with safe placeholders, so GitHub Actions does not need your real `.env.development` or `.env.production` files just to validate the codebase.
- Real deployment secrets should still live in GitHub Secrets, your server env files, or your deployment platform.
