import {
  useLoaderData,
  useActionData,
  Link,
  useRouteError,
  href,
  Outlet,
} from "react-router";
import { ChatMessages, ChatInput } from "../components/Chat.jsx";

export function ErrorBoundary() {
  const error = useRouteError();

  // Check if this is a 404 error (thread not found)
  const isNotFound = error?.status === 404;

  return (
    <div className="chat-container">
      <div className="chat-thread-header">
        <h2>{isNotFound ? "Thread Not Found" : "Something Went Wrong"}</h2>
        <p>
          {isNotFound
            ? "This conversation may have been deleted or never existed."
            : error?.message || "An unexpected error occurred."}
        </p>
        <p>
          <Link to={href("/chat/new")}>Start a new chat</Link>
        </p>
      </div>
    </div>
  );
}

export async function clientLoader({ params }) {
  const apiUrl = import.meta.env.VITE_API_URL;

  // Fetch thread metadata from our API
  // Our API returns a single object (not an array) for found threads
  const threadUrl = `${apiUrl}/api/threads/${params.threadId}`;

  const threadResponse = await fetch(threadUrl);

  // Check for 404 specifically - thread doesn't exist
  if (threadResponse.status === 404) {
    throw new Response("Thread not found", { status: 404 });
  }

  // Check for other errors
  if (!threadResponse.ok) {
    throw new Error(`Failed to fetch thread: ${threadResponse.status}`);
  }

  // Our API returns the thread object directly (not in an array)
  const thread = await threadResponse.json();

  // Fetch messages for this thread
  // Our API handles filtering by thread_id and sorting chronologically
  const messagesUrl = `${apiUrl}/api/threads/${params.threadId}/messages`;

  const messagesResponse = await fetch(messagesUrl);

  if (!messagesResponse.ok) {
    throw new Error(`Failed to fetch messages: ${messagesResponse.status}`);
  }

  const messages = await messagesResponse.json();

  return {
    thread,
    messages,
  };
}

export async function clientAction({ params, request }) {
  const apiUrl = import.meta.env.VITE_API_URL;

  // Extract form data from the request
  const formData = await request.formData();
  const content = formData.get("message");

  // Basic client-side validation (server will validate too)
  if (!content || !content.trim()) {
    return { error: "Message cannot be empty" };
  }

  // Create the message object
  const newMessage = {
    type: "user",
    content: content.trim(),
  };

  // POST to our custom API to create the message
  try {
    const response = await fetch(
      `${apiUrl}/api/threads/${params.threadId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMessage),
      },
    );

    // Check for validation errors (400)
    if (response.status === 400) {
      const error = await response.json();
      return { error: error.error || "Invalid message data" };
    }

    // Check for other errors
    if (!response.ok) {
      return { error: `Failed to create message: ${response.status}` };
    }

    // Return success - loader will automatically revalidate
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export default function ChatThread() {
  // Access the thread and messages data from the loader
  const { thread, messages } = useLoaderData();

  // Access the action result (success or error)
  const actionData = useActionData();

  return (
    <main className="chat-container">
      <Outlet />
      <div className="chat-thread-header">
        <h2>{thread.title}</h2>
        <Link to="edit" className="thread-title-edit-link">
          Edit
        </Link>
      </div>
      <ChatMessages messages={messages} />
      <ChatInput />
      {actionData?.error && (
        <div className="error-message">{actionData.error}</div>
      )}
    </main>
  );
}
