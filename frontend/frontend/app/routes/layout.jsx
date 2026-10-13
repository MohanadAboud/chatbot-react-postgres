import { Outlet, useLoaderData } from "react-router";
import Sidebar from "../components/Sidebar.jsx";

/**
 * CLIENT LOADER FUNCTION
 *
 * Loads the list of chat threads before the layout renders.
 * Key concepts:
 * 1. PARENT ROUTE LOADER: Runs before any child route loaders
 * 2. SHARED DATA: Data is available to this component and can be accessed by children
 * 3. SIMULATED API CALL: We add a delay to mimic fetching from a database
 * 4. MOCK DATA: Returns static data that will later come from Supabase
 *
 * This loader runs:
 * - On initial page load
 * - When navigating to any route under this layout
 * - When React Router revalidates (after mutations)
 */
export async function clientLoader() {
  // Simulate network delay (like calling an API)
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Mock thread data - later this will come from Supabase
  const mockThreads = [
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
    {
      id: "6",
      title: "Why is the sky blue?",
    },
    {
      id: "7",
      title: "How do I learn a new language?",
    },
    {
      id: "8",
      title: "What's the meaning of life?",
    },
    {
      id: "9",
      title: "Tell me a funny joke",
    },
    {
      id: "10",
      title: "What's a healthy dinner idea?",
    },
  ];

  return { threads: mockThreads };
}

/**
 * Layout Component
 *
 * Now uses DATA LOADING instead of local state!
 *
 * Key concepts:
 * 1. useLoaderData() HOOK: Accesses data from clientLoader
 * 2. NO STATE MANAGEMENT: Data comes from loader, not useState
 * 3. LAYOUT PATTERN: Wraps child routes with consistent UI (sidebar)
 * 4. OUTLET: Renders the matched child route component
 */
export default function Layout() {
  // Access threads data from the loader
  const { threads } = useLoaderData();

  // Delete functionality will be re-implemented with clientAction later
  const deleteThread = (threadId) => {
    console.log("Delete thread:", threadId);
    console.log("(Mutations will be implemented in the next phase)");
  };

  return (
    <div className="app-layout">
      <Sidebar threads={threads} onDeleteThread={deleteThread} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
