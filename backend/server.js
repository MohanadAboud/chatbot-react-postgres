// ========== Import dependencies ========== //
import express from "express";
import cors from "cors";
import sql from "./db.js";
import { requireAuth } from "./auth.js";

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

app.post("/api/test-mistral", async (req, res) => {
  try {
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error:
          "Mistral API key not configured. Please set MISTRAL_API_KEY in your .env file",
      });
    }

    const mistralResponse = await fetch(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [
            {
              role: "user",
              content: "Hello! Please respond with a short greeting.",
            },
          ],
        }),
      },
    );

    if (!mistralResponse.ok) {
      const errorData = await mistralResponse.json();
      console.error("Mistral API error:", errorData);
      return res.status(mistralResponse.status).json({
        error: "Failed to get response from Mistral API",
        details: errorData,
      });
    }

    const data = await mistralResponse.json();

    res.json({
      message: "Successfully connected to Mistral API!",
      response: data,
    });
  } catch (error) {
    console.error("Error testing Mistral API:", error);
    res.status(500).json({
      error: "Failed to test Mistral API",
      details: error.message,
    });
  }
});

app.get("/api/threads", requireAuth, async (req, res) => {
  try {
    // Execute SQL query using the sql`` tagged template
    // WHERE clause filters to only threads owned by the authenticated user
    // This is the core of authorization - filtering data by ownership
    const threads = await sql`
      SELECT id, title, user_id, created_at 
      FROM threads 
      WHERE user_id = ${req.userId}
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
    const threadId = req.params.id;

    const threads = await sql`
      SELECT id, title, user_id, created_at 
      FROM threads 
      WHERE id = ${threadId} AND user_id = ${req.userId}
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

app.get("/api/threads/:id/messages", requireAuth, async (req, res) => {
  try {
    const threadId = req.params.id;

    const threads = await sql`
      SELECT id 
      FROM threads 
      WHERE id = ${threadId} AND user_id = ${req.userId}
    `;

    if (threads.length === 0) {
      return res.json([]);
    }

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

app.post("/api/threads/:id/messages", requireAuth, async (req, res) => {
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

    const threads = await sql`
      SELECT id 
      FROM threads 
      WHERE id = ${threadId} AND user_id = ${req.userId}
    `;

    if (threads.length === 0) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    const userMessages = await sql`
      INSERT INTO messages (thread_id, type, content)
      VALUES (${threadId}, ${type}, ${trimmedContent})
      RETURNING id, thread_id, type, content, created_at
    `;

    const userMessage = userMessages[0];

    const allMessages = await sql`
      SELECT id, thread_id, type, content, created_at 
      FROM messages 
      WHERE thread_id = ${threadId}
      ORDER BY created_at ASC
    `;

    const mistralMessages = allMessages.map((msg) => ({
      role: msg.type === "bot" ? "assistant" : "user",
      content: msg.content,
    }));

    const systemPrompt = {
      role: "system",
      content:
        "You are a helpful and friendly AI assistant. Keep your responses concise, clear, and conversational. If you don't know something, admit it honestly. Be encouraging and supportive in your tone.",
    };

    mistralMessages.unshift(systemPrompt);

    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      console.error("Mistral API key not configured");
      return res.status(201).json(userMessage);
    }

    const mistralResponse = await fetch(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: mistralMessages,
        }),
      },
    );

    if (!mistralResponse.ok) {
      const errorData = await mistralResponse.json();
      console.error("Mistral API error:", errorData);
      return res.status(201).json(userMessage);
    }

    const aiData = await mistralResponse.json();
    const aiContent = aiData.choices[0].message.content;

    const botMessages = await sql`
      INSERT INTO messages (thread_id, type, content)
      VALUES (${threadId}, 'bot', ${aiContent})
      RETURNING id, thread_id, type, content, created_at
    `;

    const botMessage = botMessages[0];

    res.status(201).json({
      userMessage: userMessage,
      botMessage: botMessage,
    });
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
      INSERT INTO threads (title, user_id)
      VALUES (${trimmedTitle}, ${req.userId})
      RETURNING id, title, user_id, created_at
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

app.patch("/api/threads/:id", requireAuth, async (req, res) => {
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
      WHERE id = ${threadId} AND user_id = ${req.userId}
      RETURNING id, title, user_id, created_at
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

app.delete("/api/threads/:id", requireAuth, async (req, res) => {
  try {
    const threadId = req.params.id;

    const result = await sql`
      DELETE FROM threads
      WHERE id = ${threadId} AND user_id = ${req.userId}
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
