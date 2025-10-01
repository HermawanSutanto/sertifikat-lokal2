// src/app/api/certificates/route.js

import { db } from "../../../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { NextResponse } from "next/server";
import admin from "../../../lib/firebaseAdmin";

export async function GET(req) {
  try {
    // 1. Verifikasi Token Otentikasi untuk memastikan pengguna login
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
      // Kode ini sudah menggunakan admin.auth() yang benar
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { message: "Sesi tidak valid atau kadaluwarsa" },
        { status: 403 }
      );
    }

    const uid = decodedToken.uid;
    if (!uid) {
      return NextResponse.json(
        { message: "UID tidak ditemukan di dalam token" },
        { status: 403 }
      );
    }

    // 2. Ambil data sertifikat HANYA untuk pengguna dengan UID yang sesuai
    const certificatesRef = collection(db, "sertifikat_terbuat");
    const q = query(
      certificatesRef,
      where("userId", "==", uid), // <-- Filter berdasarkan UID pengguna
      orderBy("dibuatPada", "desc"),
      limit(20)
    );

    const querySnapshot = await getDocs(q);
    const certificates = [];
    querySnapshot.forEach((doc) => {
      certificates.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data sertifikat", error: error.message },
      { status: 500 }
    );
  }
}
