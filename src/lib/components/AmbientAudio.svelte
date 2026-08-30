<script lang="ts">
  type BrowserWindow = Window &
    typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };

  let audioContext: AudioContext | undefined;
  let masterGain: GainNode | undefined;
  let isPlaying = $state(false);
  let requiresInteraction = $state(false);
  const ambientGain = 0.16;

  const createAmbientAudio = (): void => {
    const AudioContextClass =
      (window as BrowserWindow).AudioContext ?? (window as BrowserWindow).webkitAudioContext;
    if (!AudioContextClass) throw new Error('Web Audio API indisponível');

    const context = new AudioContextClass();
    const gain = context.createGain();
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 18;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.connect(compressor).connect(context.destination);

    const lowPass = context.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 980;
    lowPass.Q.value = 0.8;
    lowPass.connect(gain);

    const hum = context.createOscillator();
    const humGain = context.createGain();
    hum.type = 'triangle';
    hum.frequency.value = 55;
    humGain.gain.value = 0.12;
    hum.connect(humGain).connect(lowPass);
    hum.start();

    const harmonic = context.createOscillator();
    const harmonicGain = context.createGain();
    harmonic.type = 'sine';
    harmonic.frequency.value = 110;
    harmonicGain.gain.value = 0.035;
    harmonic.connect(harmonicGain).connect(lowPass);
    harmonic.start();

    const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseData.length; index += 1) {
      noiseData[index] = (Math.random() * 2 - 1) * 0.16;
    }

    const noise = context.createBufferSource();
    const noiseFilter = context.createBiquadFilter();
    const noiseGain = context.createGain();
    noise.loop = true;
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 720;
    noiseFilter.Q.value = 0.5;
    noiseGain.gain.value = 0.025;
    noise.buffer = noiseBuffer;
    noise.connect(noiseFilter).connect(noiseGain).connect(gain);
    noise.start();

    audioContext = context;
    masterGain = gain;
  };

  const setAmbientAudio = async (playing: boolean): Promise<void> => {
    if (!audioContext || !masterGain) createAmbientAudio();
    if (!audioContext || !masterGain) throw new Error('Áudio indisponível');

    if (playing && audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    if (playing && audioContext.state !== 'running') {
      isPlaying = false;
      requiresInteraction = true;
      throw new Error('Interação necessária para iniciar o áudio');
    }

    const now = audioContext.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.linearRampToValueAtTime(playing ? ambientGain : 0.0001, now + 0.8);
    isPlaying = playing;
    requiresInteraction = false;
  };

  const toggleAmbientAudio = (): void => {
    void setAmbientAudio(!isPlaying).catch(() => {
      isPlaying = false;
      requiresInteraction = true;
    });
  };

  const attemptAutoplay = (): void => {
    void setAmbientAudio(true).catch(() => {
      requiresInteraction = true;
    });
  };

  const cleanupAudio = (): void => {
    void audioContext?.close();
    audioContext = undefined;
    masterGain = undefined;
    isPlaying = false;
  };
</script>

<svelte:window onload={attemptAutoplay} onbeforeunload={cleanupAudio} />

<button
  class="audio-toggle"
  type="button"
  aria-pressed={isPlaying}
  aria-label={isPlaying
    ? 'Desativar áudio ambiente'
    : requiresInteraction
      ? 'Ativar áudio ambiente (clique para ativar)'
      : 'Ativar áudio ambiente'}
  onclick={toggleAmbientAudio}
>
  <span class="audio-indicator" aria-hidden="true"></span>
  <span
    >{isPlaying
      ? 'sound: on'
      : requiresInteraction
        ? 'sound: click to activate'
        : 'sound: off'}</span
  >
</button>
