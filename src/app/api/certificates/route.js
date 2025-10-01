// src/app/api/certificates/route.js

import { db } from "../../../lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const certificatesRef = collection(db, "sertifikat_terbuat");
    const q = query(certificatesRef, orderBy("dibuatPada", "desc"), limit(20));
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
