import React, { useState, useRef, useMemo } from 'react';
import { Camera, Download, Type, Calendar as CalendarIcon, Image as ImageIcon, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { GoogleGenAI } from "@google/genai";

// Helper to safely encode UTF-8 strings to base64 for SVGs
const safeBtoa = (str: string) => btoa(unescape(encodeURIComponent(str)));

export default function App() {
  const [headline, setHeadline] = useState('আমাদের সমাজের যুবতীদের অধঃপতন');
  const [date, setDate] = useState('৩১ মার্চ ২০২৬');
  const [imageUrl, setImageUrl] = useState('https://picsum.photos/seed/news/1080/600');
  
  const initialLogoSvg = `
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="white" />
      <circle cx="50" cy="50" r="20" fill="#f0f0f0" />
    </svg>
  `;

  const [logoUrl, setLogoUrl] = useState('data:image/svg+xml;base64,' + safeBtoa(initialLogoSvg));
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('Two young Muslim women wearing black hijab sitting close together, both holding cigarettes and smoking, serious mood, realistic scene, outdoor green blurred background, one wearing glasses, natural lighting, candid moment, social issue concept, high detail, photorealistic');
  const [error, setError] = useState<string | null>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);

  // Lazy initialize AI client
  const aiClient = useMemo(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }, []);

  const generateAiImage = async () => {
    if (!aiClient) {
      setError('Gemini API Key পাওয়া যায়নি। দয়া করে সেটিংস থেকে সেট করুন।');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: aiPrompt }] }],
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          },
        },
      });

      const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
      if (imagePart?.inlineData) {
        setImageUrl(`data:image/png;base64,${imagePart.inlineData.data}`);
      } else {
        throw new Error('No image was generated. Please try a different prompt.');
      }
    } catch (err) {
      console.error('AI Generation failed:', err);
      setError('AI ছবি তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadImage = async () => {
    if (cardRef.current === null) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        width: 1080,
        height: 1080,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });
      const link = document.createElement('a');
      link.download = `news-card-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
        
        {/* Controls Section */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-200 space-y-8"
          >
            <div className="flex items-center justify-between border-b pb-6">
              <h2 className="text-3xl font-black text-neutral-900 tracking-tight">নিউজ কার্ড মেকার</h2>
              <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                1080 x 1080 PX
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2 flex items-center gap-2">
                  <Type size={18} className="text-blue-500" /> হেডলাইন (Headline)
                </label>
                <textarea 
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full p-4 border-2 border-neutral-100 bg-neutral-50 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all min-h-[100px] text-lg font-medium"
                  placeholder="এখানে হেডলাইন লিখুন..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2 flex items-center gap-2">
                  <CalendarIcon size={18} className="text-blue-500" /> তারিখ (Date)
                </label>
                <input 
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-4 border-2 border-neutral-100 bg-neutral-50 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-lg font-medium"
                  placeholder="৩১ মার্চ ২০২৬"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-neutral-700 flex items-center gap-2">
                    <ImageIcon size={18} className="text-blue-500" /> ম্যানুয়াল ছবি (Manual Upload)
                  </label>
                  <div className="relative group">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="main-image-upload"
                    />
                    <label 
                      htmlFor="main-image-upload"
                      className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-neutral-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                      <Camera className="text-neutral-400 group-hover:text-blue-500 mb-2" size={32} />
                      <span className="text-xs font-bold text-neutral-400 group-hover:text-blue-500">ছবি আপলোড করুন</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-neutral-700 flex items-center gap-2">
                    <ImageIcon size={18} className="text-blue-500" /> লোগো (Logo)
                  </label>
                  <div className="relative group">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label 
                      htmlFor="logo-upload"
                      className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-neutral-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                      <Camera className="text-neutral-400 group-hover:text-blue-500 mb-2" size={32} />
                      <span className="text-xs font-bold text-neutral-400 group-hover:text-blue-500">লোগো আপলোড করুন</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={downloadImage}
                disabled={isDownloading}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? <RefreshCw className="animate-spin" /> : <Download size={24} />}
                {isDownloading ? 'তৈরি হচ্ছে...' : 'ছবি হিসেবে ডাউনলোড করুন'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Preview Section */}
        <div className="flex flex-col items-center sticky top-8">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6">লাইভ প্রিভিউ (1080x1080)</h3>
          
          <div className="w-full max-w-[540px] aspect-square relative shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] rounded-lg overflow-hidden">
            {/* ... card content ... */}
            <div 
              ref={cardRef}
              className="absolute top-0 left-0 w-[1080px] h-[1080px] bg-[#cc0000] flex flex-col origin-top-left"
              style={{ transform: 'scale(0.5)' }}
            >
              {/* Top Section (Image) - Adjusted to 540px (1/2 of 1080px) */}
              <div className="relative h-[540px] w-full overflow-hidden border-b-4 border-white">
                <img 
                  src={imageUrl} 
                  alt="News" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {/* Date Badge */}
                <div className="absolute bottom-0 right-0 bg-[#0088ff] text-white px-8 py-3 text-2xl font-black rounded-tl-2xl z-10 shadow-lg">
                  {date}
                </div>
              </div>

              {/* Logo Overlay - Centered on the divider at 540px */}
              <div className="absolute top-[540px] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-40 h-40 rounded-full border-[6px] border-white bg-white overflow-hidden shadow-2xl flex items-center justify-center p-2">
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="w-full h-full object-contain rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Bottom Section (Content) - Remaining 540px */}
              <div className="flex-1 flex flex-col items-center justify-center px-12 pt-20 pb-12 text-center">
                <h1 className="text-white text-[72px] font-black leading-[1.1] mb-16 tracking-tight drop-shadow-2xl max-w-[900px]">
                  {headline}
                </h1>

                {/* Detailed Button */}
                <div className="mt-auto">
                  <div className="relative inline-flex items-center group">
                    <div className="bg-[#cc0000] border-[4px] border-white rounded-l-full px-12 py-3 flex items-center gap-4 relative z-10">
                      <span className="text-[#ffff00] font-black text-3xl tracking-wide">
                        বিস্তারিত কমেন্টে
                      </span>
                    </div>
                    
                    <div className="relative h-[74px] w-[60px] -ml-[4px] z-20">
                      <div className="absolute inset-0 bg-[#cc0000] border-t-[4px] border-r-[4px] border-white transform skew-x-[30deg] origin-bottom-left"></div>
                      <div className="absolute inset-0 bg-[#cc0000] border-b-[4px] border-r-[4px] border-white transform -skew-x-[30deg] origin-top-left"></div>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-4xl font-bold z-30">
                        ▶
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            </div>
          </div>

          <div className="w-full max-w-[540px] mt-8">
            <button 
              onClick={downloadImage}
              disabled={isDownloading}
              className="w-full bg-[#cc0000] text-white py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-4 hover:bg-[#a30000] active:scale-[0.98] transition-all shadow-2xl shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white/20"
            >
              {isDownloading ? <RefreshCw className="animate-spin" size={28} /> : <Download size={28} />}
              {isDownloading ? 'ডাউনলোড হচ্ছে...' : 'নিউজ কার্ড ডাউনলোড করুন'}
            </button>
          </div>
          
          <p className="mt-8 text-sm text-neutral-400 font-medium italic">
            * AI দিয়ে ছবি তৈরি করতে উপরের প্রম্পট ব্যবহার করুন।
          </p>
        </div>
      </div>
    </div>
  );
}
