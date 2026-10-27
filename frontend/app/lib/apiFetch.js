/**
 * Authenticated API Fetch Helper
 *
 * This module wraps the standard fetch() function to automatically include
 * authentication tokens in API requests and handle session expiration.
 *
 * Key concepts:
 * 1. WRAPPER FUNCTION: Extends fetch() with authentication logic
 * 2. JWT TOKEN: Retrieves token from Supabase session
 * 3. AUTHORIZATION HEADER: Adds "Bearer ${token}" to all requests
 * 4. SESSION MANAGEMENT: Auto-redirect on 401 Unauthorized
 * 5. PASSTHROUGH: Returns response for routes to handle their own errors
 *
 * Why wrap fetch()?
 * - DRY Principle: Don't repeat authentication logic in every API call
 * - Consistency: Ensures all API requests include auth tokens
 * - Session Handling: Auto-redirect when session expires
 * - Flexibility: Routes can handle their own error responses
 *
 * How it works:
 * 1. Get the current user's session from Supabase
 * 2. Extract the JWT access token from the session
 * 3. Add the token to the Authorization header
 * 4. Make the request with the standard fetch() function
 * 5. Check for 401 Unauthorized (session expired) ? redirect to login
 * 6. Return response (routes handle other errors as needed)
 *
 * Usage:
 *   const response = await apiFetch('/api/threads');
 *   const response = await apiFetch('/api/threads', { method: 'POST', body: ... });
 *
 *   // Routes still check response.ok and handle errors:
 *   if (!response.ok) { ... }
 */

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
    ...options.headers,
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

  // Special handling for 401 Unauthorized
  // This means the session has expired or the token is invalid
  // Redirect to login page, preserving the current URL so we can return here after login
  if (response.status === 401) {
    const currentPath = window.location.pathname + window.location.search;
    throw redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }

  // Return the response for the calling code to handle
  // Routes can check response.ok and handle errors appropriately
  // This allows custom error handling (e.g., validation errors return form errors)
  return response;
}
