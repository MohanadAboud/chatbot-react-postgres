import { useLoaderData } from "react-router";
import { ChatMessages, ChatInput } from "../components/Chat.jsx";

/**
 * CLIENT LOADER FUNCTION
 *
 * This function runs before the component renders and provides data.
 * Key concepts:
 * 1. ASYNC FUNCTION: Can perform asynchronous operations like data fetching
 * 2. PARAMS ACCESS: Receives route parameters (like threadId) via the params object
 * 3. SIMULATED DELAY: We add a delay to simulate a real API call
 * 4. RETURN VALUE: Whatever is returned becomes available via useLoaderData()
 *
 * The loader runs:
 * - When you navigate to this route
 * - When you refresh the page
 * - When React Router revalidates data
 */
export async function clientLoader({ params }) {
  // Simulate a network delay (like calling an API)
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock data based on the threadId
  // In the real app, this would be fetched from Supabase
  const mockMessages = [
    {
      id: 1,
      type: "user",
      content: `This is a message in thread ${params.threadId}`,
    },
    {
      id: 2,
      type: "bot",
      content: `This is the bot's response in thread ${params.threadId}`,
    },
  ];

  // Return data that will be available via useLoaderData()
  return {
    threadId: params.threadId,
    messages: mockMessages,
  };
}

/**
 * Chat Thread Route Component
 *
 * Now uses DATA LOADING instead of local state!
 *
 * Key concepts:
 * 1. useLoaderData() HOOK: Accesses data returned from clientLoader
 * 2. NO LOADING STATES NEEDED: Data is guaranteed to be available
 * 3. DATA READY ON RENDER: Component receives data before it renders
 * 4. DECLARATIVE: We declare what data we need, not how to fetch it
 */
export default function ChatThread() {
  // Access the data that was loaded by clientLoader
  const { threadId, messages } = useLoaderData();

  // For now, we keep the addMessage handler but it won't persist
  // This will be replaced with clientAction in a later step
  const addMessage = (content) => {
    console.log("Message submitted:", content);
    console.log("(Data mutations will be implemented in the next phase)");
  };

  return (
    <main className="chat-container">
      <div className="chat-thread-header">
        <h2>Conversation Thread #{threadId}</h2>
      </div>
      <ChatMessages messages={messages} />
      <ChatInput onAddMessage={addMessage} />
    </main>
  );
}
