/**
 * Accept Invitation Cloud Function (T043)
 *
 * Marks invitation as accepted and authenticates the user.
 * Adds device to user's authorized devices list.
 *
 * NO USES Firebase Authentication - validates using invitation token.
 * Prevents acceptance if user is revoked.
 */

import * as functions from "firebase-functions/v2/https";
import {
  handleCorsAndMethod,
  parseBody,
  sendError,
  sendSuccess,
} from "../../common/helpers/httpHelpers";
import {validateRequiredFields} from "../validators/requestValidator";
import * as userService from "../services/userService";

interface AcceptInvitationRequest {
  token: string;
  deviceId: string;
  deviceName: string;
}

export const acceptInvitation = functions.onRequest(
  async (req, res) => {
    // Handle CORS and validate method
    if (!handleCorsAndMethod(req, res, "POST")) return;

    // Parse request body
    const bodyResult = parseBody<AcceptInvitationRequest>(req.body);
    if (!bodyResult.success) {
      return sendError(res, bodyResult);
    }

    const {token, deviceId, deviceName} = bodyResult.data;

    // Validate required fields
    const validationResult = validateRequiredFields(bodyResult.data, [
      "token",
      "deviceId",
      "deviceName",
    ]);
    if (!validationResult.success) {
      return sendError(res, validationResult);
    }

    // Execute business logic
    const result = await userService.acceptInvitation(
      token,
      deviceId,
      deviceName
    );

    if (!result.success) {
      return sendError(res, result);
    }

    // Send success response
    return sendSuccess(res, result.data);
  }
);
