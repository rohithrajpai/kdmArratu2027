(() => {
  const buttons = document.querySelectorAll(".sound-toggle");
  if (!buttons.length) return;

  let audioContext;
  let masterGain;
  let oscillators = [];
  let chimeTimer;
  let playing = false;

  const setButtons = (active) => {
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(active));
      button.querySelector(".sound-label").textContent = active
        ? "ശാന്തസംഗീതം നിർത്തുക"
        : "ശാന്തസംഗീതം കേൾക്കുക";
    });
  };

  const startAmbient = async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      buttons.forEach((button) => {
        button.querySelector(".sound-label").textContent = "ഈ ബ്രൗസറിൽ ശബ്ദം ലഭ്യമല്ല";
        button.disabled = true;
      });
      return;
    }

    audioContext = audioContext || new AudioContextClass();
    await audioContext.resume();
    masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0, audioContext.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.035, audioContext.currentTime + 1.8);
    masterGain.connect(audioContext.destination);

    [[110, 0.48], [164.81, 0.2], [220, 0.1]].forEach(([frequency, volume]) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = volume;
      oscillator.connect(gain);
      gain.connect(masterGain);
      oscillator.start();
      oscillators.push(oscillator);
    });
    const notes = [261.63, 329.63, 392, 523.25, 392, 329.63];
    let noteIndex = 0;
    const playChime = () => {
      if (!playing && oscillators.length) return;
      const tone = audioContext.createOscillator();
      const envelope = audioContext.createGain();
      const now = audioContext.currentTime;
      tone.type = "sine";
      tone.frequency.value = notes[noteIndex++ % notes.length];
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(0.16, now + 0.08);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
      tone.connect(envelope);
      envelope.connect(masterGain);
      tone.start(now);
      tone.stop(now + 2.25);
    };
    playing = true;
    playChime();
    chimeTimer = window.setInterval(playChime, 2400);
    setButtons(true);
  };

  const stopAmbient = () => {
    if (!audioContext || !playing) return;
    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.12);
    const currentOscillators = oscillators;
    oscillators = [];
    window.clearInterval(chimeTimer);
    window.setTimeout(() => currentOscillators.forEach((oscillator) => oscillator.stop()), 500);
    playing = false;
    setButtons(false);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (playing) {
        stopAmbient();
        return;
      }
      try {
        await startAmbient();
      } catch (error) {
        button.querySelector(".sound-label").textContent = "ശബ്ദം ആരംഭിക്കാനായില്ല";
        console.error("Could not start the ambient sound:", error);
      }
    });
  });
})();
