import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { NeonButton } from "@/components/ui/NeonButton";
import { Mail, MapPin, Phone, Clock, MessageSquare, Headphones, Building } from "lucide-react";

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "Send us an email anytime",
    value: "nxcbadge@gmail.com",
    action: "mailto:nxcbadge@gmail.com",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Chat with our team",
    value: "Available 24/7",
    action: "#chat",
  },
  {
    icon: Phone,
    title: "Phone",
    description: "Call our support line",
    value: "+919403276942",
    action: "tel:+919403276942",
  },
];

const offices = [
  {
    city: "San Francisco",
    address: "100 Market Street, Suite 300",
    country: "United States",
    timezone: "PST (UTC-8)",
  },
  {
    city: "London",
    address: "30 Finsbury Square",
    country: "United Kingdom",
    timezone: "GMT (UTC+0)",
  },
  {
    city: "Singapore",
    address: "1 Raffles Place, Tower 2",
    country: "Singapore",
    timezone: "SGT (UTC+8)",
  },
];

const Contact = () => {
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
            <p className="text-primary font-medium mb-4">CONTACT</p>
            <h1 className="font-display text-5xl sm:text-6xl font-bold mb-6">
              Get in <GradientText animate>Touch</GradientText>
            </h1>
            <p className="text-xl text-muted-foreground">
              Have a question or need help? We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {contactMethods.map((method, index) => (
              <motion.a
                key={method.title}
                href={method.action}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard variant="hover" className="p-6 h-full text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <method.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{method.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                  <p className="text-primary font-medium">{method.value}</p>
                </GlassCard>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 relative bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold font-display text-foreground mb-2">
                Send us a Message
              </h2>
              <p className="text-muted-foreground mb-8">
                Fill out the form below and we'll get back to you within 24 hours.
              </p>

              <GlassCard className="p-6">
                <form className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Subject
                    </label>
                    <select className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                      <option value="">Select a topic</option>
                      <option value="sales">Sales Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing Question</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>
                  <NeonButton type="submit" className="w-full">
                    Send Message
                  </NeonButton>
                </form>
              </GlassCard>
            </motion.div>

            {/* Offices */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold font-display text-foreground mb-2">
                Our Offices
              </h2>
              <p className="text-muted-foreground mb-8">
                Visit us at one of our global locations.
              </p>

              <div className="space-y-6">
                {offices.map((office) => (
                  <GlassCard key={office.city} variant="hover" className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{office.city}</h3>
                        <p className="text-muted-foreground text-sm mb-2">
                          {office.address}
                          <br />
                          {office.country}
                        </p>
                        <p className="text-sm text-primary flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {office.timezone}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>

              {/* Support Hours */}
              <GlassCard className="p-6 mt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">24/7 Support</h3>
                    <p className="text-muted-foreground text-sm">
                      Our support team is available around the clock to help you with any questions.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
