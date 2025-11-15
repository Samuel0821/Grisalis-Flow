
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Sets a custom user claim to define a user's role.
 * Expects `userId` and `role` in the data payload.
 * The calling user must be an administrator.
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // 1. Check for authentication and admin privileges on the calling user.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Check if the caller is an admin by looking at their custom claims.
  const callerClaims = context.auth.token;
  if (callerClaims.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Must be an administrator to set user roles."
    );
  }

  const { userId, role } = data;

  // 2. Validate input.
  if (typeof userId !== "string" || typeof role !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a 'userId' and 'role' string."
    );
  }

  if (role !== "admin" && role !== "member") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The 'role' must be either 'admin' or 'member'."
    );
  }

  // 3. Set the custom claim.
  try {
    await admin.auth().setCustomUserClaims(userId, { role });
    return {
      message: `Success! User ${userId} has been made a(n) ${role}.`,
    };
  } catch (error) {
    console.error("Error setting custom claims:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An internal error occurred while setting the user role."
    );
  }
});


/**
 * Deletes a user from Firebase Authentication and their corresponding
 * profile document from Firestore.
 * The calling user must be an administrator.
 */
exports.deleteUser = functions.https.onCall(async (data, context) => {
  // 1. Check for authentication and admin privileges.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  
  const callerClaims = context.auth.token;
  if (callerClaims.role !== "admin") {
    console.log("Permission denied. Caller claims:", callerClaims);
    throw new functions.https.HttpsError(
      "permission-denied",
      "Must be an administrative user to delete users."
    );
  }

  const { userId } = data;

  // 2. Validate input.
  if (typeof userId !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a 'userId' string."
    );
  }
  
  if (userId === context.auth.uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Administrators cannot delete their own accounts."
    );
  }

  // 3. Perform the deletion.
  try {
    // Delete from Firebase Authentication
    await admin.auth().deleteUser(userId);

    // Delete from Firestore
    const userProfileRef = admin.firestore().collection("userProfiles").doc(userId);
    await userProfileRef.delete();

    return {
      message: `Successfully deleted user ${userId}.`,
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An internal error occurred while deleting the user."
    );
  }
});
