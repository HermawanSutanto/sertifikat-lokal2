// src/app/api/generate/route.js

import { supabase } from "../../../lib/supabase";
import { db } from "../../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import sharp from "sharp";
import { NextResponse } from "next/server";

// Fungsi untuk mengambil font dari Google Fonts dan mengubahnya menjadi base64
async function getFontBase64(fontFamily) {
  // URL ini mengambil font Roboto regular. Anda bisa menggantinya.
  const fontUrl = `https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf`;
  try {
    const response = await fetch(fontUrl);
    if (!response.ok) throw new Error("Gagal mengambil font");
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
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
    // Ambil data kustomisasi
    const positionX = parseInt(formData.get("positionX"), 10) || 0;
    const positionY = parseInt(formData.get("positionY"), 10) || 0;
    const fontSize = parseInt(formData.get("fontSize"), 10) || 48;
    const fontFamily = formData.get("fontFamily") || "Roboto";
    const textColor = formData.get("textColor") || "#333333";

    // ... (kode validasi dan upload template tetap sama)
    if (!templateFile || !namesField) {
      return NextResponse.json(
        { message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const names = namesField.split(",").map((name) => name.trim());
    let templateFileBuffer = Buffer.from(await templateFile.arrayBuffer());
    const maxSizeInBytes = 2 * 1024 * 1024; // Set maksimal ukuran 2 MB

    for (const name of names) {
      // --- PEMBUATAN SVG DINAMIS ---
      const svgText = `
        <svg width="1000" height="700">
          <style>
            @font-face {
              font-family: '${fontFamily}';
              src: url(data:font/ttf;base64,${fontBase64});
            }
            .title { 
              fill: ${textColor}; 
              font-size: ${fontSize}px; 
              font-weight: bold; 
              font-family: '${fontFamily}'; 
            }
          </style>
          <text 
            x="${500 + positionX}" 
            y="${350 + positionY}" 
            text-anchor="middle" 
            class="title"
          >
            ${name}
          </text>
        </svg>
      `;
      if (templateFileBuffer.length > maxSizeInBytes) {
        console.log(
          `Ukuran file asli: ${(
            templateFileBuffer.length /
            1024 /
            1024
          ).toFixed(2)} MB. Memulai kompresi...`
        );

        templateFileBuffer = await sharp(templateFileBuffer)
          .resize({ width: 1920, withoutEnlargement: true }) // Resize jika lebih besar dari 1920px, tanpa memperbesar gambar kecil
          .png({ quality: 80 }) // Kompresi kualitas PNG
          .toBuffer();

        console.log(
          `Ukuran file setelah kompresi: ${(
            templateFileBuffer.length /
            1024 /
            1024
          ).toFixed(2)} MB`
        );
      }
      // ... (sisa kode untuk composite gambar dan upload tetap sama)
    }

    return NextResponse.json({ message: "Sukses!", certificateUrls });
  } catch (error) {
    // ... (error handling tetap sama)
  }
}

// Catatan: Kode di atas adalah fragmen yang menunjukkan perubahan utama.
// Gabungkan ini dengan file route.js lengkap Anda sebelumnya.
