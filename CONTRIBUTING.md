# Contributing to ShopiTrello

## Development Workflow

1. **Fork and Clone**
   ```bash
   git clone <your-fork-url>
   cd shopytrello
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Set Up Environment**
   - Copy `.env.example` to `.env`
   - Fill in all required environment variables

5. **Run Database Migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Make Changes**
   - Write clean, typed TypeScript code
   - Follow existing code style
   - Add comments for complex logic

7. **Type Check**
   ```bash
   npm run typecheck
   ```

8. **Lint**
   ```bash
   npm run lint
   ```

9. **Test Locally**
   ```bash
   docker-compose up --build
   ```

10. **Commit and Push**
    ```bash
    git add .
    git commit -m "feat: your feature description"
    git push origin feature/your-feature-name
    ```

11. **Create Pull Request**
    - Describe your changes
    - Reference any related issues
    - Wait for review

## Code Style

- Use TypeScript strict mode
- Prefer `async/await` over callbacks
- Use named exports over default exports
- Add JSDoc comments to public APIs
- Keep functions small and focused

## Commit Messages

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## Testing

- Test Shopify webhooks with mock data
- Test Trello OAuth flow end-to-end
- Verify rate limiting behavior
- Test error handling paths

## Questions?

Open an issue or contact the maintainers.

