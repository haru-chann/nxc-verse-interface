import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import { toast } from "sonner";

const featuredPost = {
  id: 1,
  title: "The Future of Networking: Why Digital Business Cards Are Taking Over",
  excerpt: "In an increasingly digital world, the traditional paper business card is becoming obsolete. Here's why professionals are making the switch to NFC-enabled digital alternatives.",
  author: "Alex Rivera",
  date: "Dec 1, 2024",
  readTime: "8 min read",
  category: "Industry Trends",
  image: "FT",
};

const posts = [
  {
    id: 2,
    title: "10 Ways to Maximize Your NXC Badge Profile",
    excerpt: "Get the most out of your digital identity with these proven tips and tricks.",
    author: "Jordan Lee",
    date: "Nov 28, 2024",
    readTime: "5 min read",
    category: "Tips & Tricks",
    image: "TT",
  },
  {
    id: 3,
    title: "Case Study: How Sarah Increased Her Network by 300%",
    excerpt: "Real results from a real user. Learn how one entrepreneur transformed her networking.",
    author: "Sam Chen",
    date: "Nov 25, 2024",
    readTime: "6 min read",
    category: "Case Studies",
    image: "CS",
  },
  {
    id: 4,
    title: "NFC vs QR: Which Technology is Right for You?",
    excerpt: "A comprehensive comparison of two leading contactless technologies.",
    author: "Morgan Taylor",
    date: "Nov 22, 2024",
    readTime: "7 min read",
    category: "Technology",
    image: "TC",
  },
  {
    id: 5,
    title: "Designing the Perfect Digital Profile: A Complete Guide",
    excerpt: "Step-by-step guide to creating a profile that converts visitors into connections.",
    author: "Alex Rivera",
    date: "Nov 18, 2024",
    readTime: "10 min read",
    category: "Guides",
    image: "GD",
  },
  {
    id: 6,
    title: "The Psychology of First Impressions in Digital Networking",
    excerpt: "Understanding how people perceive digital profiles and how to optimize yours.",
    author: "Jordan Lee",
    date: "Nov 15, 2024",
    readTime: "6 min read",
    category: "Psychology",
    image: "PS",
  },
  {
    id: 7,
    title: "Enterprise Solutions: NXC Badge for Teams",
    excerpt: "How businesses are using NXC Badge to unify their team's digital presence.",
    author: "Sam Chen",
    date: "Nov 12, 2024",
    readTime: "5 min read",
    category: "Business",
    image: "BS",
  },
];

const categories = ["All", "Industry Trends", "Tips & Tricks", "Case Studies", "Technology", "Guides"];

const Blog = () => {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-mesh" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-primary font-medium mb-4">BLOG</p>
            <h1 className="font-display text-5xl sm:text-6xl font-bold mb-6">
              Insights & <GradientText animate>Updates</GradientText>
            </h1>
            <p className="text-xl text-muted-foreground">
              Stay up to date with the latest in digital identity, networking trends, and NXC Badge news.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <GlassCard variant="hover" className="p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-6xl font-bold font-display text-primary/30">
                    {featuredPost.image}
                  </span>
                </div>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                    {featuredPost.category}
                  </span>
                  <h2 className="text-3xl font-bold font-display text-foreground mb-4">
                    {featuredPost.title}
                  </h2>
                  <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {featuredPost.author}
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {featuredPost.date}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                  <button
                    onClick={() => toast.info("Full article coming soon!")}
                    className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
                  >
                    Read Article
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => toast.info("Full article coming soon!")}
                className="cursor-pointer"
              >
                <GlassCard variant="hover" className="p-6 h-full flex flex-col">
                  {/* ... content ... */}
                  <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold font-display text-primary/30">
                      {post.image}
                    </span>
                  </div>
                  <span className="inline-block px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium mb-3 w-fit">
                    {post.category}
                  </span>
                  <h3 className="text-lg font-bold font-display text-foreground mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{post.author}</span>
                    <span>{post.readTime}</span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-32 relative bg-background-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Subscribe to Our <GradientText>Newsletter</GradientText>
            </h2>
            <p className="text-muted-foreground mb-8">
              Get the latest articles, tips, and updates delivered to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
              />
              <button className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-colors">
                Subscribe
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
