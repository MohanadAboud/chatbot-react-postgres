import {
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useRevalidator,
  useRouteError,
} from "react-router";
import Sidebar from "../components/Sidebar.jsx";
import { apiFetch } from "../lib/apiFetch.js";
import { supabase } from "../lib/supabase.js";

export async function clientLoader() {
  const response = await apiFetch("/api/threads");

  // Check if the request was successful
  if (!response.ok) {
    const message =
      response.status >= 500
        ? "The API could not load threads. Check that backend/.env has a valid DATABASE_URL and that the database is reachable."
        : `The API request failed with status ${response.status}.`;

    throw new Response(message, { status: response.status });
  }

  // Parse the JSON response
  const threads = await response.json();

  return { threads };
}

export function ErrorBoundary() {
  const error = useRouteError();
  const { revalidate, state } = useRevalidator();
  const message =
    error?.data ||
    (error instanceof Error
      ? "Could not reach the chat API. Check that the backend server is running."
      : "An unexpected error occurred while loading chats.");

  return (
    <main className="route-error" role="alert">
      <div>
        <h1>Couldn't load chat threads</h1>
        <p>{message}</p>
        <div className="route-error-actions">
          <button
            type="button"
            onClick={revalidate}
            disabled={state === "loading"}
          >
            {state === "loading" ? "Retrying..." : "Try again"}
          </button>
          <Link to="/chat/new">Start a new chat</Link>
        </div>
      </div>
    </main>
  );
}

export async function clientAction({ request }) {
  // Extract form data
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Handle delete intent
  if (intent === "delete") {
    const threadId = formData.get("threadId");
    try {
      // DELETE request to our custom API
      // Messages are automatically deleted due to CASCADE
      const response = await apiFetch(`/api/threads/${threadId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return { error: `Failed to delete thread: ${response.status}` };
      }

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }
  if (intent === "logout") {
    // Sign out the user using Supabase Auth
    // This clears the session and JWT tokens from localStorage
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error.message);
    }

    // Redirect to login page after logout
    return redirect("/login");
  }

  return null;
}

export default function Layout() {
  // Access threads data from the loader
  const { threads } = useLoaderData();

  return (
    <div className="app-layout">
      <Sidebar threads={threads} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
