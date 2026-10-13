import { useLoaderData } from "react-router";
import { ChatMessages, ChatInput } from "../components/Chat.jsx";

export async function clientLoader({ params }) {
  await new Promise((resolve) => setTimeout(resolve, 500));

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

export default function ChatThread() {
  // Extract the threadId from the URL using useParams()

  const { threadId, messages } = useLoaderData();
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
