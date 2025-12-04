import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { QrCode, Download, Palette, Settings } from "lucide-react";

const colors = ["#00D4FF", "#00FF88", "#FF6B6B", "#FFD93D", "#6B5B95", "#FFFFFF"];

const QRBuilder = () => {
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [qrStyle, setQrStyle] = useState("rounded");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">QR Builder</h1>
        <p className="text-muted-foreground mt-1">Customize and download your QR code</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Customization */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold font-display text-foreground mb-6 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Color
            </h2>
            <div className="flex flex-wrap gap-3">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-12 h-12 rounded-xl transition-all ${
                    selectedColor === color ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-bold font-display text-foreground mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Style
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {["rounded", "square", "dots"].map((style) => (
                <button
                  key={style}
                  onClick={() => setQrStyle(style)}
                  className={`p-4 rounded-xl border-2 transition-all capitalize ${
                    qrStyle === style
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-bold font-display text-foreground mb-6">Download Options</h2>
            <div className="grid grid-cols-2 gap-3">
              <NeonButton variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                PNG
              </NeonButton>
              <NeonButton variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                SVG
              </NeonButton>
            </div>
          </GlassCard>
        </div>

        {/* Preview */}
        <div>
          <GlassCard className="p-8">
            <h2 className="text-xl font-bold font-display text-foreground mb-6 text-center">Preview</h2>
            <motion.div
              className="aspect-square rounded-2xl bg-white p-8 flex items-center justify-center mx-auto max-w-sm"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div
                className="w-full h-full rounded-xl flex items-center justify-center"
                style={{ backgroundColor: selectedColor + "20" }}
              >
                <QrCode className="w-3/4 h-3/4" style={{ color: selectedColor }} />
              </div>
            </motion.div>
            <p className="text-center text-muted-foreground mt-4 text-sm">
              nxcbadge.com/u/johndoe
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default QRBuilder;
