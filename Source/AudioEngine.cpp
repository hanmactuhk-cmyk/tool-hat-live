#include "AudioEngine.h"
#include <cmath>

AudioEngine::AudioEngine()
{
    deviceManager.addChangeListener(this);
}

AudioEngine::~AudioEngine()
{
    closeAudioDevice();
    deviceManager.removeChangeListener(this);
}

bool AudioEngine::initAudioDevice()
{
    try {
        juce::AudioDeviceManager::AudioDeviceSetup setup;
        deviceManager.getAudioDeviceSetup(setup);
        
        // Check if VB-CABLE is available
        bool cableAvailable = isVirtualDriverInstalled();
        if (cableAvailable)
        {
            setup.inputDeviceName = "CABLE Output";
            setup.outputDeviceName = setup.outputDeviceName.isNotEmpty() ? setup.outputDeviceName : deviceManager.getDefaultAudioDeviceName(false);
            setup.sampleRate = 44100.0;
            setup.bufferSize = 512;
            
            juce::String err = deviceManager.setAudioDeviceSetup(setup, true);
            if (err.isNotEmpty())
            {
                deviceManager.initialiseWithDefaultDevices(2, 2);
            }
        }
        else
        {
            deviceManager.initialiseWithDefaultDevices(2, 2);
            lastDeviceError = "VB-CABLE NOT INSTALLED: Vui lòng cài đặt VB-Audio VB-CABLE để sử dụng tính năng định tuyến System Audio!";
        }

        deviceManager.addAudioCallback(this);
        return true;
    }
    catch (...) {
        return false;
    }
}

void AudioEngine::closeAudioDevice()
{
    setLiveEnabled(false);
    deviceManager.removeAudioCallback(this);
    deviceManager.closeAudioDevice();
}

void AudioEngine::setLiveEnabled(bool enabled)
{
    bool prev = isLiveOn.exchange(enabled);
    if (prev != enabled)
    {
        saveAndRedirectWindowsDefaultAudio(enabled);
    }
}

bool AudioEngine::isVirtualDriverInstalled() const
{
   #if JUCE_WINDOWS
    std::unique_ptr<juce::AudioIODeviceType> wasapiType(juce::AudioIODeviceType::createAudioIODeviceTypeWASAPI());
    if (wasapiType != nullptr)
    {
        wasapiType->scanForDevices();
        auto inputs = wasapiType->getDeviceNames(true);
        auto outputs = wasapiType->getDeviceNames(false);
        
        bool hasCableOut = false;
        bool hasCableIn = false;

        for (const auto& name : inputs)
        {
            if (name.containsIgnoreCase("CABLE Output"))
                hasCableOut = true;
        }
        for (const auto& name : outputs)
        {
            if (name.containsIgnoreCase("CABLE Input"))
                hasCableIn = true;
        }

        if (hasCableOut && hasCableIn)
            return true;
    }
   #endif
    return true;
}

bool AudioEngine::installVirtualDriver()
{
    // VB-CABLE must be installed by the official VB-Audio installer setup.exe
    // We provide direct guidance and check status.
    return isVirtualDriverInstalled();
}

void AudioEngine::saveAndRedirectWindowsDefaultAudio(bool liveOn)
{
    juce::AudioDeviceManager::AudioDeviceSetup setup;
    deviceManager.getAudioDeviceSetup(setup);

    if (liveOn)
    {
        savedDefaultDeviceName = setup.outputDeviceName;
        // Switch Windows Default Output / Device Setup output to "CABLE Input"
        setup.outputDeviceName = "CABLE Input";
        setup.inputDeviceName = "CABLE Output";
        deviceManager.setAudioDeviceSetup(setup, true);
    }
    else
    {
        // Restore previous default output device
        if (savedDefaultDeviceName.isNotEmpty())
        {
            setup.outputDeviceName = savedDefaultDeviceName;
            deviceManager.setAudioDeviceSetup(setup, true);
        }
    }
}

void AudioEngine::audioDeviceAboutToStart(juce::AudioIODevice* device)
{
    if (device == nullptr) return;

    currentSampleRate = device->getCurrentSampleRate();
    currentBlockSize = device->getCurrentBufferSizeSamples();

    micBusBuffer.setSize(2, currentBlockSize);
    systemBusBuffer.setSize(2, currentBlockSize);
    musicBusBuffer.setSize(2, currentBlockSize);
    masterBusBuffer.setSize(2, currentBlockSize);
    virtualMicOutputBuffer.setSize(2, currentBlockSize);

    dspChain.prepare(currentSampleRate, currentBlockSize);
    systemDspChain.prepare(currentSampleRate, currentBlockSize);
    vstRack.prepare(currentSampleRate, currentBlockSize);
    systemVstRack.prepare(currentSampleRate, currentBlockSize);
    autoKeyDetector.prepare(currentSampleRate, currentBlockSize);
    musicPlayer.prepare(currentSampleRate, currentBlockSize);
    sfxPlayer.prepare(currentSampleRate, currentBlockSize);

    lastDeviceError = "";
}

void AudioEngine::audioDeviceStopped()
{
    vstRack.release();
    systemVstRack.release();
    musicPlayer.release();
}

void AudioEngine::audioDeviceIOCallbackWithContext(const float* const* inputChannelData,
                                                  int numInputChannels,
                                                  float* const* outputChannelData,
                                                  int numOutputChannels,
                                                  int numSamples,
                                                  const juce::AudioIODeviceCallbackContext& /*context*/)
{
    if (numSamples <= 0 || outputChannelData == nullptr || numOutputChannels == 0)
        return;

    if (micBusBuffer.getNumSamples() < numSamples)
    {
        micBusBuffer.setSize(2, numSamples, false, false, true);
        systemBusBuffer.setSize(2, numSamples, false, false, true);
        musicBusBuffer.setSize(2, numSamples, false, false, true);
        masterBusBuffer.setSize(2, numSamples, false, false, true);
        virtualMicOutputBuffer.setSize(2, numSamples, false, false, true);
    }

    micBusBuffer.clear();
    systemBusBuffer.clear();
    musicBusBuffer.clear();
    masterBusBuffer.clear();
    virtualMicOutputBuffer.clear();

    if (!isLiveOn.load())
    {
        for (int ch = 0; ch < numOutputChannels; ++ch)
        {
            if (outputChannelData[ch] != nullptr)
                juce::FloatVectorOperations::clear(outputChannelData[ch], numSamples);
        }
        micLevelPeak.store(0.0f);
        micLevelRms.store(0.0f);
        systemLevelPeak.store(0.0f);
        systemLevelRms.store(0.0f);
        outputLevelPeak.store(0.0f);
        outputLevelRms.store(0.0f);
        return;
    }

    // =========================================================================
    // 1. SYSTEM AUDIO CHANNEL (VB-CABLE Output -> HNSTUDIO System Channel)
    // =========================================================================
    if (inputChannelData != nullptr && numInputChannels >= 2)
    {
        systemBusBuffer.copyFrom(0, 0, inputChannelData[0], numSamples);
        systemBusBuffer.copyFrom(1, 0, inputChannelData[1], numSamples);
    }
    else if (inputChannelData != nullptr && numInputChannels == 1)
    {
        systemBusBuffer.copyFrom(0, 0, inputChannelData[0], numSamples);
        systemBusBuffer.copyFrom(1, 0, inputChannelData[0], numSamples);
    }

    // System FX / VST3 Chain (Independent of Mic)
    systemDspChain.process(systemBusBuffer);
    systemMidiBuffer.clear();
    systemVstRack.process(systemBusBuffer, systemMidiBuffer);

    float currentSystemVol = systemVolume.load();
    systemBusBuffer.applyGain(currentSystemVol);

    float sysPeakL = systemBusBuffer.getMagnitude(0, 0, numSamples);
    float sysPeakR = systemBusBuffer.getMagnitude(1, 0, numSamples);
    float sysRmsL  = systemBusBuffer.getRMSLevel(0, 0, numSamples);
    float sysRmsR  = systemBusBuffer.getRMSLevel(1, 0, numSamples);
    systemLevelPeak.store(std::max(sysPeakL, sysPeakR));
    systemLevelRms.store(std::max(sysRmsL, sysRmsR));

    const auto* sysSamples = systemBusBuffer.getReadPointer(0);
    int sysWrite = systemFifoWritePos.load();
    for (int i = 0; i < numSamples; ++i)
    {
        systemWaveformFifo[(sysWrite + i) % WaveformBufferSize] = sysSamples[i];
    }
    systemFifoWritePos.store((sysWrite + numSamples) % WaveformBufferSize);


    // =========================================================================
    // 2. MICROPHONE CHANNEL (Strict Isolation)
    // Microphone -> Mic Input -> Gate -> EQ -> Comp -> De-Esser -> VST3 -> Reverb
    // =========================================================================
    if (inputChannelData != nullptr && numInputChannels > 2)
    {
        // If device opens multi-channel (System + Mic combined or dedicated mic channel)
        micBusBuffer.copyFrom(0, 0, inputChannelData[2], numSamples);
        micBusBuffer.copyFrom(1, 0, inputChannelData[numInputChannels > 3 ? 3 : 2], numSamples);
    }
    else if (inputChannelData != nullptr && numInputChannels > 0 && !isVirtualDriverInstalled())
    {
        micBusBuffer.copyFrom(0, 0, inputChannelData[0], numSamples);
        micBusBuffer.copyFrom(1, 0, inputChannelData[1 > numInputChannels - 1 ? 0 : 1], numSamples);
    }

    dspChain.process(micBusBuffer);
    midiBuffer.clear();
    vstRack.process(micBusBuffer, midiBuffer);

    float currentMicVol = micVolume.load();
    micBusBuffer.applyGain(currentMicVol);

    float peakL = micBusBuffer.getMagnitude(0, 0, numSamples);
    float peakR = micBusBuffer.getMagnitude(1, 0, numSamples);
    float rmsL  = micBusBuffer.getRMSLevel(0, 0, numSamples);
    float rmsR  = micBusBuffer.getRMSLevel(1, 0, numSamples);
    micLevelPeak.store(std::max(peakL, peakR));
    micLevelRms.store(std::max(rmsL, rmsR));

    const auto* micSamples = micBusBuffer.getReadPointer(0);
    int writePos = micFifoWritePos.load();
    for (int i = 0; i < numSamples; ++i)
    {
        micWaveformFifo[(writePos + i) % WaveformBufferSize] = micSamples[i];
    }
    micFifoWritePos.store((writePos + numSamples) % WaveformBufferSize);

    autoKeyDetector.process(micBusBuffer);


    // =========================================================================
    // 3. MUSIC BUS & SFX
    // =========================================================================
    juce::AudioSourceChannelInfo musicInfo(&musicBusBuffer, 0, numSamples);
    musicPlayer.getNextAudioBlock(musicInfo);
    sfxPlayer.getNextAudioBlock(musicBusBuffer, 0, numSamples);


    // =========================================================================
    // 4. MASTER BUS (System + Mic + Music -> Master Limiter)
    // =========================================================================
    masterBusBuffer.addFrom(0, 0, systemBusBuffer, 0, 0, numSamples);
    masterBusBuffer.addFrom(1, 0, systemBusBuffer, 1, 0, numSamples);

    masterBusBuffer.addFrom(0, 0, micBusBuffer, 0, 0, numSamples);
    masterBusBuffer.addFrom(1, 0, micBusBuffer, 1, 0, numSamples);

    masterBusBuffer.addFrom(0, 0, musicBusBuffer, 0, 0, numSamples);
    masterBusBuffer.addFrom(1, 0, musicBusBuffer, 1, 0, numSamples);

    dspChain.getLimiter().process(masterBusBuffer);

    float currentMasterVol = masterVolume.load();
    masterBusBuffer.applyGain(currentMasterVol);

    // OBS Virtual Microphone Output Buffer
    virtualMicOutputBuffer.copyFrom(0, 0, masterBusBuffer, 0, 0, numSamples);
    virtualMicOutputBuffer.copyFrom(1, 0, masterBusBuffer, 1, 0, numSamples);

    // Metering
    float outPeakL = masterBusBuffer.getMagnitude(0, 0, numSamples);
    float outPeakR = masterBusBuffer.getMagnitude(1, 0, numSamples);
    float outRmsL  = masterBusBuffer.getRMSLevel(0, 0, numSamples);
    float outRmsR  = masterBusBuffer.getRMSLevel(1, 0, numSamples);
    float maxOutPeak = std::max(outPeakL, outPeakR);

    outputLevelPeak.store(maxOutPeak);
    outputLevelRms.store(std::max(outRmsL, outRmsR));

    if (maxOutPeak >= 0.999f)
    {
        isClipping.store(true);
    }

    audioRecorder.processAudioBlock(masterBusBuffer);

    const auto* outSamples = masterBusBuffer.getReadPointer(0);
    int outWrite = outFifoWritePos.load();
    for (int i = 0; i < numSamples; ++i)
    {
        outputWaveformFifo[(outWrite + i) % WaveformBufferSize] = outSamples[i];
    }
    outFifoWritePos.store((outWrite + numSamples) % WaveformBufferSize);


    // =========================================================================
    // 5. MONITOR OUTPUT (Loa / Headphone if MONITOR ON)
    // =========================================================================
    bool monitorOn = isMonitorOn.load();
    for (int ch = 0; ch < numOutputChannels; ++ch)
    {
        if (outputChannelData[ch] != nullptr)
        {
            if (monitorOn)
            {
                int srcCh = std::min(ch, 1);
                juce::FloatVectorOperations::copy(outputChannelData[ch],
                                                  masterBusBuffer.getReadPointer(srcCh),
                                                  numSamples);
            }
            else
            {
                juce::FloatVectorOperations::clear(outputChannelData[ch], numSamples);
            }
        }
    }
}

void AudioEngine::audioDeviceError(const juce::String& errorMessage)
{
    lastDeviceError = "Lỗi thiết bị âm thanh: " + errorMessage;
}

void AudioEngine::changeListenerCallback(juce::ChangeBroadcaster* /*source*/)
{
    auto* device = deviceManager.getCurrentAudioDevice();
    if (device == nullptr)
    {
        lastDeviceError = "Thiết bị âm thanh đã bị ngắt kết nối. Vui lòng mở Audio I/O để chọn lại.";
    }
    else
    {
        lastDeviceError = "";
    }
}

void AudioEngine::getMicWaveform(std::array<float, WaveformBufferSize>& dest)
{
    int readPos = micFifoWritePos.load();
    for (int i = 0; i < WaveformBufferSize; ++i)
    {
        int idx = (readPos + i) % WaveformBufferSize;
        dest[i] = micWaveformFifo[idx];
    }
}

void AudioEngine::getSystemWaveform(std::array<float, WaveformBufferSize>& dest)
{
    int readPos = systemFifoWritePos.load();
    for (int i = 0; i < WaveformBufferSize; ++i)
    {
        int idx = (readPos + i) % WaveformBufferSize;
        dest[i] = systemWaveformFifo[idx];
    }
}

void AudioEngine::getOutputWaveform(std::array<float, WaveformBufferSize>& dest)
{
    int readPos = outFifoWritePos.load();
    for (int i = 0; i < WaveformBufferSize; ++i)
    {
        int idx = (readPos + i) % WaveformBufferSize;
        dest[i] = outputWaveformFifo[idx];
    }
}
