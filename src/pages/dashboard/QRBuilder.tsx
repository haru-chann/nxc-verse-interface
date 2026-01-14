import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Download, Palette, Settings, Save, Trash2, Loader2, RefreshCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { qrService, QRDesign } from "@/services/qrService";
import { toast } from "sonner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

declare global {
  interface Window {
    qrcode?: any;
  }
}

const colors = ["#00D4FF", "#00FF88", "#FF6B6B", "#FFD93D", "#6B5B95"]; // Removed white

const QRBuilder = () => {
  const { currentUser } = useAuth();
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [qrStyle, setQrStyle] = useState<"rounded" | "square" | "dots">("rounded");
  const [savedDesigns, setSavedDesigns] = useState<QRDesign[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [libLoaded, setLibLoaded] = useState(false);
  const [errorAlert, setErrorAlert] = useState({ isOpen: false, message: "" });

  // Ref for the Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Inject QR Code Generator Library
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js";
    script.async = true;
    script.onload = () => {
      setLibLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadDesigns();
    }
  }, [currentUser]);

  // Re-render QR when dependencies change
  useEffect(() => {
    if (libLoaded && currentUser && canvasRef.current) {
      renderQR();
    }
  }, [libLoaded, currentUser, selectedColor, qrStyle]);

  const loadDesigns = async () => {
    if (!currentUser) return;
    try {
      const designs = await qrService.getUserQRDesigns(currentUser.uid);
      setSavedDesigns(designs);
    } catch (error) {
      console.error(error);
    }
  };

  const renderQR = () => {
    if (!window.qrcode || !canvasRef.current) return;

    const baseUrl = window.location.origin;
    const data = currentUser ? `${baseUrl}/u/${currentUser.uid}` : "https://nxcbadge.com";

    try {
      const typeNumber = 0; // Auto detect
      const errorCorrectionLevel = 'H';
      const qr = window.qrcode(typeNumber, errorCorrectionLevel);
      qr.addData(data);
      qr.make();

      const count = qr.getModuleCount();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size (high res)
      const size = 1000;
      const cellSize = size / count;
      const padding = 50;
      canvas.width = size + padding * 2;
      canvas.height = size + padding * 2;

      // Clear
      ctx.fillStyle = '#FFFFFF'; // White background required for scanning contrast
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.fill();

      ctx.fillStyle = selectedColor;

      for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
          if (qr.isDark(row, col)) {
            const x = col * cellSize + padding;
            const y = row * cellSize + padding;

            // Styles
            if (qrStyle === 'square') {
              ctx.fillRect(x, y, cellSize, cellSize);
            } else if (qrStyle === 'rounded') {
              if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(x, y, cellSize, cellSize, cellSize * 0.4);
                ctx.fill();
              } else {
                ctx.fillRect(x, y, cellSize, cellSize);
              }
            } else if (qrStyle === 'dots') {
              ctx.beginPath();
              ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2 * 0.9, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // Markers were previously overwritten here.
      // Now we let the main loop handle the style for consistency.

    } catch (e) {
      console.error("QR Generation Error", e);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    if (!name) {
      setErrorAlert({ isOpen: true, message: "Please give your design a name" });
      return;
    }
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const profileUrl = `${baseUrl}/u/${currentUser.uid}`;
      const options = { color: selectedColor, style: qrStyle };

      if (editingId) {
        // Update existing
        await qrService.updateQRDesign(editingId, {
          name,
          options,
          // data usually static, but we can update it if logic changes
        });
        toast.success("Design updated!");
      } else {
        // Create new
        await qrService.saveQRDesign(currentUser.uid, {
          name,
          data: profileUrl,
          options
        });
        toast.success("Design saved!");
      }

      setName("");
      setEditingId(null);
      loadDesigns();
    } catch (error) {
      console.error(error);
      setErrorAlert({ isOpen: true, message: "Failed to save design" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setSelectedColor(colors[0]); // Reset to default
    setQrStyle("rounded");
    toast.info("Edit cancelled");
  };

  const handleDelete = async (id: string) => {
    try {
      if (editingId === id) handleCancelEdit();
      await qrService.deleteQRDesign(id);
      toast.success("Design deleted");
      loadDesigns();
    } catch (error) {
      console.error(error);
      setErrorAlert({ isOpen: true, message: "Failed to delete design" });
    }
  };

  const loadDesign = (design: QRDesign) => {
    setSelectedColor(design.options.color);
    setQrStyle(design.options.style as any);
    setName(design.name); // Populate name field
    setEditingId(design.id);
    toast.success(`Editing: ${design.name}`);
  };

  const handleDownload = (format: 'png' | 'svg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (format === 'png') {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `nxc-qr-code.png`;
      a.click();
      toast.success("QR Code downloaded");
    } else {
      toast.info("SVG download not supported in this mode.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">QR Builder</h1>
        <p className="text-muted-foreground mt-1">Customize and download your QR code</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Customization */}
        <div className="space-y-6">
          <GlassCard className="p-4 lg:p-6">
            <h2 className="text-xl font-bold font-display text-foreground mb-6 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Color
            </h2>
            <div className="flex flex-wrap gap-3">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl transition-all ${selectedColor === color ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-4 lg:p-6">
            <h2 className="text-xl font-bold font-display text-foreground mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Style
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {(["rounded", "square", "dots"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setQrStyle(style)}
                  className={`p-3 lg:p-4 rounded-xl border-2 transition-all capitalize text-sm lg:text-base ${qrStyle === style
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-4 lg:p-6">
            <h2 className="text-xl font-bold font-display text-foreground mb-6">Download Options</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NeonButton variant="outline" className="w-full" onClick={() => handleDownload('png')}>
                <Download className="w-4 h-4 mr-2" />
                PNG
              </NeonButton>
              <NeonButton variant="outline" className="w-full" onClick={() => handleDownload('svg')} disabled>
                <Download className="w-4 h-4 mr-2" />
                SVG
              </NeonButton>
            </div>
          </GlassCard>

          {/* Saved Designs */}
          <GlassCard className="p-4 lg:p-6">
            <h2 className="text-xl font-bold font-display text-foreground mb-6">Saved Designs</h2>
            <div className="space-y-3">
              {savedDesigns.length === 0 && (
                <p className="text-sm text-muted-foreground">No saved designs yet.</p>
              )}
              {savedDesigns.map((design) => (
                <div
                  key={design.id}
                  onClick={() => loadDesign(design)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer group hover:bg-muted ${editingId === design.id ? "bg-primary/10 border border-primary/20" : "bg-muted/50"}`}
                >
                  <span className="font-medium text-foreground truncate max-w-[150px] sm:max-w-none">{design.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); loadDesign(design); }}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-100 lg:opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(design.id); }}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-100 lg:opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Preview */}
        <div className="w-full overflow-hidden">
          <GlassCard className="p-4 lg:p-8">
            <h2 className="text-xl font-bold font-display text-foreground mb-6 text-center">Preview</h2>
            <motion.div
              className="aspect-square rounded-2xl bg-white p-4 lg:p-8 flex items-center justify-center mx-auto w-full max-w-[280px] sm:max-w-sm"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-full h-full rounded-xl flex items-center justify-center overflow-hidden bg-transparent">
                {!libLoaded && <Loader2 className="animate-spin text-muted-foreground" />}
                <canvas ref={canvasRef} className="w-full h-full object-contain" />
              </div>
            </motion.div>
            <p className="text-center text-muted-foreground mt-4 text-xs sm:text-sm break-all px-2">
              {currentUser ? `${window.location.origin}/u/${currentUser.uid}` : "nxcbadge.com/u/username"}
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {editingId ? "Edit Design" : "Save New Design"}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Design Name"
                    className="w-full px-4 py-2 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-foreground"
                  />
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <NeonButton onClick={handleSave} disabled={loading} className="flex-1 sm:flex-none">
                      {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (editingId ? "Update" : "Save")}
                    </NeonButton>
                    {editingId && (
                      <NeonButton onClick={handleCancelEdit} variant="outline" className="px-3">
                        <RefreshCcw className="w-4 h-4" />
                      </NeonButton>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
      <ErrorAlert
        isOpen={errorAlert.isOpen}
        onClose={() => setErrorAlert({ ...errorAlert, isOpen: false })}
        message={errorAlert.message}
      />
    </div >
  );
};

export default QRBuilder;
