(() => {
  const buttons = document.querySelectorAll(".music-toggle");
  if (!buttons.length) return;

  const music = new Audio("Kamalapthakula.mp3");
  music.loop = true;
  music.preload = "auto";

  const updateButtons = (playing) => {
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(playing));
      button.setAttribute("aria-label", playing ? "Stop festival music" : "Play festival music");
      button.title = playing ? "Stop festival music" : "Play festival music";
      button.querySelector("span").textContent = playing ? "■" : "▶";
    });
  };

  music.addEventListener("play", () => updateButtons(true));
  music.addEventListener("pause", () => updateButtons(false));

  music.addEventListener("error", () => {
    console.error("Could not load the festival music:", music.error);
  });

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (!music.paused) {
        music.pause();
        return;
      }

      try {
        await music.play();
      } catch (error) {
        console.error("Could not start the festival music:", error);
      }
    });
  });

  music.play().catch((error) => {
    if (error.name !== "NotAllowedError") {
      console.error("Could not start the festival music:", error);
    }
  });
})();
