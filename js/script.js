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
    closeWindow: "Close window",
    selectedPoint: "Selected surface point",
    language: "Language: English. Switch to Spanish",
    marsCanvas: "Mars globe with interactive points. Hover over a point to pause rotation and show its red outline. Click a point to open its window. Click and drag horizontally, or drag with one finger, to rotate it around its axis. Use the mouse wheel or a two-finger pinch to zoom. Select a point from the list to open its window and center it horizontally while keeping its latitude.",
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
    closeWindow: "Cerrar ventana",
    selectedPoint: "Punto de superficie seleccionado",
    language: "Idioma: español. Cambiar a inglés",
    marsCanvas: "Globo de Marte con puntos interactivos. Pasá el mouse sobre un punto para pausar la rotación y mostrar su borde rojo. Hacé clic en un punto para abrir su ventana. Hacé clic y arrastrá horizontalmente, o arrastrá con un dedo, para rotarlo sobre su eje. Usá la rueda del mouse o el gesto de pellizcar con dos dedos para acercar o alejar. Elegí un punto de la lista para abrir su ventana y centrarlo horizontalmente, manteniendo su latitud.",
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
  $localeToggle.attr({
    "aria-label": text.language,
    "data-switch-to": locale === "en" ? "es" : "en"
  });
  $("#mars-canvas").attr("aria-label", text.marsCanvas);

  $("[data-i18n]").each(function () {
    const key = $(this).data("i18n");
    if (text[key] !== undefined) $(this).text(text[key]);
  });
  $("[data-i18n-aria-label]").each(function () {
    const key = $(this).data("i18n-aria-label");
    if (text[key] !== undefined) $(this).attr("aria-label", text[key]);
  });
}

function renderSoundControl($soundToggle, locale, isMuted) {
  const label = isMuted ? translations[locale].unmute : translations[locale].mute;
  $soundToggle.attr({
    "aria-label": label,
    "aria-pressed": String(isMuted)
  });
}
