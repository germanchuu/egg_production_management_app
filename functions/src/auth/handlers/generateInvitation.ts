/**
 * Generate Invitation Cloud Function (T041)
 *
 * Admin-only function to generate a new invitation for a user.
 * Creates an invitation token (deep link generated in frontend).
 *
 * NO USES Firebase Authentication - validates using Firestore only.
 * Prevents invitations for revoked users.
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

interface GenerateInvitationRequest {
  targetUserId: string;
  adminUserId: string;
  adminDeviceId: string;
}

export const generateInvitation = functions.onRequest(
  async (req, res) => {
    // Handle CORS and validate method
    if (!handleCorsAndMethod(req, res, "POST")) return;

    // Parse request body
    const bodyResult = parseBody<GenerateInvitationRequest>(req.body);
    if (!bodyResult.success) {
      return sendError(res, bodyResult);
    }

    const {targetUserId, adminUserId, adminDeviceId} = bodyResult.data;

    // Validate required fields
    const validationResult = validateRequiredFields(bodyResult.data, [
      "targetUserId",
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
    const result = await invitationService.generateInvitation(
      targetUserId,
      adminUserId
    );

    if (!result.success) {
      return sendError(res, result);
    }

    // Send success response
    return sendSuccess(res, result.data);
  }
);
