import React from "react";
import { ChatMessages, ChatInput } from "../components/Chat.jsx";

export default function Home() {
  // STATE: Convert static data to dynamic state
  const [messages, setMessages] = React.useState(initialMessages);

  // CALLBACK FUNCTION: Add new message to state array
  const addMessage = (content) => {
    const newMessage = {
      id: messages.length + 1, // Simple ID generation
      type: "user",
      content: content,
    };

    // IMMUTABLE UPDATE: Create new array with spread operator
    setMessages([...messages, newMessage]);
  };

  return (
    <main className="chat-container">
      {/* Passing messages state as props - DATA FLOW! */}
      <ChatMessages messages={messages} />
      {/* Passing callback function as props - CALLBACK PROPS! */}
      <ChatInput onAddMessage={addMessage} />
    </main>
  );
}
