const translations = {
  en: {
    mute: "Mute",
    unmute: "Unmute",
    home: "Home",
    about: "About",
    archiveLabel: "Mars Exploration / Archive",
    aboutEyebrow: "Project / About the archive",
    pointsTitle: "Points",
    pointPrefix: "Point",
    language: "Language: English. Switch to Spanish",
    marsCanvas: "Mars globe with random interactive points that open Google. Hover over a point to pause rotation and show its red outline. Click and drag horizontally, or drag with one finger, to rotate it around its axis. Use the mouse wheel or a two-finger pinch to zoom.",
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
    archiveLabel: "Exploración de Marte / Archivo",
    aboutEyebrow: "Proyecto / El archivo",
    pointsTitle: "Puntos",
    pointPrefix: "Punto",
    language: "Idioma: español. Cambiar a inglés",
    marsCanvas: "Globo de Marte con puntos interactivos aleatorios que abren Google. Pasá el mouse sobre un punto para pausar la rotación y mostrar su borde rojo. Hacé clic y arrastrá horizontalmente, o arrastrá con un dedo, para rotarlo sobre su eje. Usá la rueda del mouse o el gesto de pellizcar con dos dedos para acercar o alejar.",
    mainTitle: "NASA: 50 años de aterrizajes en Marte",
    aboutTitle: "Acerca de",
    creditsTitle: "Créditos",
    textureCredit: "Textura de Marte: NASA/JPL y Caltech.",
    textureSource: "Recursos 3D de Marte de NASA"
  }
};

$(initializeSiteControls);

function initializeSiteControls() {
  const $soundToggle = $("#sound-toggle");
  const $localeToggle = $("#locale-toggle");
  let locale = "en";
  let isMuted = false;

  $soundToggle.on("click", function () {
    isMuted = !isMuted;
    $("audio, video").prop("muted", isMuted);
    renderSoundControl($soundToggle, locale, isMuted);
  });

  $localeToggle.on("click", function () {
    locale = locale === "en" ? "es" : "en";
    $(document.documentElement).attr("lang", locale);
    renderLocale(locale, $localeToggle);
    renderSoundControl($soundToggle, locale, isMuted);
  });

  renderLocale(locale, $localeToggle);
  renderSoundControl($soundToggle, locale, isMuted);
}

function renderLocale(locale, $localeToggle) {
  const text = translations[locale];
  $localeToggle.text(locale.toUpperCase()).attr("aria-label", text.language);
  $("#mars-canvas").attr("aria-label", text.marsCanvas);

  $("[data-i18n]").each(function () {
    const key = $(this).data("i18n");
    if (text[key] !== undefined) $(this).text(text[key]);
  });
}

function renderSoundControl($soundToggle, locale, isMuted) {
  const label = isMuted ? translations[locale].unmute : translations[locale].mute;
  $soundToggle.text(label).attr({
    "aria-label": label,
    "aria-pressed": String(isMuted)
  });
}
