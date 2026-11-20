# GARPITX AI v2.0 (Powered by CrowLLM)

Aplikasi web asisten AI modern dengan tampilan **Glassmorphism**, transisi *spring* yang halus, animasi mengetik (*smooth typewriter*), dukungan **Markdown & Syntax Highlighting**, serta riwayat percakapan otomatis. Siap di-deploy langsung ke **Netlify**.

## Pembaruan UI & UX di Versi 2.0
- **Modern Glassmorphism & Ambient Orbs**: Latar belakang dinamis dengan efek *blur* berlapis dan palet warna premium.
- **Smooth Micro-Interactions**: Animasi *spring* saat pesan muncul, kartu *prompt* interaktif di layar pembuka, dan efek *typewriter* halus saat CrowLLM menjawab.
- **Markdown & Code Block Renderer**: Mendukung format tebal, daftar, serta blok kode berwarna otomatis.
- **Multi-Session History**: Menyimpan sesi obrolan secara otomatis di browser (`localStorage`) dan dapat diakses kembali lewat sidebar.
- **Mobile Drawer Navigation**: Responsif penuh di layar smartphone maupun desktop.

## Struktur Proyek
```text
garpitx-ai-v2/
├── netlify/
│   └── functions/
│       └── chat.js       # Backend Serverless Proxy untuk CrowLLM
├── public/
│   ├── index.html        # Antarmuka utama GARPITX AI v2
│   ├── style.css         # Desain Glassmorphic & animasi smooth
│   └── app.js            # Logika state, Markdown, & efek typewriter
├── .env.example          # Template variabel lingkungan
├── netlify.toml          # Konfigurasi routing & build Netlify
├── package.json          # Dependensi Node.js
└── README.md             # Panduan deploy
```

## Cara Deploy ke Netlify
1. Ekstrak `garpitx-ai-v2-netlify.zip` dan upload isi folder `garpitx-ai-v2` ke GitHub.
2. Buka [Netlify](https://app.netlify.com/) -> **Add new site** -> **Import an existing project** -> pilih repository Anda.
3. Masuk ke **Site configuration** -> **Environment variables**, tambahkan:
   - `CROWLLM_API_KEY`: Token API endpoint CrowLLM Anda.
   - `CROWLLM_API_URL`: URL endpoint CrowLLM (default: `https://api-inference.huggingface.co/models/crowllm/CrowLLM`).
4. Klik **Deploy site**.
