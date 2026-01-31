/**
 * Validate Invitation Cloud Function (T042)
 *
 * Public function to validate an invitation token.
 * Checks token validity, expiry, and user status.
 *
 * NO USES Firebase Authentication - validates using invitation token.
 * Returns invitation and user data if valid.
 */

import * as functions from "firebase-functions/v2/https";
import {
  handleCorsAndMethod,
  parseBody,
  sendError,
} from "../../common/helpers/httpHelpers";
import {validateRequiredFields} from "../validators/requestValidator";
import * as userService from "../services/userService";

interface ValidateInvitationRequest {
  token: string;
}

export const validateInvitation = functions.onRequest(
  async (req, res): Promise<void> => {
    // Handle CORS and validate method
    if (!handleCorsAndMethod(req, res, "POST")) return;

    // Parse request body
    const bodyResult = parseBody<ValidateInvitationRequest>(req.body);
    if (!bodyResult.success) {
      return sendError(res, bodyResult);
    }

    const {token} = bodyResult.data;

    // Validate required fields
    const validationResult = validateRequiredFields(bodyResult.data, [
      "token",
    ]);
    if (!validationResult.success) {
      // Return 200 with valid: false for UX
      res.status(200).json({
        valid: false,
        error: validationResult.error,
      });
      return;
    }

    // Execute business logic
    const result = await userService.validateInvitation(token);

    if (!result.success) {
      // Return 200 with valid: false for UX (not an HTTP error)
      res.status(200).json({
        valid: false,
        error: result.error,
      });
      return;
    }

    // Send success response with valid: true
    res.status(200).json({
      valid: true,
      ...result.data,
    });
  }
);
