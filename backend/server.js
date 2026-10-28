import express from "express";
import cors from "cors";
import sql from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Chatbot API Server 🤖",
    version: "1.0.0",
  });
});

app.get("/api/threads", async (req, res) => {
  try {
    const threads = await sql`
      SELECT id, title, created_at 
      FROM threads 
      ORDER BY created_at DESC
    `;

    res.json(threads);
  } catch (error) {
    console.error("Error fetching threads:", error);

    res.status(500).json({
      error: "Failed to fetch threads from database",
    });
  }
});

app.get("/api/threads/:id", async (req, res) => {
  try {
    const threadId = req.params.id;

    const threads = await sql`
      SELECT id, title, created_at 
      FROM threads 
      WHERE id = ${threadId}
    `;

    if (threads.length === 0) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    res.json(threads[0]);
  } catch (error) {
    console.error("Error fetching thread:", error);
    res.status(500).json({
      error: "Failed to fetch thread from database",
    });
  }
});

app.get("/api/threads/:id/messages", async (req, res) => {
  try {
    const threadId = req.params.id;

    const messages = await sql`
      SELECT id, thread_id, type, content, created_at 
      FROM messages 
      WHERE thread_id = ${threadId}
      ORDER BY created_at ASC
    `;

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      error: "Failed to fetch messages from database",
    });
  }
});

app.post("/api/threads/:id/messages", async (req, res) => {
  try {
    const threadId = req.params.id;
    const { type, content } = req.body;

    if (!type || !content) {
      return res.status(400).json({
        error: "Both 'type' and 'content' are required",
      });
    }

    if (type !== "user" && type !== "bot") {
      return res.status(400).json({
        error: "Type must be either 'user' or 'bot'",
      });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return res.status(400).json({
        error: "Content cannot be empty",
      });
    }

    const messages = await sql`
      INSERT INTO messages (thread_id, type, content)
      VALUES (${threadId}, ${type}, ${trimmedContent})
      RETURNING id, thread_id, type, content, created_at
    `;

    res.status(201).json(messages[0]);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({
      error: "Failed to create message",
    });
  }
});

app.post("/api/threads", async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: "Both 'title' and 'content' are required",
      });
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return res.status(400).json({
        error: "Title cannot be empty",
      });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return res.status(400).json({
        error: "Content cannot be empty",
      });
    }

    const threads = await sql`
      INSERT INTO threads (title)
      VALUES (${trimmedTitle})
      RETURNING id, title, created_at
    `;

    const thread = threads[0];

    const messages = await sql`
      INSERT INTO messages (thread_id, type, content)
      VALUES (${thread.id}, 'user', ${trimmedContent})
      RETURNING id, thread_id, type, content, created_at
    `;

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

app.patch("/api/threads/:id", async (req, res) => {
  try {
    const threadId = req.params.id;

    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        error: "Title is required",
      });
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return res.status(400).json({
        error: "Title cannot be empty",
      });
    }

    const result = await sql`
      UPDATE threads
      SET title = ${trimmedTitle}
      WHERE id = ${threadId}
      RETURNING id, title, created_at
    `;

    if (result.length === 0) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error updating thread:", error);
    res.status(500).json({
      error: "Failed to update thread",
    });
  }
});

app.delete("/api/threads/:id", async (req, res) => {
  try {
    const threadId = req.params.id;

    const result = await sql`
      DELETE FROM threads
      WHERE id = ${threadId}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

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

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
