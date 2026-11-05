import { supabase } from "./supabase.js";
import { redirect } from "react-router";

/**
 * apiFetch - Fetch wrapper with automatic authentication and session handling
 *
 * @param {string} path - The API path (e.g., '/api/threads' or '/api/threads/123')
 * @param {RequestInit} options - Standard fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>} - The fetch Response object
 * @throws {Response} - Redirect response for 401 Unauthorized (session expired)
 */
export async function apiFetch(path, options = {}) {
  // Get our API URL from environment variables
  const apiUrl = import.meta.env.VITE_API_URL;

  // Construct the full URL by combining API base URL with the path
  const url = `${apiUrl}${path}`;

  // Get the current session from Supabase
  // This returns { data: { session }, error }
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Extract the JWT access token from the session
  // If user is not logged in, session will be null
  const token = session?.access_token;

  // Prepare headers, merging any provided headers with our auth header
  const headers = {
    ...options.headers, // Keep any existing headers
  };

  // Add Authorization header if we have a token
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Make the request with the standard fetch() function
  // Spread the original options and override headers
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const currentPath = window.location.pathname + window.location.search;
    throw redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }

  return response;
}
