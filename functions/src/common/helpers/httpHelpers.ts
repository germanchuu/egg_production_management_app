/**
 * HTTP Helpers for Firebase Functions
 *
 * Utilities for handling CORS, body parsing, and responses
 */

import type {Request} from "firebase-functions/v2/https";
import {Result, ok, fail, Failure} from "../types/result";

// Use any for Response to avoid typing issues
type Response = any;

/**
 * Handle CORS headers and OPTIONS requests
 * Returns false if the request should be terminated (OPTIONS request)
 */
export function handleCorsAndMethod(
  req: Request,
  res: Response,
  allowedMethod: string = "POST"
): boolean {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", allowedMethod);
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return false;
  }

  // Validate method
  if (req.method !== allowedMethod) {
    res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
    return false;
  }

  return true;
}

/**
 * Parse JSON body from request
 * Handles both string and already-parsed objects
 */
export function parseBody<T>(body: any): Result<T> {
  try {
    let parsedBody = body;

    if (typeof body === 'string') {
      parsedBody = JSON.parse(body);
    }

    return ok(parsedBody as T);
  } catch (error) {
    return fail("Invalid JSON body", 400);
  }
}

/**
 * Send error response
 */
export function sendError(res: Response, failure: Failure): void {
  const statusCode = failure.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: failure.error,
  });
}

/**
 * Send success response
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    ...data,
  });
}
