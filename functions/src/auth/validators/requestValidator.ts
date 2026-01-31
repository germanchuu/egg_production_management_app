/**
 * Request Validator
 *
 * Validates request parameters and fields
 */

import {Result, ok, fail} from "../../common/types/result";

/**
 * Validates that required fields are present in an object
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): Result<T> {
  const missingFields = requiredFields.filter(
    (field) => !data[field]
  );

  if (missingFields.length > 0) {
    const fieldNames = missingFields.join(", ");
    return fail(`Campos requeridos faltantes: ${fieldNames}`, 400);
  }

  return ok(data);
}

/**
 * Validates admin request fields (common pattern)
 */
export function validateAdminRequest<T extends {
  adminUserId: string;
  adminDeviceId: string;
}>(data: T): Result<T> {
  return validateRequiredFields(data, ["adminUserId", "adminDeviceId"]);
}
