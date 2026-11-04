/* =========================================================
   script.js — Cendekia Bookstore
   Berisi JavaScript untuk semua halaman:
     - halaman login (index.html)
     - halaman dashboard (dashboard.html)
     - halaman stok (stok.html)
     - halaman pemesanan (checkout.html)
     - halaman tracking (tracking.html)

   Data diambil dari file data.js yang sudah disediakan dosen:
     - dataPengguna
     - dataKatalogBuku
     - dataTracking

   Materi yang dipakai: variabel, function, if-else, perulangan,
   manipulasi DOM (getElementById, innerHTML, createElement),
   event (click, keyup, change, submit), dan validasi form.
   ========================================================= */


/* ---------------------------------------------------------
   1. Fungsi bantu
   --------------------------------------------------------- */

// Mengubah angka menjadi format rupiah, contoh 180000 -> Rp 180.000
function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

// Mengambil angka dari harga berbentuk teks, contoh "Rp 180.000" -> 180000
function ambilAngka(harga) {
  var angka = "";
  for (var i = 0; i < harga.length; i++) {
    var huruf = harga.charAt(i);
    if (huruf >= "0" && huruf <= "9") {
      angka = angka + huruf;
    }
  }
  return Number(angka);
}

// Mengubah 2025-08-25 menjadi 25/08/2025
function formatTanggal(tanggal) {
  var bagian = tanggal.split("-");
  if (bagian.length < 3) {
    return tanggal;
  }
  return bagian[2] + "/" + bagian[1] + "/" + bagian[0];
}

// Mengambil tanggal hari ini dalam format 2026-11-03
function tanggalHariIni() {
  var sekarang = new Date();
  var bulan = sekarang.getMonth() + 1;
  var hari = sekarang.getDate();
  if (bulan < 10) { bulan = "0" + bulan; }
  if (hari < 10) { hari = "0" + hari; }
  return sekarang.getFullYear() + "-" + bulan + "-" + hari;
}

// Mengubah status pengiriman menjadi nilai progress bar
function nilaiProgress(status) {
  if (status == "Diproses") {
    return 25;
  } else if (status == "Dikirim") {
    return 50;
  } else if (status == "Dalam Perjalanan") {
    return 75;
  } else if (status == "Diterima") {
    return 100;
  }
  return 25;
}

// Menyimpan pesanan baru supaya bisa dicari di halaman tracking
function simpanPesanan(pesanan) {
  var data = localStorage.getItem("pesananBaru");
  var daftar = [];
  if (data != null) {
    daftar = JSON.parse(data);
  }
  daftar.push(pesanan);
  localStorage.setItem("pesananBaru", JSON.stringify(daftar));
}

// Mengambil semua pesanan: data tracking dari data.js ditambah pesanan baru
function semuaPesanan() {
  var hasil = [];

  // dataTracking berbentuk objek, jadi dibaca dengan perulangan for-in
  for (var kunci in dataTracking) {
    hasil.push(dataTracking[kunci]);
  }

  var data = localStorage.getItem("pesananBaru");
  if (data != null) {
    var tambahan = JSON.parse(data);
    for (var i = 0; i < tambahan.length; i++) {
      hasil.push(tambahan[i]);
    }
  }

  return hasil;
}

// Menghitung ongkos kirim sesuai ekspedisi yang dipilih
function hitungOngkir(ekspedisi) {
  if (ekspedisi == "JNE") {
    return 15000;
  } else if (ekspedisi == "Pos Indonesia") {
    return 18000;
  } else if (ekspedisi == "SiCepat") {
    return 13000;
  }
  return 0;
}


/* ---------------------------------------------------------
   2. Halaman login (index.html)
   --------------------------------------------------------- */
function halamanLogin() {
  var form = document.getElementById("formLogin");
  if (form == null) { return; }

  form.addEventListener("submit", function (event) {
    // preventDefault supaya halaman tidak dimuat ulang
    event.preventDefault();

    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var pesan = document.getElementById("pesanLogin");
    var cocok = null;

    // Validasi: kedua kolom tidak boleh kosong
    if (email == "" || password == "") {
      pesan.innerHTML = "Email dan password wajib diisi.";
      pesan.style.color = "#d64545";
      return;
    }

    // Mencari akun yang sesuai pada dataPengguna
    for (var i = 0; i < dataPengguna.length; i++) {
      if (dataPengguna[i].email == email && dataPengguna[i].password == password) {
        cocok = dataPengguna[i];
      }
    }

    if (cocok == null) {
      // alert box sesuai permintaan soal
      alert("Email/password yang anda masukkan salah");
      document.getElementById("password").value = "";
      return;
    }

    // Login berhasil, simpan nama lalu pindah ke dashboard
    localStorage.setItem("namaPengguna", cocok.nama);
    window.location.href = "dashboard.html";
  });

  // Tautan "Lihat password" untuk menampilkan / menyembunyikan password
  var tombolLihat = document.getElementById("lihatPassword");
  if (tombolLihat != null) {
    tombolLihat.addEventListener("click", function (event) {
      event.preventDefault();
      var kolom = document.getElementById("password");
      if (kolom.type == "password") {
        kolom.type = "text";
        tombolLihat.innerHTML = "Sembunyikan password";
      } else {
        kolom.type = "password";
        tombolLihat.innerHTML = "Lihat password";
      }
    });
  }
}


/* ---------------------------------------------------------
   3. Halaman dashboard (dashboard.html)
   --------------------------------------------------------- */
function halamanDashboard() {
  var sapaan = document.getElementById("sapaan");
  if (sapaan == null) { return; }

  var nama = localStorage.getItem("namaPengguna");
  if (nama == null) { nama = "Pengunjung"; }

  // Greeting berdasarkan waktu lokal
  var jam = new Date().getHours();
  var waktu = "";

  if (jam >= 4 && jam < 11) {
    waktu = "pagi";
  } else if (jam >= 11 && jam < 15) {
    waktu = "siang";
  } else if (jam >= 15 && jam < 19) {
    waktu = "sore";
  } else {
    waktu = "malam";
  }

  sapaan.innerHTML = "Selamat " + waktu + ", " + nama + "!";
}


/* ---------------------------------------------------------
   4. Halaman stok / katalog (stok.html)
   --------------------------------------------------------- */
var daftarBuku = [];   // data katalog yang sedang ditampilkan

function halamanStok() {
  var tabel = document.getElementById("isiTabelBuku");
  if (tabel == null) { return; }

  // Salin data dari data.js ke daftarBuku
  for (var i = 0; i < dataKatalogBuku.length; i++) {
    daftarBuku.push(dataKatalogBuku[i]);
  }

  tampilkanTabel();

  // Tombol tambah buku
  var tombolTambah = document.getElementById("tombolTambahBuku");
  tombolTambah.addEventListener("click", function () {
    tambahBuku();
  });

  // Kolom pencarian
  var cari = document.getElementById("cariBuku");
  cari.addEventListener("keyup", function () {
    tampilkanTabel();
  });
}

// Menampilkan semua buku ke dalam tabel
function tampilkanTabel() {
  var tabel = document.getElementById("isiTabelBuku");
  var cari = document.getElementById("cariBuku").value.toLowerCase();
  var jumlah = 0;

  tabel.innerHTML = "";

  for (var i = 0; i < daftarBuku.length; i++) {
    var buku = daftarBuku[i];
    var nama = buku.namaBarang.toLowerCase();
    var kode = buku.kodeBarang.toLowerCase();

    // Kalau kolom pencarian diisi, hanya yang cocok yang tampil
    if (cari != "" && nama.indexOf(cari) == -1 && kode.indexOf(cari) == -1) {
      continue;
    }

    // Membuat satu baris tabel dengan createElement
    var baris = document.createElement("tr");

    var selBuku = document.createElement("td");

    // Gambar sampul hanya ditampilkan kalau datanya punya cover
    if (buku.cover != "") {
      selBuku.innerHTML = "<img src='" + buku.cover + "' alt='Sampul " +
                          buku.namaBarang + "' class='sampul'>";
    }
    selBuku.innerHTML = selBuku.innerHTML +
                        "<strong>" + buku.namaBarang + "</strong><br><small>" +
                        buku.kodeBarang + "</small>";

    var selJenis = document.createElement("td");
    selJenis.innerHTML = buku.jenisBarang + "<br><small>Edisi " + buku.edisi + "</small>";

    var selHarga = document.createElement("td");
    selHarga.innerHTML = buku.harga;

    var selStok = document.createElement("td");
    selStok.innerHTML = buku.stok;

    var selStatus = document.createElement("td");
    if (buku.stok == 0) {
      selStatus.innerHTML = "<span class='badge badge-merah'>Habis</span>";
    } else if (buku.stok <= 50) {
      selStatus.innerHTML = "<span class='badge badge-kuning'>Menipis</span>";
    } else {
      selStatus.innerHTML = "<span class='badge badge-hijau'>Tersedia</span>";
    }

    baris.appendChild(selBuku);
    baris.appendChild(selJenis);
    baris.appendChild(selHarga);
    baris.appendChild(selStok);
    baris.appendChild(selStatus);

    tabel.appendChild(baris);
    jumlah++;
  }

  // Kalau hasil pencarian kosong
  if (jumlah == 0) {
    tabel.innerHTML = "<tr><td colspan='5' class='kosong'>Buku tidak ditemukan.</td></tr>";
  }
}

// Menambah baris stok baru melalui form
function tambahBuku() {
  var kode = document.getElementById("kodeBaru").value;
  var nama = document.getElementById("namaBaru").value;
  var jenis = document.getElementById("jenisBaru").value;
  var edisi = document.getElementById("edisiBaru").value;
  var harga = document.getElementById("hargaBaru").value;
  var stok = document.getElementById("stokBaru").value;
  var pesan = document.getElementById("pesanBuku");

  // Validasi form tambah buku
  if (kode == "" || nama == "" || harga == "" || stok == "") {
    pesan.innerHTML = "Kolom bertanda * wajib diisi.";
    pesan.style.color = "#d64545";
    return;
  }

  if (nama.length < 3) {
    pesan.innerHTML = "Nama barang minimal 3 karakter.";
    pesan.style.color = "#d64545";
    return;
  }

  if (harga <= 0 || stok < 0) {
    pesan.innerHTML = "Harga harus lebih dari 0 dan stok tidak boleh negatif.";
    pesan.style.color = "#d64545";
    return;
  }

  if (jenis == "") { jenis = "Buku Ajar"; }
  if (edisi == "") { edisi = "1"; }

  // Membuat objek buku baru dengan field yang sama seperti data.js
  var bukuBaru = {
    kodeBarang: kode.toUpperCase(),
    namaBarang: nama,
    jenisBarang: jenis,
    edisi: edisi,
    stok: Number(stok),
    harga: formatRupiah(Number(harga)),
    cover: ""
  };

  daftarBuku.push(bukuBaru);
  tampilkanTabel();

  // Kosongkan form dan tampilkan pesan berhasil
  document.getElementById("formTambahBuku").reset();
  pesan.innerHTML = "Buku \"" + nama + "\" berhasil ditambahkan.";
  pesan.style.color = "#1f9d55";
}


/* ---------------------------------------------------------
   5. Halaman pemesanan (checkout.html)
   --------------------------------------------------------- */

// Menampilkan pilihan buku pada dropdown
function isiPilihanBuku() {
  var pilih = document.getElementById("pilihBuku");
  if (pilih == null) { return; }

  for (var i = 0; i < dataKatalogBuku.length; i++) {
    var buku = dataKatalogBuku[i];
    if (buku.stok == 0) { continue; }

    var opsi = document.createElement("option");
    opsi.value = buku.kodeBarang;
    opsi.innerHTML = buku.namaBarang + " - " + buku.harga;
    pilih.appendChild(opsi);
  }
}

function halamanCheckout() {
  var pilih = document.getElementById("pilihBuku");
  if (pilih == null) { return; }

  isiPilihanBuku();

  // Kalau ada nama dari login, isi otomatis kolom nama pemesan
  var nama = localStorage.getItem("namaPengguna");
  if (nama != null) {
    document.getElementById("namaPemesan").value = nama;
  }

  document.getElementById("tombolTambah").addEventListener("click", function () {
    tambahKeKeranjang();
  });

  document.getElementById("formPesanan").addEventListener("submit", function (event) {
    event.preventDefault();
    kirimPesanan();
  });

  // Tampilkan keranjang kosong pertama kali halaman dibuka
  tampilkanKeranjang();
}

// Daftar buku yang dipesan disimpan dalam array
var keranjang = [];

function tambahKeKeranjang() {
  var kode = document.getElementById("pilihBuku").value;
  var jumlah = Number(document.getElementById("jumlahBeli").value);
  var pesan = document.getElementById("pesanKeranjang");

  if (kode == "") {
    pesan.innerHTML = "Pilih buku terlebih dahulu.";
    pesan.style.color = "#d64545";
    return;
  }

  if (jumlah < 1) {
    pesan.innerHTML = "Jumlah buku minimal 1.";
    pesan.style.color = "#d64545";
    return;
  }

  // Cari buku yang dipilih pada dataKatalogBuku
  var buku = null;
  for (var i = 0; i < dataKatalogBuku.length; i++) {
    if (dataKatalogBuku[i].kodeBarang == kode) {
      buku = dataKatalogBuku[i];
    }
  }

  if (jumlah > buku.stok) {
    alert("Stok buku hanya " + buku.stok + " buah.");
    return;
  }

  var hargaAngka = ambilAngka(buku.harga);

  // Kalau buku sudah ada di keranjang, jumlahnya ditambah
  var sudahAda = false;
  for (var j = 0; j < keranjang.length; j++) {
    if (keranjang[j].kode == kode) {
      keranjang[j].jumlah = keranjang[j].jumlah + jumlah;
      sudahAda = true;
    }
  }

  if (sudahAda == false) {
    keranjang.push({
      kode: buku.kodeBarang,
      nama: buku.namaBarang,
      harga: hargaAngka,
      jumlah: jumlah
    });
  }

  pesan.innerHTML = buku.namaBarang + " ditambahkan ke keranjang.";
  pesan.style.color = "#1f9d55";
  tampilkanKeranjang();
}

// Menampilkan isi keranjang dan menghitung totalnya
function tampilkanKeranjang() {
  var tabel = document.getElementById("isiKeranjang");
  tabel.innerHTML = "";

  if (keranjang.length == 0) {
    tabel.innerHTML = "<tr><td colspan='5' class='kosong'>Belum ada buku yang dipesan.</td></tr>";
    document.getElementById("subtotal").innerHTML = "Rp 0";
    document.getElementById("ongkir").innerHTML = "Rp 0";
    document.getElementById("totalBayar").innerHTML = "Rp 0";
    return;
  }

  var subtotal = 0;

  for (var i = 0; i < keranjang.length; i++) {
    var item = keranjang[i];
    var jumlahHarga = item.harga * item.jumlah;
    subtotal = subtotal + jumlahHarga;

    var baris = document.createElement("tr");

    var selNama = document.createElement("td");
    selNama.innerHTML = item.nama;

    var selHarga = document.createElement("td");
    selHarga.innerHTML = formatRupiah(item.harga);

    var selJumlah = document.createElement("td");
    selJumlah.innerHTML = item.jumlah;

    var selTotal = document.createElement("td");
    selTotal.innerHTML = formatRupiah(jumlahHarga);

    var selAksi = document.createElement("td");
    var tombolHapus = document.createElement("button");
    tombolHapus.type = "button";
    tombolHapus.className = "tombol tombol-kecil tombol-merah";
    tombolHapus.innerHTML = "Hapus";
    tombolHapus.setAttribute("data-kode", item.kode);
    tombolHapus.addEventListener("click", function () {
      hapusItem(this.getAttribute("data-kode"));
    });
    selAksi.appendChild(tombolHapus);

    baris.appendChild(selNama);
    baris.appendChild(selHarga);
    baris.appendChild(selJumlah);
    baris.appendChild(selTotal);
    baris.appendChild(selAksi);

    tabel.appendChild(baris);
  }

  // Ongkir diambil dari ekspedisi yang dipilih
  var ekspedisi = document.getElementById("pilihEkspedisi").value;
  var ongkir = 0;
  if (subtotal > 0) {
    ongkir = hitungOngkir(ekspedisi);
  }

  // Belanja di atas Rp200.000 gratis ongkir
  if (subtotal >= 200000) {
    ongkir = 0;
  }

  document.getElementById("subtotal").innerHTML = formatRupiah(subtotal);
  document.getElementById("ongkir").innerHTML = formatRupiah(ongkir);
  document.getElementById("totalBayar").innerHTML = formatRupiah(subtotal + ongkir);
}

function hapusItem(kode) {
  var sisa = [];
  for (var i = 0; i < keranjang.length; i++) {
    if (keranjang[i].kode != kode) {
      sisa.push(keranjang[i]);
    }
  }
  keranjang = sisa;
  tampilkanKeranjang();
}

// Mengirim pesanan setelah form validasi
function kirimPesanan() {
  var pesan = document.getElementById("pesanPesanan");

  if (keranjang.length == 0) {
    alert("Keranjang masih kosong, pilih buku terlebih dahulu.");
    return;
  }

  var nama = document.getElementById("namaPemesan").value;
  var email = document.getElementById("emailPemesan").value;
  var telepon = document.getElementById("teleponPemesan").value;
  var alamat = document.getElementById("alamatPemesan").value;
  var metode = document.querySelector("input[name='metode']:checked");

  // Validasi form pemesan
  if (nama == "" || email == "" || telepon == "" || alamat == "") {
    pesan.innerHTML = "Data pemesan belum lengkap.";
    pesan.style.color = "#d64545";
    return;
  }

  if (email.indexOf("@") == -1 || email.indexOf(".") == -1) {
    pesan.innerHTML = "Format email belum benar, contoh: nama@mail.com";
    pesan.style.color = "#d64545";
    return;
  }

  if (telepon.length < 10) {
    pesan.innerHTML = "Nomor telepon minimal 10 angka.";
    pesan.style.color = "#d64545";
    return;
  }

  if (alamat.length < 10) {
    pesan.innerHTML = "Alamat terlalu singkat, tulis alamat lengkap.";
    pesan.style.color = "#d64545";
    return;
  }

  // Nomor DO dibuat dari tahun berjalan + nomor urut,
  // mengikuti bentuk nomor pada dataTracking (contoh: 20230012)
  var nomor = semuaPesanan().length + 1;
  var urut = String(nomor);
  while (urut.length < 4) {
    urut = "0" + urut;
  }
  var nomorDO = new Date().getFullYear() + urut;

  var subtotal = 0;
  var jumlahItem = 0;
  for (var i = 0; i < keranjang.length; i++) {
    subtotal = subtotal + (keranjang[i].harga * keranjang[i].jumlah);
    jumlahItem = jumlahItem + keranjang[i].jumlah;
  }

  var ekspedisi = document.getElementById("pilihEkspedisi").value;
  var ongkir = hitungOngkir(ekspedisi);
  if (subtotal >= 200000) {
    ongkir = 0;
  }

  var pesananBaru = {
    nomorDO: nomorDO,
    nama: nama,
    alamat: alamat,
    status: "Diproses",
    ekspedisi: ekspedisi,
    tanggalKirim: tanggalHariIni(),
    paket: "Paket Buku (" + jumlahItem + " item)",
    total: formatRupiah(subtotal + ongkir),
    perjalanan: [
      {
        waktu: tanggalHariIni() + " 08:00:00",
        keterangan: "Pesanan diterima dan sedang dikemas"
      }
    ]
  };

  simpanPesanan(pesananBaru);

  // Tampilkan nomor DO lewat alert
  alert("Pesanan berhasil dibuat.\nNomor Delivery Order: " + nomorDO +
        "\nTotal bayar: " + formatRupiah(subtotal + ongkir) +
        "\n\nSimpan nomor ini untuk melacak pengiriman.");

  // Kosongkan keranjang dan form
  keranjang = [];
  tampilkanKeranjang();
  document.getElementById("formPesanan").reset();
  pesan.innerHTML = "";
}


/* ---------------------------------------------------------
   6. Halaman tracking (tracking.html)
   --------------------------------------------------------- */
function halamanTracking() {
  var tombol = document.getElementById("tombolCari");
  if (tombol == null) { return; }

  tombol.addEventListener("click", function () {
    cariPesanan();
  });

  // Supaya bisa tekan Enter pada kolom nomor DO
  var form = document.getElementById("formTracking");
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    cariPesanan();
  });
}

function cariPesanan() {
  var nomor = document.getElementById("nomorDO").value;
  var hasil = document.getElementById("hasilTracking");
  var pesan = document.getElementById("pesanTracking");

  hasil.style.display = "none";
  pesan.innerHTML = "";

  if (nomor == "") {
    pesan.innerHTML = "Nomor Delivery Order wajib diisi.";
    pesan.style.color = "#d64545";
    return;
  }

  // Mencari pesanan: cek dataTracking dulu, lalu pesanan baru
  var pesanan = null;

  if (dataTracking[nomor] != undefined) {
    pesanan = dataTracking[nomor];
  } else {
    var daftar = semuaPesanan();
    for (var i = 0; i < daftar.length; i++) {
      if (daftar[i].nomorDO == nomor) {
        pesanan = daftar[i];
      }
    }
  }

  if (pesanan == null) {
    alert("Nomor Delivery Order " + nomor + " tidak ditemukan.");
    return;
  }

  var progress = nilaiProgress(pesanan.status);

  document.getElementById("namaPemesan").innerHTML = pesanan.nama;
  document.getElementById("statusKirim").innerHTML = pesanan.status;
  document.getElementById("ekspedisi").innerHTML = pesanan.ekspedisi;
  document.getElementById("tanggalKirim").innerHTML = formatTanggal(pesanan.tanggalKirim);
  document.getElementById("jenisPaket").innerHTML = pesanan.paket;
  document.getElementById("totalBayar").innerHTML = pesanan.total;

  // Kalau pesanan baru punya alamat, tampilkan pada baris alamat
  var barisAlamat = document.getElementById("barisAlamat");
  if (barisAlamat != null) {
    if (pesanan.alamat != undefined && pesanan.alamat != "") {
      document.getElementById("alamatKirim").innerHTML = pesanan.alamat;
      barisAlamat.style.display = "block";
    } else {
      barisAlamat.style.display = "none";
    }
  }

  // Progress bar: lebarnya diatur dengan inline CSS dari JavaScript
  document.getElementById("progressBar").style.width = progress + "%";
  document.getElementById("progressBar").innerHTML = progress + "%";

  // Daftar perjalanan paket diambil dari array perjalanan pada data
  var daftarTahap = document.getElementById("daftarTahap");
  daftarTahap.innerHTML = "";

  for (var k = 0; k < pesanan.perjalanan.length; k++) {
    var langkah = pesanan.perjalanan[k];
    var li = document.createElement("li");

    // Langkah terakhir dianggap posisi paket sekarang
    if (k == pesanan.perjalanan.length - 1) {
      li.className = "aktif";
    } else {
      li.className = "selesai";
    }

    li.innerHTML = "<strong>" + langkah.waktu + "</strong><br>" + langkah.keterangan;

    daftarTahap.appendChild(li);
  }

  hasil.style.display = "block";
}


/* ---------------------------------------------------------
   7. Menjalankan fungsi sesuai halaman yang dibuka
   --------------------------------------------------------- */
function jalankanAplikasi() {
  halamanLogin();
  halamanDashboard();
  halamanStok();
  halamanCheckout();
  halamanTracking();
}

// DOMContentLoaded dipakai supaya semua elemen HTML sudah siap
document.addEventListener("DOMContentLoaded", jalankanAplikasi);