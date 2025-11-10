import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

// Sinh mã QR có chữ ký
export const createQrToken = (payload) => {
  const data = {
    sessionId: payload.sessionId || null,
    classId: payload.classId,
    date: payload.date,
    exp: Date.now() + 5 * 60 * 1000, // hết hạn sau 5 phút
  };
  const json = JSON.stringify(data);
  const signature = crypto
    .createHmac("sha256", process.env.QR_SECRET)
    .update(json)
    .digest("hex");
  const token = Buffer.from(json).toString("base64") + "." + signature;
  return token;
};

// Giải mã và xác thực mã QR
export const verifyQrToken = (token) => {
  try {
    const [payloadB64, signature] = token.split(".");
    const json = Buffer.from(payloadB64, "base64").toString("utf8");

    const expectedSig = crypto
      .createHmac("sha256", process.env.QR_SECRET)
      .update(json)
      .digest("hex");

    if (signature !== expectedSig) throw new Error("Invalid QR signature");

    const data = JSON.parse(json);
    if (Date.now() > data.exp) throw new Error("QR expired");

    return data; // { classId, date, exp }
  } catch (err) {
    throw new Error("Invalid or expired QR code");
  }
};
