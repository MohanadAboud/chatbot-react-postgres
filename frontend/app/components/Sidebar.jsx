import React from "react";
import { href, Link, NavLink, useFetcher } from "react-router";

function SidebarHeader() {
  return (
    <div className="sidebar-header">
      <h2 className="chatbot-title">Chatbot</h2>
      <Link to="/chat/new" className="new-chat-btn">
        + New
      </Link>
    </div>
  );
}

function ChatThreadItem({ thread }) {
  const { id, title } = thread;
  const fetcher = useFetcher();

  // Check if this specific thread is being deleted
  const isDeleting =
    fetcher.state !== "idle" && fetcher.formData?.get("threadId") === id;

  return (
    <li className="chat-thread-item">
      <div className="chat-thread-item-content">
        <NavLink
          to={href("/chat/:threadId", { threadId: id })}
          className={({ isActive, isPending }) =>
            [
              "chat-thread-link",
              isActive && "chat-thread-link-active",
              isPending && "chat-thread-link-pending",
            ]
              .filter(Boolean)
              .join(" ")
          }
        >
          {title}
        </NavLink>
        <fetcher.Form method="post">
          {/* Hidden inputs to identify the action and thread */}
          <input type="hidden" name="intent" value="delete" />
          <input type="hidden" name="threadId" value={id} />
          <button
            className="delete-thread-btn"
            aria-label={`Delete thread: ${title}`}
            title="Delete this conversation"
            type="submit"
            disabled={isDeleting}
          >
            {isDeleting ? "···" : "×"}
          </button>
        </fetcher.Form>
      </div>
    </li>
  );
}

function ChatThreadsList({ threads = [] }) {
  // LOCAL STATE: Managing search input value (controlled component)
  const [searchValue, setSearchValue] = React.useState("");

  // EVENT HANDLER: Update search value as user types
  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
  };

  // COMPUTED STATE: Filter threads based on search value
  // This is NOT stored in state - it's computed on every render
  const filteredThreads = threads.filter((thread) =>
    thread.title.toLowerCase().includes(searchValue.toLowerCase()),
  );

  return (
    <nav className="chat-threads-list" aria-label="Chat threads">
      {/* Search input - CONTROLLED COMPONENT */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search conversations..."
          value={searchValue}
          onChange={handleSearchChange}
        />
      </div>

      <ul>
        {/* Render filtered threads - no callback prop needed */}
        {filteredThreads.map((thread) => (
          <ChatThreadItem key={thread.id} thread={thread} />
        ))}
      </ul>
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="sidebar-footer">
      <a href="/profile" className="user-profile">
        <img
          src="https://ui-avatars.com/api/?name=Batman&background=0D0D0D&color=fff&size=40"
          alt="User avatar"
          className="user-avatar"
          width={30}
          height={30}
        />
        <span className="user-name">Batman</span>
      </a>
    </div>
  );
}

export default function Sidebar({ threads }) {
  return (
    <aside className="sidebar">
      {/* Component composition - no callback prop drilling needed */}
      <SidebarHeader />
      <ChatThreadsList threads={threads} />
      <SidebarFooter />
    </aside>
  );
}
