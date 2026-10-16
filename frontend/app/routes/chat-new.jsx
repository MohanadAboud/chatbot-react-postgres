import { useActionData, redirect } from "react-router";
import { ChatInput, ChatMessages } from "../components/Chat.jsx";


export async function clientAction({ request }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Extract form data
  const formData = await request.formData();
  const content = formData.get("message");

  // Validate message content
  if (!content || !content.trim()) {
    return { error: "Message cannot be empty" };
  }

  // Generate thread title from first message (truncate to 50 chars)
  const title =
    content.trim().length > 50
      ? content.trim().slice(0, 50) + "..."
      : content.trim();

  try {
    // Step 1: Create the thread
    const threadResponse = await fetch(`${supabaseUrl}/rest/v1/threads`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation", // Need the created thread's ID
      },
      body: JSON.stringify({ title }),
    });

    if (!threadResponse.ok) {
      return { error: `Failed to create thread: ${threadResponse.status}` };
    }

    // Get the created thread (returns array with one item)
    const [thread] = await threadResponse.json();

    // Step 2: Create the first message in the new thread
    const messageResponse = await fetch(`${supabaseUrl}/rest/v1/messages`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        thread_id: thread.id,
        type: "user",
        content: content.trim(),
      }),
    });

    if (!messageResponse.ok) {
      return { error: `Failed to create message: ${messageResponse.status}` };
    }

    // Step 3: Redirect to the new thread
    return redirect(`/chat/${thread.id}`);
  } catch (error) {
    return { error: error.message };
  }
}


export default function ChatNew() {
  // Access action result for error display
  const actionData = useActionData();

  return (
    <main className="chat-container">
      <div className="chat-thread-header">
        <h2>Start a new conversation</h2>
        <p>Type a message below to begin chatting</p>
      </div>
      <ChatMessages />
      <ChatInput />
      {actionData?.error && (
        <div className="error-message">{actionData.error}</div>
      )}
    </main>
  );
}
