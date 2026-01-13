import { Outlet, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export const PublicLayout = () => {
  const [searchParams] = useSearchParams();
  const isMinimal = searchParams.get("minimal") === "true";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!isMinimal && <Navbar />}
      <motion.main
        className="flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Outlet />
      </motion.main>
      {!isMinimal && <Footer />}
    </div>
  );
};
