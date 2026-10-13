import { useState } from "react";
import { ChatMessages, ChatInput } from "../components/Chat.jsx";

/**
 * Chat New Route Component
 *
 * This route handles the creation of new chat threads.
 * For now, it displays an empty chat interface where users can start a conversation.
 *
 * Key concepts:
 * 1. DEDICATED ROUTE: Separate route for new chat functionality
 * 2. CLEAN URL: /chat/new is semantic and user-friendly
 * 3. COMPONENT REUSE: Uses the same Chat components as home
 */
export default function ChatNew() {
  const [messages, setMessages] = useState([]);

  const addMessage = (content) => {
    const newMessage = {
      id: messages.length + 1,
      type: "user",
      content: content,
    };

    setMessages([...messages, newMessage]);
  };

  return (
    <main className="chat-container">
      <div className="chat-thread-header">
        <h2>Start a new conversation</h2>
        <p>Type a message below to begin chatting</p>
      </div>
      <ChatMessages messages={messages} />
      <ChatInput onAddMessage={addMessage} />
    </main>
  );
}
