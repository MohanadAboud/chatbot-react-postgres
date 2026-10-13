import React from "react";

function Message({ type = "user", children }) {
  return (
    <div className={`message ${type}-message`}>
      <div className="message-content">{children}</div>
    </div>
  );
}

function ChatMessages({ messages = [] }) {
  return (
    <div className="chat-messages">
      {/* Using destructured messages with safe default! */}
      {messages.map((message) => (
        <Message key={message.id} type={message.type}>
          {message.content}
        </Message>
      ))}
    </div>
  );
}

function ChatInput({ onAddMessage }) {
  // LOCAL STATE: Managing form submission state
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // EVENT HANDLER: Handle form submission with callback
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission

    // Get form data using FormData API (uncontrolled approach)
    const formData = new FormData(event.target);
    const message = formData.get("message").trim();

    // Basic validation
    if (!message) {
      return; // Don't submit empty messages
    }

    setIsSubmitting(true);

    // Call parent's callback function to add message
    if (onAddMessage) {
      onAddMessage(message);
    }

    // Clear the form
    event.target.reset();

    // Simulate async operation (like API call)
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="chat-input-container">
      <form className="chat-input-wrapper" onSubmit={handleSubmit}>
        <textarea
          name="message"
          className="chat-input"
          placeholder="Type your message here..."
          rows="1"
        />
        <button className="send-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export { Message, ChatMessages, ChatInput };
