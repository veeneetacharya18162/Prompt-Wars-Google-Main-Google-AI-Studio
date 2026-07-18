/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Perform a highly secure, robust fetch that cleanly parses JSON responses.
 * Detects HTML error templates (like Vercel/Cloud Run 404s, 502s, or Express fallbacks)
 * and outputs human-actionable developer errors rather than crashing on parsing.
 */
export async function safeJsonFetch(url: string, options?: RequestInit): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr: any) {
    console.error("Network connection failed for:", url, netErr);
    throw new Error(`Network failure: Could not connect to the server. Check your internet connection or server host status.`);
  }

  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    let errorDetail = `Server returned status code ${res.status}`;
    try {
      if (contentType.includes("application/json")) {
        const errData = await res.json();
        errorDetail = errData.error || errorDetail;
      } else {
        const htmlOrText = await res.text();
        if (htmlOrText) {
          if (htmlOrText.includes("The page could not be found") || res.status === 404) {
            errorDetail = `API Route not found (404) at "${url}". On Vercel, this typically means serverless API functions are building, missing environment configurations, or Vercel routing rewrites are not fully complete.`;
          } else if (htmlOrText.includes("Vercel") || htmlOrText.includes("Vercel-Error")) {
            errorDetail = `Vercel Deployment Error (${res.status}): Please check your server log dashboard on Vercel for details.`;
          } else {
            const strippedText = htmlOrText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            errorDetail = `Server response (${res.status}): ${strippedText.substring(0, 150)}${strippedText.length > 150 ? "..." : ""}`;
          }
        }
      }
    } catch (parseErr) {
      console.warn("Could not extract error body detail:", parseErr);
    }
    throw new Error(errorDetail);
  }

  // Handle successful response
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch (jsonErr: any) {
      throw new Error(`Data parsing failed: Received invalid JSON from server at "${url}". Details: ${jsonErr.message}`);
    }
  }

  // If we expect json but get none, fail safely
  const responseText = await res.text();
  throw new Error(`Expected JSON but received plain text/HTML from "${url}": ${responseText.substring(0, 100)}...`);
}
