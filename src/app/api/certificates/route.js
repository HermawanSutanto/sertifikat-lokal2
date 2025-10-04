import { db } from "../../../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  doc,
  getDoc
} from "firebase/firestore";
import { NextResponse } from "next/server";
import admin from "../../../lib/firebaseAdmin";

const PAGE_SIZE = 10; // Jumlah sertifikat yang akan diambil per halaman

export async function GET(req) {
  try {
    // 1. Verifikasi Token Otentikasi (tidak berubah)
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

    // --- LOGIKA PAGINATION DIMULAI DI SINI ---

    const { searchParams } = new URL(req.url);
    const lastVisibleId = searchParams.get("lastVisible");

    const certificatesRef = collection(db, "sertifikat_terbuat");
    let q;

    const queryConstraints = [
      where("userId", "==", uid),
      orderBy("dibuatPada", "desc"),
      limit(PAGE_SIZE)
    ];

    if (lastVisibleId) {
      const lastVisibleDoc = await getDoc(
        doc(db, "sertifikat_terbuat", lastVisibleId)
      );
      if (lastVisibleDoc.exists()) {
        queryConstraints.push(startAfter(lastVisibleDoc));
      }
    }

    q = query(certificatesRef, ...queryConstraints);

    // --- LOGIKA PAGINATION SELESAI ---

    const querySnapshot = await getDocs(q);
    const certificates = [];
    querySnapshot.forEach((doc) => {
      certificates.push({ id: doc.id, ...doc.data() });
    });

    // Dapatkan ID dokumen terakhir untuk halaman berikutnya
    const lastDocId =
      querySnapshot.docs[querySnapshot.docs.length - 1]?.id || null;
    const hasMore = certificates.length === PAGE_SIZE;

    return NextResponse.json({ certificates, lastDocId, hasMore });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data sertifikat", error: error.message },
      { status: 500 }
    );
  }
}
