# PocketSync Backend

Backend service for synchronizing data changes across multiple devices and applications.

### API Endpoints
- See [API Documentation](https://api.pocketsync.dev/api)

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (copy .env.example to .env)
4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the development server:
   ```bash
   npm run start:dev
   ```

## License

MIT