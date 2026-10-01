#include "AudioEngine.h"
#include <cmath>

// =========================================================================
// SystemAudioCallback Implementation (Dedicated CABLE Output Input stream)
// =========================================================================
AudioEngine::SystemAudioCallback::SystemAudioCallback(AudioEngine& ownerEngine)
    : engine(ownerEngine)
{
}

void AudioEngine::SystemAudioCallback::audioDeviceAboutToStart(juce::AudioIODevice* device)
{
    if (device != nullptr)
    {
        DBG("CABLE OUTPUT OPEN = YES");
        DBG("CABLE OUTPUT START = YES");
        DBG("INPUT CHANNELS = " + juce::String(device->getActiveInputChannels().countNumberOfSetBits()));
        DBG("SAMPLE RATE = " + juce::String(device->getCurrentSampleRate()));
        DBG("BUFFER SIZE = " + juce::String(device->getCurrentBufferSizeSamples()));
    }
}

void AudioEngine::SystemAudioCallback::audioDeviceStopped()
{
    DBG("CABLE OUTPUT START = NO (device stopped)");
}

void AudioEngine::SystemAudioCallback::audioDeviceIOCallbackWithContext(const float* const* inputChannelData,
                                                                       int numInputChannels,
                                                                       float* const* /*outputChannelData*/,
                                                                       int /*numOutputChannels*/,
                                                                       int numSamples,
                                                                       const juce::AudioIODeviceCallbackContext& /*context*/)
{
    if (numSamples <= 0) return;
    engine.processSystemAudioBlock(inputChannelData, numInputChannels, numSamples);
}

void AudioEngine::SystemAudioCallback::audioDeviceError(const juce::String& errorMessage)
{
    DBG("CABLE OUTPUT OPEN = NO (" + errorMessage + ")");
}


// =========================================================================
// AudioEngine Implementation
// =========================================================================
AudioEngine::AudioEngine()
    : systemAudioCallback(*this)
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
        // 1. Initialize Primary Device Manager (Mic Input + Monitor Output)
        juce::String err = deviceManager.initialiseWithDefaultDevices(2, 2);
        if (err.isNotEmpty())
        {
            err = deviceManager.initialiseWithDefaultDevices(0, 2);
        }

        if (err.isNotEmpty())
        {
            lastDeviceError = "Khởi tạo thiết bị âm thanh chính thất bại: " + err;
            DBG("[HNSTUDIO ERROR] " + lastDeviceError);
            return false;
        }

        deviceManager.addAudioCallback(this);

        auto* micDev = deviceManager.getCurrentAudioDevice();
        if (micDev != nullptr)
        {
            DBG("[HNSTUDIO MIC] Mic device = " + micDev->getName());
            DBG("[HNSTUDIO MIC] Mic input channels = " + juce::String(micDev->getActiveInputChannels().countNumberOfSetBits()));
            DBG("[HNSTUDIO MIC] Mic opened = YES");
            DBG("[HNSTUDIO MIC] Mic callback = YES");
        }

        // 2. Scan and find exact CABLE Output device name
        juce::String exactCableOutputName;
        auto deviceTypes = systemDeviceManager.getAvailableDeviceTypes();
        for (auto* type : deviceTypes)
        {
            type->scanForDevices();
            auto inputNames = type->getDeviceNames(true);
            for (const auto& name : inputNames)
            {
                if (name.containsIgnoreCase("CABLE Output") || name.containsIgnoreCase("Virtual Cable") || name.containsIgnoreCase("VB-Audio"))
                {
                    exactCableOutputName = name;
                    systemDeviceManager.setCurrentAudioDeviceType(type->getTypeName(), true);
                    break;
                }
            }
            if (exactCableOutputName.isNotEmpty())
                break;
        }

        if (exactCableOutputName.isNotEmpty())
        {
            DBG("CABLE OUTPUT FOUND = YES");
            DBG("CABLE OUTPUT DEVICE NAME = " + exactCableOutputName);
            
            juce::AudioDeviceManager::AudioDeviceSetup sysSetup;
            systemDeviceManager.getAudioDeviceSetup(sysSetup);
            sysSetup.inputDeviceName = exactCableOutputName;
            sysSetup.outputDeviceName = ""; // Input capture only
            sysSetup.sampleRate = 44100.0;
            sysSetup.bufferSize = 512;
            sysSetup.inputChannels.setRange(0, 2, true); // Explicitly enable stereo input
            sysSetup.useDefaultInputChannels = false;

            juce::String sysErr = systemDeviceManager.setAudioDeviceSetup(sysSetup, true);
            if (sysErr.isNotEmpty())
            {
                DBG("CABLE OUTPUT OPEN = NO (" + sysErr + ")");
            }
            else
            {
                systemDeviceManager.addAudioCallback(&systemAudioCallback);
                auto* activeDevice = systemDeviceManager.getCurrentAudioDevice();
                if (activeDevice != nullptr && activeDevice->isOpen())
                {
                    DBG("CABLE OUTPUT OPEN = YES");
                    DBG("CABLE OUTPUT START = YES");
                    DBG("INPUT CHANNELS = " + juce::String(activeDevice->getActiveInputChannels().countNumberOfSetBits()));
                    DBG("SAMPLE RATE = " + juce::String(activeDevice->getCurrentSampleRate()));
                    DBG("BUFFER SIZE = " + juce::String(activeDevice->getCurrentBufferSizeSamples()));
                }
                else
                {
                    DBG("CABLE OUTPUT OPEN = NO (Device opened but failed to activate)");
                }
            }
        }
        else
        {
            DBG("CABLE OUTPUT FOUND = NO");
            DBG("CABLE OUTPUT OPEN = NO (Device not found during system scan)");
        }

        return true;
    }
    catch (const std::exception& e) {
        lastDeviceError = juce::String("Exception khi khởi tạo audio: ") + e.what();
        DBG("[HNSTUDIO EXCEPTION] " + lastDeviceError);
        return false;
    }
    catch (...) {
        return false;
    }
}

void AudioEngine::closeAudioDevice()
{
    setLiveEnabled(false);
    systemDeviceManager.removeAudioCallback(&systemAudioCallback);
    systemDeviceManager.closeAudioDevice();

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
            if (name.containsIgnoreCase("CABLE Output") || name.containsIgnoreCase("Virtual Cable") || name.containsIgnoreCase("VB-Audio"))
                hasCableOut = true;
        }
        for (const auto& name : outputs)
        {
            if (name.containsIgnoreCase("CABLE Input") || name.containsIgnoreCase("Virtual Cable") || name.containsIgnoreCase("VB-Audio"))
                hasCableIn = true;
        }

        return hasCableOut && hasCableIn;
    }
   #endif
    return true;
}

bool AudioEngine::installVirtualDriver()
{
    return isVirtualDriverInstalled();
}

void AudioEngine::saveAndRedirectWindowsDefaultAudio(bool liveOn)
{
    juce::AudioDeviceManager::AudioDeviceSetup setup;
    deviceManager.getAudioDeviceSetup(setup);

    if (liveOn)
    {
        savedDefaultDeviceName = setup.outputDeviceName;

        // Scan for exact CABLE Input device name
        juce::String exactCableInputName;
        auto deviceTypes = deviceManager.getAvailableDeviceTypes();
        for (auto* type : deviceTypes)
        {
            type->scanForDevices();
            auto outputNames = type->getDeviceNames(false);
            for (const auto& name : outputNames)
            {
                if (name.containsIgnoreCase("CABLE Input") || name.containsIgnoreCase("Virtual Cable") || name.containsIgnoreCase("VB-Audio"))
                {
                    exactCableInputName = name;
                    break;
                }
            }
            if (exactCableInputName.isNotEmpty())
                break;
        }

        if (exactCableInputName.isNotEmpty())
        {
            setup.outputDeviceName = exactCableInputName;
            deviceManager.setAudioDeviceSetup(setup, true);
            DBG("[HNSTUDIO ROUTING] Windows Default Output -> " + exactCableInputName + " (LIVE ON)");
        }
        else
        {
            DBG("[HNSTUDIO ROUTING ERROR] CABLE Input not found for routing");
        }
    }
    else
    {
        if (savedDefaultDeviceName.isNotEmpty())
        {
            setup.outputDeviceName = savedDefaultDeviceName;
            deviceManager.setAudioDeviceSetup(setup, true);
            DBG("[HNSTUDIO ROUTING] Windows Default Output restored -> " + savedDefaultDeviceName + " (LIVE OFF)");
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

// System Audio Callback Processor (from CABLE Output)
void AudioEngine::processSystemAudioBlock(const float* const* inputChannelData, int numInputChannels, int numSamples)
{
    if (numSamples <= 0 || systemBusBuffer.getNumSamples() < numSamples) return;

    systemBusBuffer.clear();

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

    // System FX / VST3 Chain
    systemDspChain.process(systemBusBuffer);
    systemMidiBuffer.clear();
    systemVstRack.process(systemBusBuffer, systemMidiBuffer);

    float currentSystemVol = systemVolume.load();
    systemBusBuffer.applyGain(currentSystemVol);

    float sysRms = systemBusBuffer.getRMSLevel(0, 0, numSamples);
    float sysPeak = systemBusBuffer.getMagnitude(0, 0, numSamples);
    systemLevelRms.store(sysRms);
    systemLevelPeak.store(sysPeak);

    const auto* sysSamples = systemBusBuffer.getReadPointer(0);
    int sysWrite = systemFifoWritePos.load();
    for (int i = 0; i < numSamples; ++i)
    {
        systemWaveformFifo[(sysWrite + i) % WaveformBufferSize] = sysSamples[i];
    }
    systemFifoWritePos.store((sysWrite + numSamples) % WaveformBufferSize);
}

// Primary Audio Callback (Microphone Input + Master Mixer + Monitor Output)
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
        musicBusBuffer.setSize(2, numSamples, false, false, true);
        masterBusBuffer.setSize(2, numSamples, false, false, true);
        virtualMicOutputBuffer.setSize(2, numSamples, false, false, true);
    }

    micBusBuffer.clear();
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
        outputLevelPeak.store(0.0f);
        outputLevelRms.store(0.0f);
        return;
    }

    // =========================================================================
    // 1. MICROPHONE CHANNEL
    // =========================================================================
    if (inputChannelData != nullptr && numInputChannels > 0)
    {
        if (numInputChannels >= 2)
        {
            micBusBuffer.copyFrom(0, 0, inputChannelData[0], numSamples);
            micBusBuffer.copyFrom(1, 0, inputChannelData[1], numSamples);
        }
        else
        {
            micBusBuffer.copyFrom(0, 0, inputChannelData[0], numSamples);
            micBusBuffer.copyFrom(1, 0, inputChannelData[0], numSamples);
        }

        dspChain.process(micBusBuffer);
        midiBuffer.clear();
        vstRack.process(micBusBuffer, midiBuffer);

        float currentMicVol = micVolume.load();
        micBusBuffer.applyGain(currentMicVol);

        float micRms = micBusBuffer.getRMSLevel(0, 0, numSamples);
        micLevelPeak.store(micBusBuffer.getMagnitude(0, 0, numSamples));
        micLevelRms.store(micRms);

        const auto* micSamples = micBusBuffer.getReadPointer(0);
        int writePos = micFifoWritePos.load();
        for (int i = 0; i < numSamples; ++i)
        {
            micWaveformFifo[(writePos + i) % WaveformBufferSize] = micSamples[i];
        }
        micFifoWritePos.store((writePos + numSamples) % WaveformBufferSize);

        autoKeyDetector.process(micBusBuffer);
    }
    else
    {
        micLevelPeak.store(0.0f);
        micLevelRms.store(0.0f);
    }


    // =========================================================================
    // 2. MUSIC BUS & SFX
    // =========================================================================
    juce::AudioSourceChannelInfo musicInfo(&musicBusBuffer, 0, numSamples);
    musicPlayer.getNextAudioBlock(musicInfo);
    sfxPlayer.getNextAudioBlock(musicBusBuffer, 0, numSamples);


    // =========================================================================
    // 3. MASTER BUS (System Bus + Mic Bus + Music Bus -> Master Limiter)
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

    virtualMicOutputBuffer.copyFrom(0, 0, masterBusBuffer, 0, 0, numSamples);
    virtualMicOutputBuffer.copyFrom(1, 0, masterBusBuffer, 1, 0, numSamples);

    float outRms = masterBusBuffer.getRMSLevel(0, 0, numSamples);
    float maxOutPeak = masterBusBuffer.getMagnitude(0, 0, numSamples);

    outputLevelPeak.store(maxOutPeak);
    outputLevelRms.store(outRms);

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

    // Periodic Diagnostic Logging in Audio Callback
    if (++logCounter >= 100) // Log every ~100 blocks
    {
        logCounter = 0;
        DBG("SYSTEM RMS = " + juce::String(systemLevelRms.load(), 4));
        DBG("SYSTEM PEAK = " + juce::String(systemLevelPeak.load(), 4));
    }


    // =========================================================================
    // 4. MONITOR OUTPUT (Loa / Headphone if MONITOR ON)
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
    DBG("[HNSTUDIO ERROR] " + lastDeviceError);
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
