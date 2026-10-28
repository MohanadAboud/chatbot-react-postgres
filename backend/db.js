import postgres from "postgres";

// Get database connection string from environment variable
const connectionString = process.env.DATABASE_URL;

// Validate that DATABASE_URL is provided
if (!connectionString) {
  throw new Error(
    "DATABASE_URL environment variable is not set. " +
      "Please add it to your .env file.",
  );
}

const sql = postgres(connectionString);

export default sql;
