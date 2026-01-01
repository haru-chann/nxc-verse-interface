import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { NeonButton } from "@/components/ui/NeonButton";
import { Mail, Lock, Eye, EyeOff, User as UserIcon, ArrowRight, Check, Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo, User } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PasswordSetupModal from "@/components/auth/PasswordSetupModal";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { getFriendlyErrorMessage } from "@/lib/errorUtils";

const benefits = [
  "Free digital profile forever",
  "Custom QR code generator",
  "Basic analytics dashboard",
  "No credit card required",
  "NFC Card Integration" // Updated benefit
];

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState({ isOpen: false, message: "" });

  // Password Setup Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.firstName.trim()) {
      setErrorAlert({ isOpen: true, message: "Please enter your first name" });
      setLoading(false);
      return;
    }
    if (!termsAccepted) {
      setErrorAlert({ isOpen: true, message: "Please accept the Terms of Service" });
      setLoading(false);
      return;
    }

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // 2. Update Profile Display Name
      const displayName = `${formData.firstName} ${formData.lastName}`.trim();
      await updateProfile(user, {
        displayName: displayName,
      });

      // 3. Create User Document in Firestore
      const userPayload = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        name: displayName, // Legacy support
        firstName: formData.firstName,
        lastName: formData.lastName || "",
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        bio: "Digital Networking Enthusiast",
        location: "",
        role: "user",
      };

      console.log("Saving user to Firestore:", userPayload);

      await setDoc(doc(db, "users", user.uid), userPayload, { merge: true });

      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Signup Error Details:", error);
      setErrorAlert({ isOpen: true, message: getFriendlyErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);

      console.log("Google Sign In Result:", user, additionalInfo);

      // Extract Name
      const displayNameParts = user.displayName?.split(" ") || [];
      const firstName = displayNameParts[0] || "";
      const lastName = displayNameParts.length > 1 ? displayNameParts.slice(1).join(" ") : "";

      if (additionalInfo?.isNewUser) {
        // Prepare user doc but don't redirect yet
        // Store user in state to setup password
        setPendingUser(user);

        // Create initial Firestore doc now to ensure it exists
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          firstName: firstName,
          lastName: lastName,
          photoURL: null, // Don't use Google photo, waiting for user set
          createdAt: serverTimestamp(),
          bio: "Digital Networking Enthusiast",
          role: "user"
        }, { merge: true });

        setShowPasswordModal(true);
      } else {
        // Existing user: Sync photo if missing and update last login
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          // const userData = userDocSnap.data();
          // We intentionally DO NOT sync photoURL even if missing, as per user request
        }

        await setDoc(userDocRef, {
          lastLogin: serverTimestamp(),
        }, { merge: true });

        toast.success("Welcome back!");
        navigate("/dashboard");
      }

    } catch (error: any) {
      console.error(error);
      setErrorAlert({ isOpen: true, message: getFriendlyErrorMessage(error) });
    }
  };

  const handlePasswordSetupComplete = () => {
    setShowPasswordModal(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-20" >
      {/* Password Setup Modal */}
      <PasswordSetupModal
        isOpen={showPasswordModal}
        user={pendingUser}
        onComplete={handlePasswordSetupComplete}
      />

      {/* Background Effects */}
      < div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="absolute inset-0 bg-grid opacity-20" />

      {/* Floating Orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      < motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px]"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      < div className="relative z-10 w-full max-w-5xl mx-auto px-4" >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Benefits */}
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="font-display text-4xl font-bold mb-4">
              Start Building Your{" "}
              <GradientText animate>Digital Identity</GradientText>
            </h1>
            <p className="text-muted-foreground mb-8">
              Join thousands of professionals who've already upgraded their networking game with NXC Badge.
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.li
                  key={benefit}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </motion.li>
              ))}
            </ul>

            {/* Testimonial */}
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <GlassCard className="p-6">
                <p className="text-foreground mb-4 italic">
                  "NXC Badge has completely transformed how I network. I've made more meaningful connections in the last month than the entire previous year."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">SC</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Sarah Chen</p>
                    <p className="text-xs text-muted-foreground">Tech Entrepreneur</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>

          {/* Right - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Logo */}
            <div className="text-center lg:text-left mb-8">
              <Link to="/" className="inline-flex items-center gap-3 mb-4">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-primary-foreground font-bold text-xl">N</span>
                </motion.div>
              </Link>
              <h2 className="font-display text-3xl font-bold mb-2 lg:hidden">
                Create Your <GradientText>Account</GradientText>
              </h2>
              <h2 className="font-display text-3xl font-bold mb-2 hidden lg:block">
                Get Started <GradientText>Free</GradientText>
              </h2>
              <p className="text-muted-foreground">Create your NXC Badge account in seconds</p>
            </div>

            <GlassCard className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      First Name <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-12 pr-12 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Must be at least 8 characters
                  </p>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="w-4 h-4 rounded border-border bg-muted text-primary focus:ring-primary focus:ring-offset-0 mt-0.5"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit */}
                <NeonButton type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                  Create Account
                  {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                </NeonButton>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">Or sign up with</span>
                </div>
              </div>

              {/* Social Signup */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-muted border border-border hover:border-primary/50 transition-colors text-foreground"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-muted border border-border hover:border-primary/50 transition-colors text-foreground">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </button>
              </div>
            </GlassCard>

            {/* Login Link */}
            <p className="text-center mt-6 text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div >
      <ErrorAlert
        isOpen={errorAlert.isOpen}
        onClose={() => setErrorAlert({ ...errorAlert, isOpen: false })}
        message={errorAlert.message}
      />
    </div >
  );
};

export default Signup;
