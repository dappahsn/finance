# Finance Dashboard

Aplikasi dashboard keuangan dengan React, Vite, Express, dan MySQL. Saat ini backend menyediakan autentikasi sign up/sign in; data transaksi dan anggaran belum terhubung ke database.

## Persyaratan

- Node.js 20 atau lebih baru
- npm
- MySQL 8 atau kompatibel dan server MySQL sedang berjalan

## Menjalankan di Windows

1. Buka PowerShell di folder proyek.
2. Install dependency:

   ```powershell
   npm install
   ```

3. Buat database dan tabel akun. Jalankan file `server/schema.sql` melalui MySQL Workbench, atau dari PowerShell jika MySQL CLI tersedia:

   ```powershell
   Get-Content .\server\schema.sql | mysql -u root -p
   ```

4. Buat file `.env` dari template:

   ```powershell
   Copy-Item .env.example .env
   ```

5. Edit `.env` dan sesuaikan konfigurasi MySQL:

   ```env
   API_PORT=3001
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=password_mysql_anda
   DB_NAME=catat_in

   JWT_SECRET=ganti_dengan_random_secret_minimal_32_karakter
   ```

   `JWT_SECRET` wajib minimal 32 karakter. Gunakan nilai acak yang kuat dan jangan unggah `.env` ke GitHub.

6. Jalankan frontend dan API sekaligus:

   ```powershell
   npm run dev
   ```

7. Buka alamat Vite yang ditampilkan di terminal, biasanya <http://localhost:5173>.

## Perintah lain

Jalankan frontend saja:

```powershell
npm run dev:web
```

Jalankan API saja:

```powershell
npm run dev:api
```

Build frontend untuk produksi:

```powershell
npm run build
```

API berjalan pada port `3001` secara default. Vite meneruskan request `/api` ke API tersebut selama development. Endpoint `GET /api/health` dapat digunakan untuk mengecek API.

## Catatan keamanan

- Password akun disimpan sebagai bcrypt hash, bukan sebagai teks biasa.
- Token sesi disimpan dalam cookie `HttpOnly`.
- Database harus dapat diakses oleh user MySQL yang ditentukan di `.env`.
- Jangan commit file `.env` atau kredensial database ke repository.
