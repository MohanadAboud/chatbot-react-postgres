import { Outlet, useLoaderData, redirect } from "react-router";
import Sidebar from "../components/Sidebar.jsx";
import { apiFetch } from "../lib/apiFetch.js";
import { supabase } from "../lib/supabase.js";

export async function clientLoader() {
  // Make the request to our custom API with authentication
  // apiFetch automatically includes the JWT token in the Authorization header
  // and constructs the full URL from the API base URL + path
  const response = await apiFetch("/api/threads");

  // Check if the request was successful
  if (!response.ok) {
    throw new Error(`Failed to fetch threads: ${response.status}`);
  }

  // Parse the JSON response
  const threads = await response.json();

  return { threads };
}

export async function clientAction({ request }) {
  // Extract form data
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Handle delete thread intent
  if (intent === "delete") {
    const threadId = formData.get("threadId");

    try {
      // DELETE request to our custom API with authentication
      // apiFetch automatically includes the JWT token
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

  // Handle logout intent
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
