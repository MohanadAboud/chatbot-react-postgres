import {
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useRevalidator,
  useRouteError,
} from "react-router";
import Sidebar from "../components/Sidebar.jsx";

export async function clientLoader() {
  const apiUrl = import.meta.env.VITE_API_URL;
  // Get our API URL from environment variables

  // Construct the API endpoint URL
  // Our custom API handles sorting internally (ORDER BY created_at DESC)
  const url = `${apiUrl}/api/threads`;

  // Make the request to our custom API
  // No special headers needed - our API is public for now
  const response = await fetch(url);

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
  // Get our API URL from environment variables
  const apiUrl = import.meta.env.VITE_API_URL;

  // Extract form data
  const formData = await request.formData();
  const intent = formData.get("intent");
  const threadId = formData.get("threadId");

  // Handle delete intent
  if (intent === "delete" && threadId) {
    try {
      // DELETE request to our custom API
      // Messages are automatically deleted due to CASCADE
      const response = await fetch(`${apiUrl}/api/threads/${threadId}`, {
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
