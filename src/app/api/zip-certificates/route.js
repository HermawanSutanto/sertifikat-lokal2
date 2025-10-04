// src/app/api/zip-certificates/route.js

import { NextResponse } from "next/server";
import admin from "../../../lib/firebaseAdmin";
import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { supabase } from "../../../lib/supabase";
import JSZip from "jszip";

export async function POST(req) {
  try {
    // 1. Autentikasi Pengguna (Sama seperti endpoint generate)
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Token tidak valid" },
        { status: 401 }
      );
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    if (!uid) {
      return NextResponse.json(
        { message: "UID tidak ditemukan" },
        { status: 403 }
      );
    }

    // 2. Ambil Semua Data Sertifikat Pengguna dari Firestore
    const certificatesRef = collection(db, "sertifikat_terbuat");
    const q = query(certificatesRef, where("userId", "==", uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { message: "Tidak ada sertifikat untuk di-ZIP" },
        { status: 404 }
      );
    }

    const certificateData = querySnapshot.docs.map((doc) => doc.data());

    // 3. Unduh Semua File dari Supabase & Buat ZIP di Memori Server
    const zip = new JSZip();

    const downloadPromises = certificateData.map(async (cert) => {
      // Ekstrak path file dari URL
      const url = new URL(cert.urlSertifikat);
      const filePath = url.pathname.split("/generated-certificates/")[1];

      const { data, error } = await supabase.storage
        .from("generated-certificates")
        .download(decodeURIComponent(filePath));

      if (error) {
        console.error(`Gagal mengunduh file ${filePath}:`, error);
        return; // Lewati file yang gagal
      }

      const fileName = `sertifikat-${cert.namaPeserta.replace(
        /\s+/g,
        "-"
      )}.jpeg`;
      zip.file(fileName, await data.arrayBuffer());
    });

    await Promise.all(downloadPromises);

    // 4. Generate Buffer ZIP dan Unggah ke Supabase
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    const zipPath = `arsip-zip/sertifikat-${uid}-${Date.now()}.zip`;
    const { error: uploadError } = await supabase.storage
      .from("generated-certificates") // Atau bucket lain jika Anda mau
      .upload(zipPath, zipBuffer, {
        contentType: "application/zip"
      });

    if (uploadError) {
      throw new Error("Gagal mengunggah file ZIP ke storage.");
    }

    // 5. Dapatkan URL Publik untuk File ZIP
    const {
      data: { publicUrl }
    } = supabase.storage.from("generated-certificates").getPublicUrl(zipPath);

    // 6. Kirim URL ZIP kembali ke Client
    return NextResponse.json({ zipUrl: publicUrl });
  } catch (error) {
    console.error("Kesalahan saat membuat file ZIP:", error);
    return NextResponse.json(
      { message: error.message || "Terjadi kesalahan internal." },
      { status: 500 }
    );
  }
}
