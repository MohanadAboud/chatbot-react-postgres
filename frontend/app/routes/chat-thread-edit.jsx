import {
  useActionData,
  Form,
  redirect,
  Link,
  useRouteLoaderData,
} from "react-router";

export default function ChatThreadEdit() {
  // Access the thread data from the parent route's loader
  // useRouteLoaderData avoids needing a separate clientLoader here
  const { thread } = useRouteLoaderData("routes/chat-thread");

  // Access any errors from the action
  const actionData = useActionData();

  return (
    <div className="edit-title-overlay">
      <Form method="post" className="edit-title-form">
        <div className="form-field">
          <label htmlFor="title">Edit thread title</label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue={thread.title}
            autoFocus
            required
            className="title-input"
          />
        </div>

        <div className="form-buttons">
          <button type="submit" className="save-button">
            Save
          </button>
          <Link to=".." className="cancel-button">
            Cancel
          </Link>
        </div>
      </Form>
      {actionData?.error && (
        <div className="error-message">{actionData.error}</div>
      )}
    </div>
  );
}

export async function clientAction({ params, request }) {
  const apiUrl = import.meta.env.VITE_API_URL;

  // Extract form data
  const formData = await request.formData();
  const title = formData.get("title");

  // Validate title
  if (!title || !title.trim()) {
    return { error: "Title cannot be empty" };
  }

  try {
    // PATCH to our custom API to update the thread title
    const response = await fetch(`${apiUrl}/api/threads/${params.threadId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: title.trim() }),
    });

    // Check for validation errors (400)
    if (response.status === 400) {
      const error = await response.json();
      return { error: error.error || "Invalid title" };
    }

    // Check for not found (404)
    if (response.status === 404) {
      return { error: "Thread not found" };
    }

    // Check for other errors
    if (!response.ok) {
      return { error: `Failed to update title: ${response.status}` };
    }

    // Success! Redirect back to the thread view
    // ".." navigates to the parent route
    return redirect("..");
  } catch (error) {
    return { error: error.message };
  }
}
