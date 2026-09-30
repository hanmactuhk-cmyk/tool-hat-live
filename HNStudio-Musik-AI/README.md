# HNStudio Musik AI - Phần Mềm Hát LIVE Chuyên Nghiệp Trên Máy Tính

**Tác giả:** Hoài Nguyễn Studio  
**Zalo hỗ trợ:** 0965.043.000  
**Hệ điều hành mục tiêu:** Windows 10 / Windows 11 (64-bit)  
**Công nghệ:** C++ (C++17), JUCE Framework 7.0.12, CMake 3.22+, VST3 Hosting Native

---

## 1. GIỚI THIỆU
**HNStudio Musik AI** là phần mềm desktop chuyên biệt cho nhu cầu hát LIVE, livestream, thu âm giọng hát chuyên nghiệp với độ trễ siêu thấp (Ultra Low Latency). Phần mềm được thiết kế theo chuẩn phòng thu hiện đại, tích hợp trọn bộ hiệu ứng xử lý vocal chuyên sâu và hỗ trợ nạp VST3 Plugin trực tiếp (Auto-Tune, FabFilter, Waves, iZotope...).

### Cấu trúc Routing Audio 2-Bus Độc Lập Chuẩn Phòng Thu:
```text
MIC BUS:
MIC INPUT ──► Noise Gate ──► Compressor ──► 13-Band EQ ──► De-Esser ──► Reverb ──► VST3 INSERT RACK ──► MIC MASTER
                                                                                                               │
MUSIC BUS:                                                                                                     │
BEAT FILE / SFX ──────────────────────────────────────────► MUSIC VOLUME ─────────────────────► MUSIC MASTER   │
                                                                                                       │       │
FINAL MASTER:                                                                                          ▼       ▼
                                                                                                 FINAL MASTER LIMITER
                                                                                                       │
                                                                                                       ▼
                                                                                                 AUDIO OUTPUT
```
* **TUYỆT ĐỐI không cho MUSIC đi qua chuỗi MIC:** Nhạc nền và SFX chạy trên bus riêng biệt, giữ nguyên độ trong trẻo của beat.
* **Tín hiệu MIC đi qua từng hiệu ứng thật:** Noise Gate, Compressor, EQ 13 band, De-Esser, Reverb, rồi vào chuỗi VST3 theo đúng thứ tự.
* **Tắt Stereo Mix vẫn nghe bình thường:** Âm thanh phần mềm xuất trực tiếp qua thiết bị Output đã chọn.

---

## 2. CÁCH BUILD BẰNG GITHUB ACTIONS (KHUYẾN NGHỊ - KHÔNG CẦN CÀI ĐẶT CÔNG CỤ TRÊN MÁY)
Dự án đã được cấu hình sẵn file workflow `.github/workflows/main.yml`. Bạn chỉ cần:
1. Đăng nhập vào [GitHub](https://github.com) và tạo một Repository mới (ví dụ: `HNStudio-Musik-AI`).
2. Giải nén thư mục dự án và đẩy toàn bộ code lên repository của bạn:
   ```bash
   git init
   git branch -M main
   git remote add origin https://github.com/TEN_USER_CUA_BAN/HNStudio-Musik-AI.git
   git add .
   git commit -m "HNStudio Musik AI by Hoai Nguyen Studio"
   git push -u origin main
   ```
3. Chuyển sang tab **Actions** trên GitHub:
   - Quy trình **Build Windows x64 Release** sẽ tự động chạy trên máy chủ Windows Server 2022 của GitHub.
   - Quá trình tự động kéo JUCE 7.0.12, cấu hình MSVC x64, biên dịch Release và đóng gói `HNStudioMusikAI.exe`.
4. Khi quá trình hoàn tất (khoảng 3-5 phút), vào mục **Artifacts** tải file **`HNStudio-Musik-AI-Windows-x64.zip`** về giải nén và sử dụng ngay!

---

## 3. CÁCH BUILD TRÊN MÁY WINDOWS CỤC BỘ (LOCAL BUILD)
Nếu bạn muốn tự biên dịch trên máy tính của mình:
### Yêu cầu:
- Windows 10/11 64-bit
- Visual Studio 2022 (cài đặt workload *Desktop development with C++*)
- CMake 3.22 trở lên

### Các bước thực hiện:
```cmd
# 1. Mở thư mục dự án trong Command Prompt (CMD) hoặc PowerShell
cd HNStudio-Musik-AI

# 2. Cấu hình CMake (CMake sẽ tự động tải JUCE qua FetchContent)
cmake -B build -G "Visual Studio 17 2022" -A x64

# 3. Biên dịch Release
cmake --build build --config Release --target HNStudioMusikAI

# 4. File chạy nằm tại:
# build/bin/Release/HNStudioMusikAI.exe hoặc build/HNStudioMusikAI_artefacts/Release/
```

---

## 4. HƯỚNG DẪN CÀI ĐẶT & SỬ DỤNG PHẦN MỀM

### Bước 1: Cấu hình Thiết Bị (AUDIO I/O)
1. Cắm Microphone (USB Mic hoặc Soundcard / Audio Interface Focusrite, Presonus, Yamaha, Behringer...) và tai nghe.
2. Mở phần mềm, nhấn vào nút **[AUDIO I/O]** trên thanh trên cùng.
3. Trong cửa sổ Audio Settings:
   - **Audio Device Type:** Chọn **Windows Audio (WASAPI Exclusive)** hoặc **ASIO** (nếu dùng soundcard).
   - **Input:** Chọn Micro thu âm của bạn.
   - **Output:** Chọn Tai nghe hoặc Loa kiểm âm.
   - **Sample Rate:** Chọn 44100 Hz hoặc 48000 Hz.
   - **Buffer Size:** Chọn 256 hoặc 512 samples để đảm bảo độ trễ thấp và không bị giật rè.
4. Bật nút **[● LIVE ON]** (nút chuyển sang màu xanh neon sáng). Khi bạn nói vào mic, vạch âm lượng MIC và đồ thị sóng REALTIME sẽ dao động ngay lập tức.

### Bước 2: Tinh chỉnh Bộ Xử Lý MIC Chuyên Sâu
- **Noise Gate (Lọc tạp âm):** Nhấn nút `Chỉnh` cạnh `GATE` -> Điều chỉnh `Threshold` (thường để -45 dB đến -40 dB) để ngắt sạch tiếng ồn quạt máy và tiếng thở khi không hát.
- **Compressor (Nén giọng):** Nhấn `Chỉnh` cạnh `COMP` -> `Threshold` (-18 dB), `Ratio` (3.5:1), `Makeup Gain` (+3 dB) giúp giọng dày dặn, đều đặn, không bị hụt hơi ở nốt trầm và không bị xé tiếng ở nốt cao.
- **Parametric EQ 13 Band:** Nhấn `Chỉnh` cạnh `EQ` -> Có thể can thiệp chính xác từng tần số:
  - 80Hz - 100Hz: Cắt bớt nếu bị ù mic.
  - 200Hz - 500Hz: Tăng để giọng ấm, trầm ấm.
  - 2kHz - 5kHz: Tăng nhẹ để giọng rõ chữ, bắt mic.
  - 8kHz - 15kHz: Tăng dải cao để có độ bay bổng, sáng mượt ("Air").
- **De-Esser:** Cắt giảm những tiếng chói gắt sibilance (xì, xè, ch, s) ở vùng 6.5 kHz.
- **Reverb (Vang phòng thu):** Chọn Preset `Vocal`, `Plate` hoặc `Hall`. Điều chỉnh `Wet`, `Room Size` và `Pre Delay` theo gu bài hát.
- **Master Limiter:** Bảo vệ âm thanh đầu ra không bao giờ bị vỡ rè hoặc clipping digital quá 0.0 dB.

### Bước 3: Nạp Auto-Tune & VST3
1. Nhấn nút **[+ ADD VST3]** hoặc **[VST RACK]**.
2. Nhấn nút `+ THÊM VST3 PLUGIN (.vst3)`.
3. Trỏ đến thư mục chứa plugin VST3 trên máy tính của bạn (đường dẫn mặc định của Windows: `C:\Program Files\Common Files\VST3\`).
4. Bạn có thể nạp:
   - **Antares Auto-Tune Pro / Artist**
   - **Waves Tune Real-Time**
   - **FabFilter Pro-Q3, Pro-C2**
   - **iZotope Nectar, Ozone**
   - **Valhalla VintageVerb**
5. Trong danh sách VST, nhấn **[Mở VST]** để bung giao diện gốc của plugin.
6. Sử dụng các nút **[▲] [▼]** để di chuyển thứ tự plugin, nút **[Bypass]** để bật/tắt tạm thời từng VST.

### Bước 4: Chức Năng AUTO KEY & Tone Nhạc
- Chọn thủ công Key bài hát: C, C#, D, D#, E, F, F#, G, G#, A, A#, B và Scale (Major / Minor).
- Bật tính năng **[AUTO KEY DETECT]**:
  - Thuật toán phân tích phổ âm Chroma 12 nốt và tương quan Krumhansl-Schmuckler sẽ liên tục ước lượng tone nốt bài hát và hiển thị độ tin cậy (Confidence).
  - Tự động đồng bộ Key và Scale vào VST Auto-Tune nếu plugin hỗ trợ điều khiển parameter từ host.

### Bước 5: Mở Nhạc Nền Beat & SFX
- Nhấn **[MỞ NHẠC BEAT]** để chọn bài hát MP3, WAV, FLAC, OGG.
- Nhấn Play / Pause / Stop, kéo thanh Timeline để tua nhạc.
- Nút SFX vui nhộn: 😂 Cười, 👏 Vỗ tay, 🎉 Hò reo, 📢 Còi hơi (âm lượng độc lập, không làm ảnh hưởng chuỗi mic).

### Bước 6: Ghi Âm & Quản Lý Project
- **Ghi âm trực tiếp:** Nhấn nút **[● RECORD]**. Phần mềm tự động ghi âm luồng Master đạt chuẩn 24-bit PCM WAV vào thư mục `HNStudio_Recordings` với tên file chuẩn xác: `HNStudio_Record_YYYY-MM-DD_HH-MM-SS.wav`.
- **Lưu Project (.hnstudio):** Nhấn **[SAVE]** để lưu toàn bộ volume, EQ, Reverb, Compressor, Auto-Tune và danh sách plugin. Khi mở lại bằng nút **[OPEN]**, mọi cấu hình được khôi phục 100%.

---

## 5. HỖ TRỢ KỸ THUẬT & TƯ VẤN
Mọi thắc mắc về cài đặt, tối ưu hóa âm thanh hoặc hỗ trợ tích hợp VST3, xin vui lòng liên hệ:
- **Tác giả:** Hoài Nguyễn Studio
- **Zalo:** 0965.043.000
- **Email:** hoaihkht91@gmail.com
