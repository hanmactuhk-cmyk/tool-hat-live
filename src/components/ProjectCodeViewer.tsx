import React, { useState } from 'react';
import { X, Copy, Check, Download, Github, Code, Terminal, FileText } from 'lucide-react';
import { generateAndDownloadProjectZip } from '../utils/projectZipBuilder';

interface ProjectCodeViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectCodeViewer: React.FC<ProjectCodeViewerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'cmake' | 'engine' | 'vstrack' | 'instructions'>('instructions');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const workflowYaml = `name: Build HNStudio Musik AI Windows x64

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
          $exePath = Get-ChildItem -Path build -Filter "HNStudioMusikAI.exe" -Recurse | Select-Object -First 1
          if ($exePath) {
              Copy-Item -Path $exePath.FullName -Destination dist\\HNStudio-Musik-AI\\
          } else {
              Write-Error "HNStudioMusikAI.exe not found!"
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
          retention-days: 30`;

  const cmakeLists = `cmake_minimum_required(VERSION 3.22)
project(HNStudioMusikAI VERSION 1.0.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if (MSVC)
    add_compile_options(/MP /utf-8 /W3)
endif()

# Fetch JUCE automatically via FetchContent
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
    VERSION 1.0.0
    COMPANY_NAME "Hoai Nguyen Studio"
)

target_sources(HNStudioMusikAI PRIVATE
    Source/Main.cpp
    Source/MainComponent.cpp
    Source/AudioEngine.cpp
    Source/DspChain.cpp
    Source/VstRack.cpp
    Source/AutoKeyDetector.cpp
    Source/MusicPlayer.cpp
    Source/ProjectManager.cpp
    Source/Popups.cpp
)

target_compile_definitions(HNStudioMusikAI PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_PLUGINHOST_VST3=1
    JUCE_PLUGINHOST_AU=0
    JUCE_CUSTOM_VST3_SDK=0
    JUCE_DISPLAY_SPLASH_SCREEN=0
)

target_link_libraries(HNStudioMusikAI PRIVATE
    juce::juce_audio_basics
    juce::juce_audio_devices
    juce::juce_audio_formats
    juce::juce_audio_processors
    juce::juce_audio_utils
    juce::juce_core
    juce::juce_dsp
    juce::juce_gui_basics
    juce::juce_gui_extra
)`;

  const gitCommands = `# 1. Khởi tạo Git trong thư mục dự án
git init
git branch -M main

# 2. Thêm remote tới GitHub repo của bạn
git remote add origin https://github.com/YOUR_USERNAME/HNStudio-Musik-AI.git

# 3. Commit và đẩy toàn bộ mã nguồn lên
git add .
git commit -m "HNStudio Musik AI - Hoai Nguyen Studio"
git push -u origin main`;

  let currentContent = '';
  if (activeTab === 'workflow') currentContent = workflowYaml;
  else if (activeTab === 'cmake') currentContent = cmakeLists;
  else if (activeTab === 'engine') currentContent = '// File: Source/AudioEngine.cpp\n// Xem toàn bộ trong gói ZIP tải về!';
  else if (activeTab === 'vstrack') currentContent = '// File: Source/VstRack.cpp (VST3 Host Engine)\n// Hỗ trợ nạp VST3 Auto-Tune, FabFilter, Waves, iZotope';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0e1422] rounded-2xl border border-[#25334e] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#141b2d] border-b border-[#25334e] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Github className="w-5 h-5 text-[#38bdf8]" />
            <div>
              <h3 className="text-sm font-bold tracking-wider text-[#f8fafc] uppercase">
                DỰ ÁN WINDOWS C++ JUCE & GITHUB ACTIONS
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
            onClick={() => setActiveTab('instructions')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'instructions'
                ? 'bg-[#38bdf8] text-[#0a0d14]'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Hướng Dẫn Build Tự Động</span>
          </button>

          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'workflow'
                ? 'bg-[#38bdf8] text-[#0a0d14]'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>.github/workflows/main.yml</span>
          </button>

          <button
            onClick={() => setActiveTab('cmake')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'cmake'
                ? 'bg-[#38bdf8] text-[#0a0d14]'
                : 'bg-[#161f30] text-[#94a3b8] hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>CMakeLists.txt</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-[#f8fafc] bg-[#07090f]">
          {activeTab === 'instructions' ? (
            <div className="space-y-5 font-sans">
              <div className="bg-[#121824] p-4 rounded-xl border border-[#25334e]">
                <h4 className="text-sm font-bold text-[#00f0ff] mb-1">
                  Cách Kích Hoạt GitHub Actions để nhận file HNStudioMusikAI.exe (Không cần cài Visual Studio):
                </h4>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Toàn bộ mã nguồn C++ JUCE, CMakeLists.txt và workflow GitHub Actions đã được chuẩn bị hoàn chỉnh 100% trong file <strong className="text-[#f8fafc]">HNStudio-Musik-AI.zip</strong>.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </span>
                  <div>
                    <h5 className="font-bold text-sm text-[#f8fafc]">Tải file HNStudio-Musik-AI.zip</h5>
                    <p className="text-xs text-[#94a3b8]">Nhấn nút màu tím ở góc trên hoặc trên thanh Header để tải trọn bộ project về máy tính.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </span>
                  <div className="flex-1">
                    <h5 className="font-bold text-sm text-[#f8fafc]">Tạo repo trên GitHub & Đẩy code lên</h5>
                    <p className="text-xs text-[#94a3b8] mb-2">Mở thư mục đã giải nén trong Terminal/CMD và chạy:</p>
                    <div className="relative bg-[#0a0d14] p-3 rounded-lg border border-[#1e293b] font-mono text-[11px] text-[#38bdf8]">
                      <button
                        onClick={() => copyToClipboard(gitCommands)}
                        className="absolute top-2 right-2 px-2 py-1 rounded bg-[#1e293b] text-[#94a3b8] hover:text-white flex items-center space-x-1"
                      >
                        {copied ? <Check className="w-3 h-3 text-[#00ff88]" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Đã copy' : 'Copy'}</span>
                      </button>
                      <pre className="whitespace-pre-wrap">{gitCommands}</pre>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </span>
                  <div>
                    <h5 className="font-bold text-sm text-[#f8fafc]">Tải file .exe từ tab GitHub Actions</h5>
                    <p className="text-xs text-[#94a3b8] leading-relaxed">
                      Trên repository GitHub của bạn, nhấn vào tab <strong className="text-[#38bdf8]">Actions</strong>. Bạn sẽ thấy luồng <strong className="text-[#00ff88]">Build Windows x64 Release</strong> đang chạy. Sau 3-5 phút, vào mục <strong className="text-[#f8fafc]">Artifacts</strong> tải gói <strong className="text-[#00f0ff]">HNStudio-Musik-AI-Windows-x64.zip</strong> về và mở <strong className="text-[#00ff88]">HNStudioMusikAI.exe</strong> để hát live!
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
