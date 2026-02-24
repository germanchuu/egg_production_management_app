/**
 * Revoke User Cloud Function (T044a)
 *
 * Admin-only function to permanently revoke user access.
 * Sets authStatus='revoked', clears authorizedDevices, creates audit log.
 *
 * NO USES Firebase Authentication - validates using Firestore only.
 * Prevents revocation of self and other admins.
 * Revocation is PERMANENT and cannot be reversed.
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
import * as userService from "../services/userService";

interface RevokeUserRequest {
  userId: string;
  adminUserId: string;
  adminDeviceId: string;
  reason?: string;
}

export const revokeUser = functions.onRequest(
  async (req, res) => {
    // Handle CORS and validate method
    if (!handleCorsAndMethod(req, res, "POST")) return;

    // Parse request body
    const bodyResult = parseBody<RevokeUserRequest>(req.body);
    if (!bodyResult.success) {
      return sendError(res, bodyResult);
    }

    const {userId, adminUserId, adminDeviceId, reason} = bodyResult.data;

    // Validate required fields
    const validationResult = validateRequiredFields(bodyResult.data, [
      "userId",
      "adminUserId",
      "adminDeviceId",
    ]);
    if (!validationResult.success) {
      return sendError(res, validationResult);
    }

    // Validate admin credentials
    const adminResult = await validateAdmin(adminUserId, adminDeviceId);
    if (!adminResult.success) {
      return sendError(res, adminResult);
    }

    // Execute business logic
    const result = await userService.revokeUser(
      userId,
      adminUserId,
      reason
    );

    if (!result.success) {
      return sendError(res, result);
    }

    // Send success response
    return sendSuccess(res, result.data);
  }
);
