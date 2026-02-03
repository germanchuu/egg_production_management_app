/**
 * Update User Cloud Function
 *
 * Admin-only function to update user information.
 * Can update display name and role. Cannot update auth status directly.
 */

import * as functions from "firebase-functions/v2/https";
import {
  handleCorsAndMethod,
  parseBody,
  sendError,
  sendSuccess,
} from "../../common/helpers/httpHelpers";
import {validateRequiredFields} from "../validators/requestValidator";
import {validateAdmin} from "../validators/adminValidator";
import {fail} from "../../common/types/result";
import * as userService from "../services/userService";

interface UpdateUserRequest {
  userId: string;
  displayName?: string;
  role?: "admin" | "user";
  adminUserId: string;
  adminDeviceId: string;
}

export const updateUser = functions.onRequest(async (req, res) => {
  // Handle CORS and validate method
  if (!handleCorsAndMethod(req, res, "POST")) return;

  // Parse request body
  const bodyResult = parseBody<UpdateUserRequest>(req.body);
  if (!bodyResult.success) {
    return sendError(res, bodyResult);
  }

  const {userId, displayName, role, adminUserId, adminDeviceId} =
    bodyResult.data;

  // Validate required fields
  const validationResult = validateRequiredFields(bodyResult.data, [
    "userId",
    "adminUserId",
    "adminDeviceId",
  ]);
  if (!validationResult.success) {
    return sendError(res, validationResult);
  }

  // At least one field to update must be provided
  if (!displayName && !role) {
    return sendError(
      res,
      fail("Debe proporcionar al menos displayName o role para actualizar", 400)
    );
  }

  // Validate role if provided
  if (role && role !== "admin" && role !== "user") {
    return sendError(res, fail("role debe ser 'admin' o 'user'", 400));
  }

  // Validate admin credentials
  const adminResult = await validateAdmin(adminUserId, adminDeviceId);
  if (!adminResult.success) {
    return sendError(res, adminResult);
  }

  // Build updates object
  const updates: {displayName?: string; role?: "admin" | "user"} = {};
  if (displayName) updates.displayName = displayName;
  if (role) updates.role = role;

  // Execute business logic
  const result = await userService.updateUser(userId, updates, adminUserId);

  if (!result.success) {
    return sendError(res, result);
  }

  // Send success response
  return sendSuccess(res, result.data);
});
