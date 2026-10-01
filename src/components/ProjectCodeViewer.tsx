import React, { useState } from 'react';
import { X, Copy, Check, Download, Github, Code, Terminal, FileText, Monitor, Cpu, Sparkles } from 'lucide-react';
import { generateAndDownloadProjectZip } from '../utils/projectZipBuilder';

interface ProjectCodeViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectCodeViewer: React.FC<ProjectCodeViewerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'electron' | 'electron_workflow' | 'cpp_workflow' | 'cmake'>('electron');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const electronWorkflowYaml = `name: Build HNStudio Musik AI (Electron Windows EXE)

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build-electron-windows:
    name: Build Electron Windows EXE
    runs-on: windows-2022

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci || npm install

      - name: Build Web Application
        run: npm run build

      - name: Build Windows Executable (.exe Installer & Portable)
        run: npx --yes electron-builder --win --x64
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Upload Windows Setup Artifact
        uses: actions/upload-artifact@v4
        with:
          name: HNStudio-Musik-AI-Windows-Installer
          path: |
            dist-electron/*.exe
          retention-days: 30
          if-no-files-found: error
`;

  const cppWorkflowYaml = `name: Build HNStudio Musik AI Windows x64

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build-windows:
    name: Build Windows x64 Release
    runs-on: windows-2022

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Configure CMake
        shell: pwsh
        run: |
          $sourceDir = "."
          if (Test-Path "HNStudio-Musik-AI/CMakeLists.txt") {
              if (-not (Test-Path "CMakeLists.txt")) {
                  $sourceDir = "HNStudio-Musik-AI"
              }
          }
          Write-Host "Configuring CMake with source dir: $sourceDir"
          cmake -B build -S $sourceDir -G "Visual Studio 17 2022" -A x64

      - name: Build HNStudio Musik AI (Release)
        run: |
          cmake --build build --config Release --target HNStudioMusikAI --parallel

      - name: Prepare Release Package
        shell: pwsh
        run: |
          New-Item -ItemType Directory -Force -Path dist\\HNStudio-Musik-AI
          $exePath = Get-ChildItem -Path build -Filter "*HNStudio*.exe" -Recurse | Select-Object -First 1
          if (-not $exePath) {
              $exePath = Get-ChildItem -Path build -Filter "*.exe" -Recurse | Where-Object { $_.FullName -notmatch "CMakeFiles|CompilerId" } | Select-Object -First 1
          }
          if ($exePath) {
              Write-Host "Found executable at: $($exePath.FullName)"
              Copy-Item -Path $exePath.FullName -Destination "dist\\HNStudio-Musik-AI\\"
              Copy-Item -Path $exePath.FullName -Destination "dist\\HNStudio-Musik-AI\\HNStudioMusikAI.exe"
          } else {
              Write-Error "Executable not found in build directory!"
              exit 1
          }
          if (Test-Path "README.md") {
              Copy-Item -Path "README.md" -Destination dist\\HNStudio-Musik-AI\\
          } elseif (Test-Path "HNStudio-Musik-AI/README.md") {
              Copy-Item -Path "HNStudio-Musik-AI/README.md" -Destination dist\\HNStudio-Musik-AI\\
          }
          New-Item -ItemType Directory -Force -Path dist\\HNStudio-Musik-AI\\Recordings
          New-Item -ItemType Directory -Force -Path dist\\HNStudio-Musik-AI\\Projects
          Compress-Archive -Path dist\\HNStudio-Musik-AI\\* -DestinationPath HNStudio-Musik-AI-Windows-x64.zip -Force

      - name: Upload Build Artifact
        uses: actions/upload-artifact@v4
        with:
          name: HNStudio-Musik-AI-Windows-x64
          path: HNStudio-Musik-AI-Windows-x64.zip
          retention-days: 30
          if-no-files-found: error
`;

  const cmakeLists = `cmake_minimum_required(VERSION 3.22)
project(HNStudioMusikAI VERSION 1.0.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

if (MSVC)
    add_compile_options(/MP /utf-8 /W3)
    set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif()

include(FetchContent)
FetchContent_Declare(
    JUCE
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG        7.0.12
    GIT_SHALLOW    TRUE
)
FetchContent_MakeAvailable(JUCE)

juce_add_gui_app(HNStudioMusikAI
    PRODUCT_NAME "HNStudio Musik AI"
    COMPANY_NAME "Hoai Nguyen Studio"
    BUNDLE_IDENTIFIER "com.hoainguyen.hnstudiomusikai"
    VERSION "1.0.0"
)
`;

  const gitElectronCommands = `# 1. Khởi tạo Git trong thư mục dự án
git init
git branch -M main

# 2. Thêm remote tới GitHub repo của bạn
git remote add origin https://github.com/YOUR_USERNAME/HNStudio-Musik-AI.git

# 3. Commit và đẩy toàn bộ mã nguồn lên
git add .
git commit -m "HNStudio Musik AI Electron Desktop App"
git push -u origin main --force`;

  let currentContent = '';
  if (activeTab === 'electron_workflow') currentContent = electronWorkflowYaml;
  else if (activeTab === 'cpp_workflow') currentContent = cppWorkflowYaml;
  else if (activeTab === 'cmake') currentContent = cmakeLists;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0e1422] rounded-2xl border border-[#25334e] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#141b2d] border-b border-[#25334e] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Monitor className="w-5 h-5 text-[#00f0ff]" />
            <div>
              <h3 className="text-sm font-bold tracking-wider text-[#f8fafc] uppercase flex items-center space-x-2">
                <span>XUẤT PHẦN MỀM WINDOWS (.EXE)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30 font-semibold">
                  Electron Desktop App
                </span>
              </h3>
              <p className="text-[11px] text-[#94a3b8]">
                Hoài Nguyễn Studio | Zalo: 0965.043.000
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => generateAndDownloadProjectZip()}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#00f0ff] to-[#a855f7] text-[#0a0d14] flex items-center space-x-1.5 shadow-md cursor-pointer hover:shadow-[0_0_15px_rgba(0,240,255,0.5)] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>TẢI ZIP DỰ ÁN</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e2942] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2.5 bg-[#0a0d14] border-b border-[#1e293b] flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setActiveTab('electron')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'electron'
                ? 'bg-[#00f0ff] text-[#0a0d14] shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ Electron App (Khuyên dùng - 100-150MB)</span>
          </button>

          <button
            onClick={() => setActiveTab('electron_workflow')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'electron_workflow'
                ? 'bg-[#38bdf8] text-[#0a0d14]'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>.github/workflows/electron-build.yml</span>
          </button>

          <button
            onClick={() => setActiveTab('cpp_workflow')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'cpp_workflow'
                ? 'bg-[#a855f7] text-[#0a0d14]'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Native C++ (.exe 3MB)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-[#f8fafc] bg-[#07090f]">
          {activeTab === 'electron' ? (
            <div className="space-y-5 font-sans">
              <div className="bg-gradient-to-r from-[#00f0ff]/10 to-[#a855f7]/10 p-4 rounded-xl border border-[#00f0ff]/30">
                <h4 className="text-sm font-bold text-[#00f0ff] mb-1 flex items-center space-x-2">
                  <span>⚡ Đóng Gói Electron Windows EXE (Không Cần Cài C++):</span>
                </h4>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Đóng gói nguyên vẹn <strong className="text-white">toàn bộ giao diện Studio Web đẹp mắt này</strong> + hệ thống Web Audio DSP + Soundboard + Beat Player thành bộ cài đặt Windows (<strong className="text-[#00ff88]">HNStudio-Musik-AI-Setup.exe</strong> dung lượng ~100MB - 120MB) hoạt động độc lập trên mọi máy tính Windows!
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </span>
                  <div>
                    <h5 className="font-bold text-sm text-[#f8fafc]">Tải file dự án zip hoặc kéo code về</h5>
                    <p className="text-xs text-[#94a3b8]">Nhấn nút <strong className="text-[#00f0ff]">TẢI ZIP DỰ ÁN</strong> ở góc trên. Dự án đã có sẵn cấu hình Electron và GitHub Actions.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </span>
                  <div className="flex-1">
                    <h5 className="font-bold text-sm text-[#f8fafc]">Đẩy lên GitHub để GitHub Actions tự động build file .exe</h5>
                    <p className="text-xs text-[#94a3b8] mb-2">Đẩy code lên GitHub repository:</p>
                    <div className="relative bg-[#0a0d14] p-3 rounded-lg border border-[#1e293b] font-mono text-[11px] text-[#38bdf8]">
                      <button
                        onClick={() => copyToClipboard(gitElectronCommands)}
                        className="absolute top-2 right-2 px-2 py-1 rounded bg-[#1e293b] text-[#94a3b8] hover:text-white flex items-center space-x-1"
                      >
                        {copied ? <Check className="w-3 h-3 text-[#00ff88]" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Đã copy' : 'Copy'}</span>
                      </button>
                      <pre className="whitespace-pre-wrap">{gitElectronCommands}</pre>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </span>
                  <div>
                    <h5 className="font-bold text-sm text-[#f8fafc]">Tải bộ cài đặt Windows Setup .exe từ Artifacts</h5>
                    <p className="text-xs text-[#94a3b8] leading-relaxed">
                      Trên GitHub, vào tab <strong className="text-[#38bdf8]">Actions</strong> &rarr; Chọn luồng <strong className="text-[#00ff88]">Build Electron Windows EXE</strong>. Khi hoàn thành, vào mục <strong className="text-[#f8fafc]">Artifacts</strong> tải file <strong className="text-[#00f0ff]">HNStudio-Musik-AI-Windows-Installer</strong> về máy, nhấp đúp để cài đặt và sử dụng ngay lập tức!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => copyToClipboard(currentContent)}
                className="absolute top-2 right-2 px-2.5 py-1.5 rounded bg-[#161f30] text-[#94a3b8] hover:text-white flex items-center space-x-1.5 border border-[#25334e] cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-[#00ff88]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Đã copy' : 'Copy mã'}</span>
              </button>
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-[#94a3b8]">
                {currentContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
