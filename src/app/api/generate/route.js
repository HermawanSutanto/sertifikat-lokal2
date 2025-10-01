import { supabase } from "../../../lib/supabase";
import { db } from "../../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import sharp from "sharp";
import { NextResponse } from "next/server";

// Fungsi cache untuk font agar tidak di-download berulang kali
const fontCache = new Map();
async function getFontBase64(fontFamily) {
  if (fontCache.has(fontFamily)) {
    return fontCache.get(fontFamily);
  }
  const fontUrlMap = {
    Roboto: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf",
    Montserrat:
      "https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXo.ttf",
    "Playfair Display":
      "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWos7joP-pg.ttf",
    Arial: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf" // Fallback ke Roboto
  };
  const fontUrl = fontUrlMap[fontFamily] || fontUrlMap["Roboto"];
  try {
    const response = await fetch(fontUrl);
    if (!response.ok) throw new Error(`Gagal mengambil font: ${fontFamily}`);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    fontCache.set(fontFamily, base64);
    return base64;
  } catch (error) {
    console.error("Error fetching font:", error);
    return null;
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const templateFile = formData.get("template");
    const namesField = formData.get("names");
    const positionXPercent =
      parseFloat(formData.get("positionXPercent")) || 0.5;
    const positionYPercent =
      parseFloat(formData.get("positionYPercent")) || 0.5;
    const previewFontSize = parseInt(formData.get("fontSize"), 10) || 48;
    const previewWidth = parseInt(formData.get("previewWidth"), 10) || 500; // 500 adalah fallback
    const fontFamily = formData.get("fontFamily") || "Roboto";
    const textColor = formData.get("textColor") || "#333333";

    if (!templateFile || !namesField) {
      return NextResponse.json(
        { message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const names = namesField.split(",").map((name) => name.trim());
    let templateFileBuffer = Buffer.from(await templateFile.arrayBuffer());

    // Baca dimensi gambar asli dari template
    const metadata = await sharp(templateFileBuffer).metadata();
    const imageWidth = metadata.width;
    const imageHeight = metadata.height;

    // Logika kompresi jika file terlalu besar
    const maxSizeInBytes = 2 * 1024 * 1024; // 2 MB
    if (templateFileBuffer.length > maxSizeInBytes) {
      templateFileBuffer = await sharp(templateFileBuffer)
        .resize({ width: 1920, withoutEnlargement: true }) // Resize jika perlu
        .png({ quality: 80 }) // Kompresi ke PNG
        .toBuffer();
    }

    // Upload template ke Supabase Storage
    const templatePath = `template-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("templates")
      .upload(templatePath, templateFileBuffer, { contentType: "image/png" });
    if (uploadError) throw new Error(uploadError.message);

    const {
      data: { publicUrl: templatePublicUrl }
    } = supabase.storage.from("templates").getPublicUrl(templatePath);

    const certificateUrls = [];
    const fontBase64 = await getFontBase64(fontFamily);
    if (!fontBase64)
      throw new Error("Tidak bisa memuat font untuk generate sertifikat.");

    // Loop untuk setiap nama dan generate sertifikat
    for (const name of names) {
      // Hitung posisi piksel final berdasarkan persentase
      const finalX = imageWidth * positionXPercent;
      const finalY = imageHeight * positionYPercent;

      // Hitung ukuran font final berdasarkan rasio lebar gambar vs preview
      const scaleFactor = imageWidth / previewWidth;
      const finalFontSize = Math.round(previewFontSize * scaleFactor);

      // Buat SVG dengan dimensi yang sama persis dengan template
      const svgText = `
        <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
          <style>
            @font-face {
              font-family: "${fontFamily}";
              src: url(data:font/ttf;base64,${fontBase64});
            }
            .title { 
              fill: ${textColor}; 
              font-size: ${finalFontSize}px;
              font-weight: bold; 
              font-family: "${fontFamily}", sans-serif; 
            }
          </style>
          <text 
            x="${finalX}" 
            y="${finalY}" 
            text-anchor="middle" 
            dominant-baseline="middle"
            class="title"
          >
            ${name.trim()}
          </text>
        </svg>
      `;
      const svgBuffer = Buffer.from(svgText);

      // Gabungkan template dengan SVG teks menggunakan Sharp
      const generatedCertBuffer = await sharp(templateFileBuffer)
        .composite([{ input: svgBuffer, top: 0, left: 0 }])
        .toBuffer();

      // Upload sertifikat hasil generate ke Supabase
      const certPath = `sertifikat-${name.replace(
        /\s+/g,
        "-"
      )}-${Date.now()}.png`;
      const { error: certUploadError } = await supabase.storage
        .from("generated-certificates")
        .upload(certPath, generatedCertBuffer, { contentType: "image/png" });

      if (certUploadError) {
        console.error(
          `Gagal upload sertifikat untuk ${name}:`,
          certUploadError.message
        );
        continue; // Lanjut ke nama berikutnya jika gagal
      }

      const {
        data: { publicUrl }
      } = supabase.storage
        .from("generated-certificates")
        .getPublicUrl(certPath);

      certificateUrls.push(publicUrl);

      // Simpan metadata ke Firebase Firestore
      await addDoc(collection(db, "sertifikat_terbuat"), {
        namaPeserta: name,
        urlSertifikat: publicUrl,
        templateAsli: templatePublicUrl,
        dibuatPada: serverTimestamp(),
        customization: {
          positionXPercent,
          positionYPercent,
          fontSize: previewFontSize,
          fontFamily,
          textColor
        }
      });
    }

    return NextResponse.json({ message: "Sukses!", certificateUrls });
  } catch (error) {
    console.error("Kesalahan di API generate:", error);
    return NextResponse.json(
      { message: error.message || "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}
