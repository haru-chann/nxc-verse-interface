import { motion } from "framer-motion";
import { GlassCard } from "../ui/GlassCard";
import { GradientText } from "../ui/GradientText";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Tech Entrepreneur",
    content: "NXC Badge completely changed how I network. The analytics alone have helped me track and follow up with important connections.",
    rating: 5,
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Creative Director",
    content: "The metal cards are absolutely stunning. Every time I tap my card, people are amazed. It's the perfect conversation starter.",
    rating: 5,
    avatar: "MJ",
  },
  {
    name: "Emily Rodriguez",
    role: "Sales Executive",
    content: "I've increased my lead capture by 300% since switching to NXC Badge. The contact export feature saves me hours every week.",
    rating: 5,
    avatar: "ER",
  },
  {
    name: "David Kim",
    role: "Startup Founder",
    content: "The customization options are incredible. My profile perfectly represents my brand. Professional yet unique.",
    rating: 5,
    avatar: "DK",
  },
  {
    name: "Lisa Thompson",
    role: "Real Estate Agent",
    content: "My clients love the instant contact sharing. No more fumbling with business cards. This is the future.",
    rating: 5,
    avatar: "LT",
  },
  {
    name: "James Wilson",
    role: "Conference Speaker",
    content: "After every talk, I just show my QR code. Hundreds of new connections with zero effort. Game changer.",
    rating: 5,
    avatar: "JW",
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background-secondary to-background" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-primary font-medium mb-4">TESTIMONIALS</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Loved by{" "}
            <GradientText>Professionals</GradientText>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of professionals who've transformed their networking
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard variant="hover" className="p-6 h-full">
                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-primary fill-primary" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
