(() => {
  const music = window.festivalMusic || new Audio("Kamalapthakula.mp3");
  window.festivalMusic = music;
  music.loop = true;
  music.preload = "auto";
  const musicStateKey = "festival-music-state";
  let savedMusicState;

  try {
    savedMusicState = JSON.parse(sessionStorage.getItem(musicStateKey) || "null");
  } catch (error) {
    console.error("Could not read saved festival music state:", error);
  }

  const saveMusicState = () => {
    try {
      sessionStorage.setItem(musicStateKey, JSON.stringify({
        currentTime: music.currentTime,
        playing: !music.paused,
      }));
    } catch (error) {
      console.error("Could not save festival music state:", error);
    }
  };

  music.addEventListener("pause", () => {
    saveMusicState();
  });
  music.addEventListener("timeupdate", saveMusicState);

  music.addEventListener("error", () => {
    console.error("Could not load the festival music:", music.error);
  });
  window.addEventListener("pagehide", saveMusicState);

  const resumeMusic = () => {
    if (savedMusicState?.currentTime > 0) {
      const restorePosition = () => {
        music.currentTime = savedMusicState.currentTime;
      };
      if (music.readyState >= 1) restorePosition();
      else music.addEventListener("loadedmetadata", restorePosition, { once: true });
    }

    return music.play();
  };

  let autoplayPending = true;
  const retryAutoplay = () => {
    if (!autoplayPending) return;
    music.play().then(() => {
      autoplayPending = false;
      ["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
        document.removeEventListener(eventName, retryAutoplay);
      });
    }).catch((error) => {
      if (error.name !== "NotAllowedError") {
        console.error("Could not start the festival music:", error);
      }
    });
  };

  resumeMusic().then(() => {
    autoplayPending = music.paused;
  }).catch((error) => {
    autoplayPending = true;
    if (error.name !== "NotAllowedError") {
      console.error("Could not start the festival music:", error);
    }
  });

  ["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    document.addEventListener(eventName, retryAutoplay);
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
      if (!nextMain || !currentMain) {
        throw new Error("The requested page is missing its main content.");
      }

      currentMain.replaceChildren(...nextMain.cloneNode(true).childNodes);
      if (nextNav) {
        if (currentNav) {
          currentNav.replaceChildren(...nextNav.cloneNode(true).childNodes);
        } else {
          const header = document.querySelector(".site-header");
          if (!header) throw new Error("The site header is missing.");
          header.append(nextNav.cloneNode(true));
        }
      } else {
        currentNav?.remove();
      }
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
