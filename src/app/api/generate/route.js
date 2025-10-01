// src/app/api/generate/route.js

import { supabase } from "../../../lib/supabase";
import { db } from "../../../lib/firebase";
import {
  collection,
  serverTimestamp,
  writeBatch,
  doc
} from "firebase/firestore";
import sharp from "sharp";
import { NextResponse } from "next/server";
import admin from "../../../lib/firebaseAdmin"; // <-- IMPORT FIREBASE ADMIN

// Fungsi cache untuk font (tidak ada perubahan)
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
    Arial: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf"
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
    // 1. Verifikasi Token Otentikasi dan dapatkan UID
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Token tidak ditemukan atau format salah" },
        { status: 401 }
      );
    }
    const idToken = authorization.split("Bearer ")[1];

    let decodedToken;
    try {
      // PERBAIKAN: Gunakan admin.auth() langsung
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Firebase Auth Error:", error);
      return NextResponse.json(
        { message: "Sesi tidak valid atau kadaluwarsa" },
        { status: 403 }
      );
    }

    const uid = decodedToken.uid; // <-- UID pengguna didapatkan di sini
    if (!uid) {
      return NextResponse.json(
        { message: "UID tidak ditemukan di dalam token" },
        { status: 403 }
      );
    }

    // Parsing & Persiapan Awal (Tidak ada perubahan di bagian ini)
    const formData = await req.formData();
    const templateFile = formData.get("template");
    const namesField = formData.get("names");
    const positionXPercent =
      parseFloat(formData.get("positionXPercent")) || 0.5;
    const positionYPercent =
      parseFloat(formData.get("positionYPercent")) || 0.5;
    const previewFontSize = parseInt(formData.get("fontSize"), 10) || 48;
    const previewWidth = parseInt(formData.get("previewWidth"), 10) || 500;
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

    const metadata = await sharp(templateFileBuffer).metadata();
    const imageWidth = metadata.width;
    const imageHeight = metadata.height;

    const maxSizeInBytes = 2 * 1024 * 1024;
    if (templateFileBuffer.length > maxSizeInBytes) {
      templateFileBuffer = await sharp(templateFileBuffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .png({ quality: 80 })
        .toBuffer();
    }

    const fontBase64 = await getFontBase64(fontFamily);
    if (!fontBase64) throw new Error("Tidak bisa memuat font.");

    const baseImage = sharp(templateFileBuffer);

    // Generate, Upload, dan Simpan (Tidak ada perubahan di bagian ini)
    const generatedDataPromises = names.map(async (name) => {
      const finalX = imageWidth * positionXPercent;
      const finalY = imageHeight * positionYPercent;
      const scaleFactor = imageWidth / previewWidth;
      const finalFontSize = Math.round(previewFontSize * scaleFactor);

      const svgText = `
        <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
          <style>@font-face {font-family: "${fontFamily}"; src: url(data:font/ttf;base64,${fontBase64});} .title { fill: ${textColor}; font-size: ${finalFontSize}px; font-weight: bold; font-family: "${fontFamily}", sans-serif; }</style>
          <text x="${finalX}" y="${finalY}" text-anchor="middle" dominant-baseline="middle" class="title">${name.trim()}</text>
        </svg>`;
      const svgBuffer = Buffer.from(svgText);

      const generatedCertBuffer = await baseImage
        .clone()
        .composite([{ input: svgBuffer, top: 0, left: 0 }])
        .png({ quality: 85 })
        .toBuffer();

      return { name, buffer: generatedCertBuffer };
    });

    const allGeneratedData = await Promise.all(generatedDataPromises);

    const uploadPromises = allGeneratedData.map(async (data) => {
      const certPath = `sertifikat-${data.name.replace(
        /\s+/g,
        "-"
      )}-${Date.now()}.png`;
      await supabase.storage
        .from("generated-certificates")
        .upload(certPath, data.buffer, { contentType: "image/png" });

      const {
        data: { publicUrl }
      } = supabase.storage
        .from("generated-certificates")
        .getPublicUrl(certPath);

      return { name: data.name, url: publicUrl };
    });

    const allUploadedCerts = await Promise.all(uploadPromises);

    const batch = writeBatch(db);
    allUploadedCerts.forEach((cert) => {
      const docRef = doc(collection(db, "sertifikat_terbuat"));
      batch.set(docRef, {
        userId: uid, // <-- TAMBAHKAN UID PENGGUNA DI SINI
        namaPeserta: cert.name,
        urlSertifikat: cert.url,
        dibuatPada: serverTimestamp(),
        customization: {
          positionXPercent,
          positionYPercent,
          fontSize: previewFontSize,
          fontFamily,
          textColor
        }
      });
    });

    await batch.commit();

    const certificateUrls = allUploadedCerts.map((cert) => cert.url);

    return NextResponse.json({ message: "Sukses!", certificateUrls });
  } catch (error) {
    console.error("Kesalahan di API generate:", error);
    return NextResponse.json(
      { message: error.message || "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}
