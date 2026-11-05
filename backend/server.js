// ========== Import dependencies ========== //
import express from "express";
import cors from "cors";
import sql from "./db.js";
import { requireAuth } from "./auth.js";

// ========== Setup Express App ========== //
const app = express();
const PORT = process.env.PORT || 3000;

// ========== Middleware ========== //

app.use(cors());

app.use(express.json());

// ========== Define API Endpoints ========== //

app.get("/", (req, res) => {
  res.json({
    message: "Chatbot API Server 🤖",
    version: "1.0.0",
  });
});

app.get("/api/threads", requireAuth, async (req, res) => {
  try {
    // Execute SQL query using the sql`` tagged template
    const threads = await sql`
      SELECT id, title, created_at 
      FROM threads 
      ORDER BY created_at DESC
    `;

    // Return the threads as JSON
    // Express automatically sets Content-Type: application/json
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

app.get("/api/threads/:id", requireAuth, async (req, res) => {
  try {
    // Extract the thread ID from the URL
    // For /api/threads/123, req.params.id will be "123"
    const threadId = req.params.id;

    // Execute SQL query with WHERE clause
    // The ${threadId} is safely parameterized by the postgres library
    const threads = await sql`
      SELECT id, title, created_at 
      FROM threads 
      WHERE id = ${threadId}
    `;

    // Check if thread was found
    // SQL returns an empty array if no matches
    if (threads.length === 0) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    // Return the first (and only) thread
    res.json(threads[0]);
  } catch (error) {
    console.error("Error fetching thread:", error);
    res.status(500).json({
      error: "Failed to fetch thread from database",
    });
  }
});

app.get("/api/threads/:id/messages", requireAuth, async (req, res) => {
  try {
    const threadId = req.params.id;

    // Fetch all messages for this thread
    // Filter by thread_id foreign key and sort chronologically
    const messages = await sql`
      SELECT id, thread_id, type, content, created_at 
      FROM messages 
      WHERE thread_id = ${threadId}
      ORDER BY created_at ASC
    `;

    // Return messages array (empty array if no messages yet)
    // Unlike single thread endpoint, we don't 404 for empty results
    // An empty thread is valid - it just has no messages yet
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      error: "Failed to fetch messages from database",
    });
  }
});

app.post("/api/threads/:id/messages", requireAuth, async (req, res) => {
  try {
    const threadId = req.params.id;
    const { type, content } = req.body;

    // Validate required fields
    if (!type || !content) {
      return res.status(400).json({
        error: "Both 'type' and 'content' are required",
      });
    }

    // Validate type is either 'user' or 'bot'
    if (type !== "user" && type !== "bot") {
      return res.status(400).json({
        error: "Type must be either 'user' or 'bot'",
      });
    }

    // Validate content is not empty after trimming
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return res.status(400).json({
        error: "Content cannot be empty",
      });
    }

    // Insert the new message
    // RETURNING * gives us back the inserted row (including generated id and created_at)
    const messages = await sql`
      INSERT INTO messages (thread_id, type, content)
      VALUES (${threadId}, ${type}, ${trimmedContent})
      RETURNING id, thread_id, type, content, created_at
    `;

    // Return the created message with 201 Created status
    res.status(201).json(messages[0]);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({
      error: "Failed to create message",
    });
  }
});

app.post("/api/threads", requireAuth, async (req, res) => {
  try {
    const { title, content } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        error: "Both 'title' and 'content' are required",
      });
    }

    // Validate title is not empty after trimming
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return res.status(400).json({
        error: "Title cannot be empty",
      });
    }

    // Validate content is not empty after trimming
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return res.status(400).json({
        error: "Content cannot be empty",
      });
    }

    // Step 1: Create the thread
    // Use RETURNING to get the generated ID for the next insert
    const threads = await sql`
      INSERT INTO threads (title)
      VALUES (${trimmedTitle})
      RETURNING id, title, created_at
    `;

    const thread = threads[0];

    // Step 2: Create the first message in the new thread
    // Use the thread ID from the previous insert
    const messages = await sql`
      INSERT INTO messages (thread_id, type, content)
      VALUES (${thread.id}, 'user', ${trimmedContent})
      RETURNING id, thread_id, type, content, created_at
    `;

    // Return both the thread and the initial message with 201 Created status
    // This gives the frontend everything it needs to navigate to the new thread
    res.status(201).json({
      thread: thread,
      message: messages[0],
    });
  } catch (error) {
    console.error("Error creating thread:", error);
    res.status(500).json({
      error: "Failed to create thread",
    });
  }
});

app.patch("/api/threads/:id", requireAuth, async (req, res) => {
  try {
    // Extract the thread ID from the URL parameters
    const threadId = req.params.id;

    // Extract the new title from the request body
    const { title } = req.body;

    // Validate that title is provided
    if (!title) {
      return res.status(400).json({
        error: "Title is required",
      });
    }

    // Validate title is not empty after trimming
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return res.status(400).json({
        error: "Title cannot be empty",
      });
    }

    // Update the thread in the database
    // Only the title field is modified, other fields (created_at) remain unchanged
    const result = await sql`
      UPDATE threads
      SET title = ${trimmedTitle}
      WHERE id = ${threadId}
      RETURNING id, title, created_at
    `;

    // If no thread was updated, it means the thread doesn't exist
    if (result.length === 0) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    // Return the updated thread with 200 OK status
    res.json(result[0]);
  } catch (error) {
    console.error("Error updating thread:", error);
    res.status(500).json({
      error: "Failed to update thread",
    });
  }
});

app.delete("/api/threads/:id", requireAuth, async (req, res) => {
  try {
    // Extract the thread ID from the URL parameters
    const threadId = req.params.id;

    // Delete the thread from the database
    // Note: This will automatically delete all associated messages
    // because of the ON DELETE CASCADE constraint on the messages table
    const result = await sql`
      DELETE FROM threads
      WHERE id = ${threadId}
      RETURNING id
    `;

    // If no thread was deleted, it means the thread doesn't exist
    if (result.length === 0) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    // Return success message
    res.json({
      message: "Thread deleted successfully",
      deletedId: result[0].id,
    });
  } catch (error) {
    console.error("Error deleting thread:", error);
    res.status(500).json({
      error: "Failed to delete thread",
    });
  }
});

// ========== Start the server ========== //
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
