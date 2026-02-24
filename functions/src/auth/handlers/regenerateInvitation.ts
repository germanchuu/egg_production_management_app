/**
 * Regenerate Invitation Cloud Function (T044)
 *
 * Admin-only function to regenerate an invitation for a user.
 * Creates a new invitation token (invalidates previous one).
 *
 * NO USES Firebase Authentication - validates using Firestore only.
 * Only allows regeneration for pending users (not yet authenticated).
 * Prevents regeneration for revoked users.
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
import * as invitationService from "../services/invitationService";

interface RegenerateInvitationRequest {
  userId: string;
  adminUserId: string;
  adminDeviceId: string;
}

export const regenerateInvitation = functions.onRequest(
  async (req, res) => {
    // Handle CORS and validate method
    if (!handleCorsAndMethod(req, res, "POST")) return;

    // Parse request body
    const bodyResult = parseBody<RegenerateInvitationRequest>(req.body);
    if (!bodyResult.success) {
      return sendError(res, bodyResult);
    }

    const {userId, adminUserId, adminDeviceId} = bodyResult.data;

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
    const result = await invitationService.regenerateInvitation(
      userId,
      adminUserId
    );

    if (!result.success) {
      return sendError(res, result);
    }

    // Send success response
    return sendSuccess(res, result.data);
  }
);
