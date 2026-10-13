import { Outlet, useLoaderData } from "react-router";
import Sidebar from "../components/Sidebar.jsx";

export async function clientLoader() {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const mockThreadData = [
    {
      id: "1",
      title: "How to learn programming?",
    },
    {
      id: "2",
      title: "What are the best pizza toppings?",
    },
    {
      id: "3",
      title: "Can you explain quantum physics?",
    },
    {
      id: "4",
      title: "Help me create a morning routine",
    },
    {
      id: "5",
      title: "What should I do this weekend?",
    },
    { id: "6", title: "Why is the sky blue?" },
    {
      id: "7",
      title: "How do I learn a new language?",
    },
    {
      id: "8",
      title: "What's the meaning of life?",
    },
    { id: "9", title: "Tell me a funny joke" },
    {
      id: "10",
      title: "What's a healthy dinner idea?",
    },
  ];

  return { threads: mockThreadData };
}

export default function Layout() {
  // STATE: threads is now dynamic data that can change!
  const { threads } = useLoaderData();

  // CALLBACK FUNCTION: Handle deleting a thread by ID
  const deleteThread = (threadId) => {
    console.log("Delete thread:", threadId);
    console.log("(Mutations will be implemented in the next phase)");
  };

  return (
    <div className="app-layout">
      {/* Passing both data and callbacks via prop drilling */}
      <Sidebar threads={threads} onDeleteThread={deleteThread} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
