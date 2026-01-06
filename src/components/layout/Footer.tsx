import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Twitter, Linkedin, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

const handleShopClick = (e: React.MouseEvent) => {
  e.preventDefault();
  toast.info('Shop Cards - Coming soon!');
};

interface FooterLink {
  name: string;
  path: string;
  onClick?: (e: React.MouseEvent) => void;
}

interface FooterLinks {
  product: FooterLink[];
  company: FooterLink[];
  support: FooterLink[];
}

const footerLinks: FooterLinks = {
  product: [
    { name: "Features", path: "/features" },
    {
      name: "Order Card",
      path: "#",
      onClick: (e) => {
        e.preventDefault();
        toast.info("Coming Soon!!");
      }
    }
  ],
  company: [
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ],
  support: [
    { name: "FAQs", path: "/faqs" },
  ],
};

export const Footer = () => {
  return (
    <footer className="bg-background-secondary border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <motion.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <img src="/nxcverse.svg" alt="NXC Verse Logo" className="w-full h-full object-contain" />
              </motion.div>
              <span className="font-display text-xl font-bold text-foreground">
                NXC <span className="text-primary">Badge</span>
              </span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              The future of digital identity. Share your profile with a tap, track your connections, and build your personal brand.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.path}>
                  {link.path.startsWith('http') ? (
                    <a
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.path}
                      onClick={link.onClick}
                      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  {link.path.startsWith('http') ? (
                    <a
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.path}
                      onClick={link.onClick}
                      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.path}>
                  {link.path.startsWith('http') ? (
                    <a
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.path}
                      onClick={link.onClick}
                      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} NXC Badge Verse. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
