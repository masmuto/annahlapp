import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateNIS, generateNoPembayaran } from "@/lib/format";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "true";

    // Check if already seeded
    if (!force) {
      const existingUsers = await db.user.count();
      if (existingUsers > 0) {
        return NextResponse.json(
          { message: "Database sudah berisi data. Seed dilewati. Gunakan ?force=true untuk reset." },
          { status: 200 }
        );
      }
    }

    // If force, wipe existing data
    if (force) {
      await db.anggotaKelompok.deleteMany();
      await db.kelompokBelajar.deleteMany();
      await db.pembayaranSPP.deleteMany();
      await db.santri.deleteMany();
      await db.kelas.deleteMany();
      await db.ustaz.deleteMany();
      await db.user.deleteMany();
    }

    // 1. Create users (with new fields: email, phone)
    await db.user.createMany({
      data: [
        {
          username: "admin",
          password: "admin123",
          name: "Administrator An Nahl",
          role: "admin",
          email: "admin@tahfidzannahl.sch.id",
          phone: "081200000001",
        },
        {
          username: "bendahara",
          password: "bendahara123",
          name: "Bendahara An Nahl",
          role: "bendahara",
          email: "bendahara@tahfidzannahl.sch.id",
          phone: "081200000002",
        },
        {
          username: "pengelola",
          password: "pengelola123",
          name: "Pengelola An Nahl",
          role: "pengelola",
          email: "pengelola@tahfidzannahl.sch.id",
          phone: "081200000003",
        },
      ],
    });

    // 2. Create ustaz (8 teachers)
    const ustazData = [
      { nama: "Ust. Ahmad Fauzan, S.Pd.I", jenisKelamin: "L", spesialisasi: "Tahfidz", noHp: "081234567001" },
      { nama: "Ust. Siti Aminah, S.Pd.I", jenisKelamin: "P", spesialisasi: "Tahfidz", noHp: "081234567002" },
      { nama: "Ust. Abdul Rahman, Lc", jenisKelamin: "L", spesialisasi: "Tajwid", noHp: "081234567003" },
      { nama: "Ust. Khadijah, S.Pd.I", jenisKelamin: "P", spesialisasi: "Iqra", noHp: "081234567004" },
      { nama: "Ust. Yusuf Mansyur, S.Ag", jenisKelamin: "L", spesialisasi: "Tafsir", noHp: "081234567005" },
      { nama: "Ust. Fatimah, S.Pd.I", jenisKelamin: "P", spesialisasi: "Tahfidz", noHp: "081234567006" },
      { nama: "Ust. Ibrahim, Lc", jenisKelamin: "L", spesialisasi: "Tahsin", noHp: "081234567007" },
      { nama: "Ust. Maryam, S.Pd.I", jenisKelamin: "P", spesialisasi: "Iqra", noHp: "081234567008" },
    ];
    const ustaz = await Promise.all(
      ustazData.map((u) =>
        db.ustaz.create({
          data: {
            nip: `NIP-2025-${String(ustazData.indexOf(u) + 1).padStart(3, "0")}`,
            nama: u.nama,
            jenisKelamin: u.jenisKelamin,
            spesialisasi: u.spesialisasi,
            noHp: u.noHp,
            tanggalMasuk: new Date("2023-07-15"),
            alamat: "Jl. Pendidikan No. " + (ustazData.indexOf(u) + 1),
          },
        })
      )
    );

    // 3. Create kelas (6 classes)
    const kelasData = [
      { nama: "Kelas A - Iqra 1", tingkat: "Iqra", ustazIdx: 3, kapasitas: 15 },
      { nama: "Kelas B - Iqra 2", tingkat: "Iqra", ustazIdx: 7, kapasitas: 15 },
      { nama: "Kelas C - Tahsin", tingkat: "Tahsin", ustazIdx: 6, kapasitas: 18 },
      { nama: "Kelas D - Tahfidz 1", tingkat: "Tahfidz", ustazIdx: 0, kapasitas: 20 },
      { nama: "Kelas E - Tahfidz 2", tingkat: "Tahfidz", ustazIdx: 1, kapasitas: 20 },
      { nama: "Kelas F - Tadarus", tingkat: "Tadarus", ustazIdx: 2, kapasitas: 25 },
    ];
    const kelas = await Promise.all(
      kelasData.map((k) =>
        db.kelas.create({
          data: {
            nama: k.nama,
            tingkat: k.tingkat,
            ustazId: ustaz[k.ustazIdx].id,
            kapasitas: k.kapasitas,
          },
        })
      )
    );

    // 4. Create santri (85 students)
    const namaLDepan = [
      "Ahmad", "Muhammad", "Abdul", "Ali", "Hasan", "Husein", "Yusuf", "Ibrahim",
      "Ismail", "Omar", "Ridwan", "Salman", "Zaid", "Bilal", "Hamzah", "Khalid",
      "Aisyah", "Fatimah", "Khadijah", "Maryam", "Hafsah", "Zainab", "Ruqayyah",
      "Sakinah", "Aminah", "Sumayyah", "Hajar", "Sarah", "Hindun", "Asma",
    ];
    const namaLBelakang = [
      "Fauzan", "Hidayat", "Mubarak", "Rahman", "Rahim", "Salam", "Kamil", "Yusuf",
      "Saputra", "Wijaya", "Pratama", "Nugraha", "Akbar", "Hanif", "Siddiq",
      "Faqih", "Zaki", "Karim", "Latif", "Jabbar",
    ];
    const namaPDepan = [
      "Aisyah", "Fatimah", "Khadijah", "Maryam", "Hafsah", "Zainab", "Sakinah",
      "Aminah", "Sumayyah", "Husna", "Latifah", "Hanifah", "Salma", "Nabila",
      "Az-Zahra", "Raissan", "Adinda", "Putri", "Najwa", "Humaira",
    ];
    const namaPBelakang = [
      "Salsabila", "Azzahra", "Hanun", "Kamilah", "Wulandari", "Safitri",
      "Rahmawati", "Lestari", "Anggraini", "Permata", "Mutiara", "Indah",
      "Cahya", "Ningrum", "Fauziah", "Hidayah",
    ];

    const santriList = [];
    for (let i = 0; i < 85; i++) {
      const isL = i % 2 === 0;
      const nama = isL
        ? `${namaLDepan[i % namaLDepan.length]} ${namaLBelakang[i % namaLBelakang.length]}`
        : `${namaPDepan[i % namaPDepan.length]} ${namaPBelakang[i % namaPBelakang.length]}`;
      const kelasIdx = i % 6;
      const birthYear = 2015 + (i % 6);
      const birthMonth = (i % 12) + 1;
      const birthDay = (i % 28) + 1;
      const spp = [150000, 175000, 200000, 200000, 225000, 175000][kelasIdx];

      const santri = await db.santri.create({
        data: {
          nis: generateNIS(i + 1),
          nama,
          jenisKelamin: isL ? "L" : "P",
          tempatLahir: i % 3 === 0 ? "Bandung" : i % 3 === 1 ? "Jakarta" : "Bogor",
          tanggalLahir: new Date(birthYear, birthMonth - 1, birthDay),
          alamat: `Jl. Melati No. ${i + 1}, Kec. Cimahi`,
          namaAyah: `Bapak ${namaLDepan[i % namaLDepan.length]}`,
          namaIbu: `Ibu ${namaPDepan[i % namaPDepan.length]}`,
          noHpOrtu: `0812${String(3456700 + i).padStart(7, "0")}`,
          kelasId: kelas[kelasIdx].id,
          tanggalMasuk: new Date(2024, 6, 15),
          status: i % 12 === 0 ? "nonaktif" : "aktif",
          sppBulanan: spp,
        },
      });
      santriList.push(santri);
    }

    // 5. Create kelompok belajar (study groups) — kelompok lintas kelas
    // Setiap kelompok bisa punya jadwal lebih dari 1 hari dalam seminggu
    const hariList = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];
    const matapelajaran = ["Tahfidz", "Tajwid", "Tadarus", "Tahsin", "Iqra", "Tafsir"];
    const sesiLabel = ["Pagi", "Sore", "Malam"];
    const jamSesi = [
      { mulai: "07:00", selesai: "08:30" },
      { mulai: "16:00", selesai: "17:30" },
      { mulai: "19:00", selesai: "20:30" },
    ];

    const kelompokBelajarIds: string[] = [];

    // Buat 12 kelompok belajar (2 per mata pelajaran)
    for (let mp = 0; mp < matapelajaran.length; mp++) {
      for (let idx = 0; idx < 2; idx++) {
        const sesi = jamSesi[idx];
        const ustazIdx = (mp * 2 + idx) % ustaz.length;
        const kelompok = await db.kelompokBelajar.create({
          data: {
            nama: `Kelompok ${matapelajaran[mp]} ${sesiLabel[idx]} ${String.fromCharCode(65 + idx)}`,
            ustazId: ustaz[ustazIdx].id,
            mataPelajaran: matapelajaran[mp],
            ruangan: `Ruang ${String.fromCharCode(65 + mp)}${idx + 1}`,
            kapasitas: 15,
            status: "aktif",
            catatan: `Kelompok belajar ${matapelajaran[mp]} sesi ${sesiLabel[idx].toLowerCase()}`,
          },
        });
        kelompokBelajarIds.push(kelompok.id);

        // Buat 2-3 jadwal per kelompok (multi-hari dalam seminggu)
        // Pattern: kelompok Pagi → Senin & Kamis; Sore → Selasa & Jumat; Malam → Rabu & Sabtu
        const jadwalHari1 = hariList[(mp * 2 + idx) % 5]; // Senin-Jumat
        const jadwalHari2 = hariList[(mp * 2 + idx) % 5 + 1]; // besoknya
        // opsional hari ke-3 untuk beberapa kelompok
        const jadwalHari3 = (mp + idx) % 2 === 0 ? hariList[(mp * 2 + idx + 3) % 5] : null;

        await db.jadwalKelompok.create({
          data: {
            kelompokId: kelompok.id,
            hari: jadwalHari1,
            jamMulai: sesi.mulai,
            jamSelesai: sesi.selesai,
          },
        });
        await db.jadwalKelompok.create({
          data: {
            kelompokId: kelompok.id,
            hari: jadwalHari2,
            jamMulai: sesi.mulai,
            jamSelesai: sesi.selesai,
          },
        });
        if (jadwalHari3) {
          await db.jadwalKelompok.create({
            data: {
              kelompokId: kelompok.id,
              hari: jadwalHari3,
              jamMulai: sesi.mulai,
              jamSelesai: sesi.selesai,
            },
          });
        }
      }
    }

    // Distribusikan santri aktif ke kelompok belajar (acak 1-2 kelompok per santri)
    const activeSantriForKelompok = santriList.filter((s) => s.status === "aktif");
    for (let i = 0; i < activeSantriForKelompok.length; i++) {
      const santri = activeSantriForKelompok[i];
      // Setiap santri ikut 1-2 kelompok belajar
      const numGroups = (i % 3 === 0) ? 2 : 1;
      for (let g = 0; g < numGroups; g++) {
        const kelompokId = kelompokBelajarIds[(i + g * 3) % kelompokBelajarIds.length];
        try {
          // Cek kapasitas sebelum menambah
          const target = await db.kelompokBelajar.findUnique({
            where: { id: kelompokId },
            include: { _count: { select: { anggota: true } } },
          });
          if (target && target._count.anggota < target.kapasitas) {
            await db.anggotaKelompok.create({
              data: {
                kelompokId,
                santriId: santri.id,
                tanggalBergabung: new Date(2024, 6, 15),
              },
            });
          }
        } catch {
          // ignore duplicate
        }
      }
    }

    // 6. Create SPP payments (current month — ~70% of active santri paid)
    const now = new Date();
    const bulan = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const activeSantri = santriList.filter((s) => s.status === "aktif");
    const paidCount = Math.floor(activeSantri.length * 0.7);
    let paymentIdx = 1;
    for (let i = 0; i < paidCount; i++) {
      const s = activeSantri[i];
      await db.pembayaranSPP.create({
        data: {
          noPembayaran: generateNoPembayaran(paymentIdx),
          santriId: s.id,
          bulan,
          jumlah: s.sppBulanan,
          metodePembayaran: i % 3 === 0 ? "transfer" : i % 3 === 1 ? "tunai" : "qris",
          status: "lunas",
          diterimaOleh: "Bendahara An Nahl",
          tanggalBayar: new Date(
            now.getFullYear(),
            now.getMonth(),
            Math.min(now.getDate(), 28)
          ),
        },
      });
      paymentIdx++;
    }

    // Also create payments for the previous 5 months for trend chart
    for (let m = 1; m <= 5; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 15);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthPaidCount = Math.floor(activeSantri.length * (0.55 + m * 0.03));
      for (let i = 0; i < monthPaidCount && i < activeSantri.length; i++) {
        const s = activeSantri[i];
        try {
          await db.pembayaranSPP.create({
            data: {
              noPembayaran: generateNoPembayaran(paymentIdx, d),
              santriId: s.id,
              bulan: ym,
              jumlah: s.sppBulanan,
              metodePembayaran: "tunai",
              status: "lunas",
              diterimaOleh: "Bendahara An Nahl",
              tanggalBayar: d,
            },
          });
          paymentIdx++;
        } catch {
          // ignore duplicates
        }
      }
    }

    // 7. Create default pengaturan (WhatsApp settings & app config)
    await db.pengaturan.createMany({
      data: [
        { key: "wa_enabled", value: "true" },
        { key: "wa_sender_name", value: "Rumah Tahfidz An Nahl" },
        { key: "wa_sender_number", value: "6281200000000" },
        { key: "wa_api_url", value: "" },
        { key: "wa_api_token", value: "" },
        { key: "wa_use_gateway", value: "false" },
        { key: "app_name", value: "GO An Nahl" },
        { key: "app_lembaga", value: "Rumah Tahfidz An Nahl" },
        { key: "app_address", value: "Jl. Pendidikan No. 1, Kota" },
        { key: "app_phone", value: "081200000000" },
        { key: "app_email", value: "info@tahfidzannahl.sch.id" },
        { key: "spp_default_amount", value: "150000" },
        { key: "spp_due_day", value: "10" },
      ],
    });

    // 8. Create default pesan templates
    await db.pesanTemplate.createMany({
      data: [
        {
          kode: "bukti_pembayaran",
          nama: "Bukti Pembayaran SPP",
          kategori: "pembayaran",
          aktif: true,
          isi: `Assalamu'alaikum Wr. Wb.

Yth. {nama_ortu}

Kami informasikan bahwa pembayaran SPP putra/putri Bapak/Ibu telah kami terima dengan rincian:

Nama Santri: {nama}
NIS: {nis}
Kelas: {kelas}
Bulan: {bulan}
Jumlah: {jumlah}
No. Pembayaran: {noPembayaran}
Tanggal: {tanggal}

Jazakumullah khairan katsira.

Wassalamu'alaikum Wr. Wb.
{lembaga}`,
        },
        {
          kode: "tunggakan_spp",
          nama: "Pengingat Tunggakan SPP",
          kategori: "tunggakan",
          aktif: true,
          isi: `Assalamu'alaikum Wr. Wb.

Yth. {nama_ortu}

Kami informasikan bahwa pembayaran SPP untuk putra/putri Bapak/Ibu pada bulan {bulan} belum diterima.

Nama Santri: {nama}
NIS: {nis}
Kelas: {kelas}
Bulan: {bulan}
Jumlah: {jumlah}

Mohon dapat segera melakukan pembayaran. Jazakumullah khairan.

Wassalamu'alaikum Wr. Wb.
{lembaga}`,
        },
        {
          kode: "info_jadwal",
          nama: "Info Jadwal Kelompok Belajar",
          kategori: "jadwal",
          aktif: true,
          isi: `Assalamu'alaikum Wr. Wb.

Yth. {nama_ortu}

Kami informasikan jadwal kelompok belajar putra/putri Bapak/Ibu:

Nama Santri: {nama}
NIS: {nis}
Hari: {hari}
Jam: {jam}
Pembimbing: {ustaz}
Ruangan: {ruangan}

Mohon hadir tepat waktu. Jazakumullah khairan.

Wassalamu'alaikum Wr. Wb.
{lembaga}`,
        },
        {
          kode: "pengumuman_umum",
          nama: "Pengumuman Umum",
          kategori: "umum",
          aktif: true,
          isi: `Assalamu'alaikum Wr. Wb.

Yth. {nama_ortu}

{pesan}

Wassalamu'alaikum Wr. Wb.
{lembaga}`,
        },
      ],
    });

    return NextResponse.json({
      message: "Seed berhasil",
      summary: {
        users: 3,
        ustaz: ustaz.length,
        kelas: kelas.length,
        santri: santriList.length,
        pengaturan: 13,
        pesanTemplate: 4,
      },
    });
  } catch (err) {
    console.error("[seed POST]", err);
    return NextResponse.json(
      { error: "Gagal seed database: " + String(err) },
      { status: 500 }
    );
  }
}
