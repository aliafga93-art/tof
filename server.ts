import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase body size limits for large base64 image uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Helper to obtain Gemini client safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("مفتاح API الخاص بـ Gemini غير متوفر. يرجى إضافته في إعدادات المنصة (Secrets).");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: OCR and Parse Image Table using Gemini
  app.post("/api/parse-image", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64 || !mimeType) {
        return res.status(400).json({ error: "الرجاء توفير ملف الصورة مع صيغة MIME صحيحة." });
      }

      // Strip potential base64 prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const ai = getGeminiClient();

      const imagePart = {
        inlineData: {
          mimeType,
          data: cleanBase64
        }
      };

      const systemInstruction = 
        "أنت مساعد ذكاء اصطناعي متخصص في استخراج وتدقيق جداول موقف المتأخرين عن الدوام الرسمي من الصور الممسوحة ضوئياً أو الملتقطة بالهاتف.\n" +
        "قم بتحليل الصورة المرفقة واستخراج الجدول بدقة تامة.\n" +
        "الأعمدة المطلوبة:\n" +
        "- ت (Index): الرقم التسلسلي للسطر (عدد صحيح).\n" +
        "- الاسم (Name): الاسم الكامل للموظف كما هو مكتوب.\n" +
        "- القسم (Department): القسم أو الشعبة (مثال: الادارة، المخازن، ميكانيك، الخ). إذا كان فارغاً أو يحتوي على خطوط أو إشارات فاجعله فارغاً.\n" +
        "- التاريخ (Date): تاريخ التأخير بصيغة DD/MM/YYYY. يرجى المحافظة التامة على صياغة التاريخ المقروء.\n" +
        "- وقت التأخير عن الدوام الرسمي (Time): وقت البصمة. إذا احتوت الخلية على تكرار للوقت (مثل '08:04 08:04' أو '08:03 08:03')، خذ أول قيمة فقط واجعلها بصيغة HH:MM (مثل '08:04' أو '08:03').\n\n" +
        "تأكد من قراءة كافة الصفوف وتجاهل صفوف التواقيع والترويسة العليا للجدول.";

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            imagePart,
            { text: "قم باستخراج جدول 'موقف المتأخرين' من الصورة طبقاً لتعليمات النظام وبنية الـ responseSchema المحددة بالكامل وبدون اختصارات." }
          ],
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  index: {
                    type: Type.INTEGER,
                    description: "الرقم التسلسلي للصف (ت)"
                  },
                  name: {
                    type: Type.STRING,
                    description: "الاسم الكامل للموظف"
                  },
                  department: {
                    type: Type.STRING,
                    description: "القسم التابع له الموظف"
                  },
                  dateString: {
                    type: Type.STRING,
                    description: "تاريخ التأخير بصيغة DD/MM/YYYY"
                  },
                  timeString: {
                    type: Type.STRING,
                    description: "وقت بصمة التأخير بصيغة HH:MM"
                  }
                },
                required: ["index", "name", "department", "dateString", "timeString"]
              }
            }
          }
        });
      } catch (error: any) {
        if (error.message?.includes('503') || error.message?.includes('high demand') || error.status === 'UNAVAILABLE') {
          console.log('gemini-2.5-flash overloaded, trying gemini-2.5-pro...');
          response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: [
              imagePart,
              { text: "قم باستخراج جدول 'موقف المتأخرين' من الصورة طبقاً لتعليمات النظام وبنية الـ responseSchema المحددة بالكامل وبدون اختصارات." }
            ],
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    index: {
                      type: Type.INTEGER,
                      description: "الرقم التسلسلي للصف (ت)"
                    },
                    name: {
                      type: Type.STRING,
                      description: "الاسم الكامل للموظف"
                    },
                    department: {
                      type: Type.STRING,
                      description: "القسم التابع له الموظف"
                    },
                    dateString: {
                      type: Type.STRING,
                      description: "تاريخ التأخير بصيغة DD/MM/YYYY"
                    },
                    timeString: {
                      type: Type.STRING,
                      description: "وقت بصمة التأخير بصيغة HH:MM"
                    }
                  },
                  required: ["index", "name", "department", "dateString", "timeString"]
                }
              }
            }
          });
        } else {
          throw error;
        }
      }

      const text = response.text;
      if (!text) {
        throw new Error("لم يتم إرجاع أي استجابة قابلة للقراءة من نموذج الذكاء الاصطناعي.");
      }

      const parsedData = JSON.parse(text);
      res.json({ success: true, data: parsedData });

    } catch (error: any) {
      console.error("Error parsing image with Gemini:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "حدث خطأ أثناء معالجة الصورة بالذكاء الاصطناعي." 
      });
    }
  });

  // Vite middleware setup (using '*' for Express v4)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
