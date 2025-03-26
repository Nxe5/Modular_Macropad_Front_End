/**
 * Fetch data from an API endpoint with fallback to static file
 * 
 * @param apiUrl - The API endpoint URL to fetch from
 * @param fallbackUrl - The static file URL to fall back to if the API request fails
 * @returns Promise<Response> - The fetch response
 */
export async function fetchWithFallback(apiUrl: string, fallbackUrl: string): Promise<Response> {
  try {
    // First try the API endpoint
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return response;
  } catch (error) {
    console.warn(`API request failed, falling back to static file: ${error}`);
    
    // Fall back to the static file
    const fallbackResponse = await fetch(fallbackUrl);
    if (!fallbackResponse.ok) {
      throw new Error(`Fallback request failed: ${fallbackResponse.status}`);
    }
    return fallbackResponse;
  }
} 