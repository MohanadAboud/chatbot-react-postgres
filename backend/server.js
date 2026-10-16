// ========== Import dependencies ========== //
import express from "express";
import cors from "cors";
import sql from "./db.js";

// ========== Setup Express App ========== //
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// ========== Define API Endpoints ========== //

// Root endpoint - verify server is running
app.get("/", (req, res) => {
  res.json({
    message: "Chatbot API Server 🤖",
    version: "1.0.0",
  });
});

app.get("/api/threads", async (req, res) => {
  try {
    // Execute SQL query using the sql`` tagged template
    const threads = await sql`
      SELECT id, title, created_at 
      FROM threads 
      ORDER BY created_at DESC
    `;

    res.json(threads);
  } catch (error) {
    // Log the error for debugging (you should see this in the terminal)
    console.error("Error fetching threads:", error);

    // Return a generic error message to the client
    // Don't expose internal error details for security
    res.status(500).json({
      error: "Failed to fetch threads from database",
    });
  }
});

// ========== Start the server ========== //
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
