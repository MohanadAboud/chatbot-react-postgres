import React from "react";
import { href, Link, NavLink } from "react-router";

/**
 * Sidebar Components
 *
 * This file demonstrates React component organization and modularity:
 * 1. Multiple related components in one file
 * 2. Import/export patterns for sharing components
 * 3. Component composition and hierarchy
 * 4. File organization for better project structure
 * 5. CONTROLLED COMPONENTS: Components that manage form input state
 * 6. CLIENT-SIDE NAVIGATION: Using Link for faster page transitions
 */

/**
 * SidebarHeader Component
 *
 * Handles the top section of the sidebar with title and new chat button.
 * Now uses React Router's Link component for client-side navigation.
 *
 * Key concepts:
 * 1. LINK COMPONENT: Enables client-side routing without full page reload
 * 2. FASTER NAVIGATION: No server roundtrip, instant UI updates
 * 3. SPA BEHAVIOR: Maintains application state during navigation
 */
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

/**
 * ChatThreadItem Component
 *
 * Now uses NAVLINK for ACTIVE and PENDING STATE STYLING! Key concepts:
 * 1. DESTRUCTURING: Extract thread data and callback function
 * 2. CALLBACK INVOCATION: Call parent function to trigger state updates
 * 3. EVENT HANDLING: Still handle click events but now trigger real actions
 * 4. STATE LIFTING: Component doesn't manage state, just triggers updates
 * 5. UNIDIRECTIONAL DATA FLOW: Data flows down, events flow up
 * 6. NAVLINK COMPONENT: Automatically provides isActive and isPending states
 * 7. ACTIVE STYLING: Highlights the currently displayed thread
 * 8. PENDING STYLING: Shows pulsating animation while data is loading
 */
function ChatThreadItem({ thread, onDeleteThread }) {
  const { id, title } = thread;

  const handleDeleteClick = (event) => {
    // Prevent the click from bubbling up to parent elements
    event.stopPropagation();

    // Call the callback function passed from parent to delete the thread
    if (onDeleteThread) {
      onDeleteThread(id);
    }
  };

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
        <button
          className="delete-thread-btn"
          aria-label={`Delete thread: ${title}`}
          title="Delete this conversation"
          type="button"
          onClick={handleDeleteClick}
        >
          &times;
        </button>
      </div>
    </li>
  );
}

/**
 * ChatThreadsList Component
 *
 * Now demonstrates CONTROLLED COMPONENTS and COMPUTED STATE! Key concepts:
 * 1. CONTROLLED COMPONENTS: Input value managed by React state
 * 2. COMPUTED STATE: Filtering data without additional useState
 * 3. ARRAY METHODS: Using filter() to transform data
 * 4. LOCAL STATE: Managing search input with useState
 * 5. CASE-INSENSITIVE SEARCH: Using toLowerCase() for better UX
 * 6. REAL-TIME FILTERING: Updates as user types
 */
function ChatThreadsList({ threads = [], onDeleteThread }) {
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
        {/* Render filtered threads instead of all threads */}
        {filteredThreads.map((thread) => (
          <ChatThreadItem
            key={thread.id}
            thread={thread}
            onDeleteThread={onDeleteThread}
          />
        ))}
      </ul>
    </nav>
  );
}

/**
 * SidebarFooter Component
 *
 * Handles the user profile section at the bottom of the sidebar.
 * Demonstrates component modularity and independence.
 */
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

/**
 * Main Sidebar Component
 *
 * Now handles CALLBACK PROP DRILLING! Key concepts:
 * 1. DESTRUCTURING: Extract both data and callback functions
 * 2. CALLBACK DRILLING: Pass functions down through component hierarchy
 * 3. INTERMEDIATE COMPONENT: Forwards callbacks without using them directly
 * 4. SEPARATION OF CONCERNS: Sidebar doesn't handle delete logic
 * 5. PROP FORWARDING: Clean pattern for passing props to children
 */
export default function Sidebar({ threads, onDeleteThread }) {
  return (
    <aside className="sidebar">
      {/* Component composition with both data and callback drilling */}
      <SidebarHeader />
      <ChatThreadsList threads={threads} onDeleteThread={onDeleteThread} />
      <SidebarFooter />
    </aside>
  );
}
