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

  const loadPage = async (url, addHistory = true) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Page request failed: ${response.status}`);

      const nextDocument = new DOMParser().parseFromString(await response.text(), "text/html");
      const nextMain = nextDocument.querySelector("main#main");
      const currentMain = document.querySelector("main#main");
      const nextNav = nextDocument.querySelector(".day-nav");
      const currentNav = document.querySelector(".day-nav");
      if (!nextMain || !currentMain || !nextNav || !currentNav) {
        throw new Error("The requested page is missing shared navigation content.");
      }

      currentMain.replaceChildren(...nextMain.cloneNode(true).childNodes);
      currentNav.replaceChildren(...nextNav.cloneNode(true).childNodes);
      document.title = nextDocument.title;

      const description = nextDocument.querySelector('meta[name="description"]')?.content;
      if (description) {
        document.querySelector('meta[name="description"]')?.setAttribute("content", description);
      }

      if (addHistory) history.pushState({}, "", url);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Could not navigate without reloading:", error);
      window.location.assign(url);
    }
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.target || link.hasAttribute("download")) return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !/\.html$/i.test(url.pathname)) return;

    event.preventDefault();
    loadPage(url.href);
  });

  window.addEventListener("popstate", () => loadPage(window.location.href, false));
})();
