import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Gemini AI – phân tích xu hướng vắng học
 */
export async function analyzeAttendanceWithGemini(payload) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash", // MODEL DUY NHẤT NÊN DÙNG
  });

  const prompt = `
Bạn là AI hỗ trợ giáo dục.

Dữ liệu sau là lịch sử điểm danh của một lớp học.
Hãy phân tích và dự đoán nguy cơ sinh viên nghỉ học.

YÊU CẦU:
- Trả về JSON
- Không giải thích thêm ngoài JSON
- Cấu trúc:

{
  "classRisk": "HIGH" | "MEDIUM" | "LOW",
  "summary": string,
  "students": [
    {
      "studentId": string,
      "name": string,
      "risk": "HIGH" | "MEDIUM" | "LOW",
      "probability": number,
      "reason": string
    }
  ],
  "recommendations": string[]
}

DỮ LIỆU:
${JSON.stringify(payload, null, 2)}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return JSON.parse(text); // nếu fail → controller fallback
}
