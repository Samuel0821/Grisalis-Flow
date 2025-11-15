
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.deleteUser = functions.https.onCall(async (data, context) => {
    // Check if the user is authenticated and is an admin
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }
    
    const callerUid = context.auth.uid;
    const callerClaims = (await admin.auth().getUser(callerUid)).customClaims;

    if (callerClaims.role !== 'admin') {
         throw new functions.https.HttpsError(
            "permission-denied",
            "Must be an administrative user to initiate user deletion."
        );
    }

    const uid = data.uid;
    if (uid === callerUid) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "You cannot delete your own account."
        );
    }

    try {
        await admin.auth().deleteUser(uid);
        await admin.firestore().collection("userProfiles").doc(uid).delete();
        return { message: `Successfully deleted user ${uid}` };
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new functions.https.HttpsError(
            "internal",
            "Unable to delete user.",
            error
        );
    }
});

exports.setUserRole = functions.https.onCall(async (data, context) => {
    // Check if the request is made by an admin
    if (context.auth.token.role !== 'admin') {
        return {
            error: "Request not authorized. User must be an admin to set roles.",
        };
    }

    const { uid, role } = data;
    try {
        // Set custom user claims on the user account
        await admin.auth().setCustomUserClaims(uid, { role });
        return {
            message: `Success! ${uid} has been made a ${role}.`,
        };
    } catch (error) {
        console.error(error);
        return {
            error: "An error occurred while setting the user role.",
        };
    }
});
