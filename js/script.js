$(function () {
  const $soundToggle = $("#sound-toggle");
  const $localeToggle = $("#locale-toggle");
  let locale = "en";
  let isMuted = false;

  const labels = {
    en: {
      mute: "Mute",
      unmute: "Unmute",
      home: "Home",
      about: "About",
      language: "Language: English. Switch to Spanish",
      marsCanvas: "Mars globe. Click and drag horizontally, or drag with one finger, to rotate it around its axis. Use the mouse wheel or a two-finger pinch to zoom.",
      mainTitle: "NASA: 50 Years of Landings on Mars",
      aboutTitle: "About",
      creditsTitle: "Credits",
      textureCredit: "Mars texture: NASA/JPL and Caltech.",
      textureSource: "NASA Mars 3D resources"
    },
    es: {
      mute: "Silenciar",
      unmute: "Activar sonido",
      home: "Inicio",
      about: "Acerca de",
      language: "Idioma: español. Cambiar a inglés",
      marsCanvas: "Globo de Marte. Hacé clic y arrastrá horizontalmente, o arrastrá con un dedo, para rotarlo sobre su eje. Usá la rueda del mouse o el gesto de pellizcar con dos dedos para acercar o alejar.",
      mainTitle: "NASA: 50 años de aterrizajes en Marte",
      aboutTitle: "Acerca de",
      creditsTitle: "Créditos",
      textureCredit: "Textura de Marte: NASA/JPL y Caltech.",
      textureSource: "Recursos 3D de Marte de NASA"
    }
  };

  function updateLocaleText() {
    $localeToggle.text(locale.toUpperCase()).attr("aria-label", labels[locale].language);
    $("#mars-canvas").attr("aria-label", labels[locale].marsCanvas);
    $("[data-i18n]").each(function () {
      const key = $(this).data("i18n");
      $(this).text(labels[locale][key]);
    });
  }

  function updateSoundControl() {
    const label = isMuted ? labels[locale].unmute : labels[locale].mute;
    $soundToggle.text(label).attr({
      "aria-label": label,
      "aria-pressed": String(isMuted)
    });
  }

  $soundToggle.on("click", function () {
    isMuted = !isMuted;
    $("audio, video").prop("muted", isMuted);
    updateSoundControl();
  });

  $localeToggle.on("click", function () {
    locale = locale === "en" ? "es" : "en";
    $(document.documentElement).attr("lang", locale);
    updateLocaleText();
    updateSoundControl();
  });

  updateLocaleText();
  updateSoundControl();
});
