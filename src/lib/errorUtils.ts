export const getFriendlyErrorMessage = (error: any): string => {
    if (!error) return "An unknown error occurred.";

    const code = error.code || "";
    const message = error.message || "";

    // Firebase Auth Errors
    switch (code) {
        case "auth/invalid-credential":
            return "Invalid email or password. Please check your credentials and try again.";
        case "auth/user-not-found":
            return "No account found with this email. Please sign up first.";
        case "auth/wrong-password":
            return "Incorrect password. Please try again or reset your password.";
        case "auth/email-already-in-use":
            return "An account with this email already exists. Please sign in instead.";
        case "auth/weak-password":
            return "Password should be at least 6 characters.";
        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";
        case "auth/too-many-requests":
            return "Too many failed login attempts. Please try again later or reset your password.";
        case "auth/requires-recent-login":
            return "For security reasons, please log out and log in again to perform this action.";
        case "auth/popup-closed-by-user":
            return "Sign-in popup was closed before completion.";
        case "auth/account-exists-with-different-credential":
            return "An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.";
        default:
            // Fallback for non-auth errors or unmapped codes
            if (message.includes("firebase")) {
                return "A service error occurred. Please try again later.";
            }
            return message;
    }
};
