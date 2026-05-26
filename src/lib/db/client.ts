import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export class DatabaseConfigurationError extends Error {
  constructor() {
    super("DATABASE_URL is required for server-side database access.");
    this.name = "DatabaseConfigurationError";
  }
}

export class DatabaseQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseQueryError";
  }
}

export function getDatabasePool(): pg.Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new DatabaseConfigurationError();
  }

  pool ??= new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  return pool;
}

export async function query<T extends pg.QueryResultRow>(
  text: string,
  values: readonly unknown[] = []
): Promise<pg.QueryResult<T>> {
  try {
    return await getDatabasePool().query<T>(text, [...values]);
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      throw error;
    }

    throw new DatabaseQueryError(error instanceof Error ? error.message : "Database query failed.");
  }
}
