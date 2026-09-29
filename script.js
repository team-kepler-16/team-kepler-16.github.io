$(function () {
  const $soundToggle = $("#sound-toggle");
  const $localeToggle = $("#locale-toggle");
  const $aboutLink = $("[data-i18n='about']");
  let locale = "en";
  let isMuted = false;

  const labels = {
    en: { mute: "Mute", unmute: "Unmute", about: "About", language: "Language: English. Switch to Spanish" },
    es: { mute: "Silenciar", unmute: "Activar sonido", about: "Acerca de", language: "Idioma: español. Cambiar a inglés" }
  };

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
    $localeToggle.text(locale.toUpperCase()).attr("aria-label", labels[locale].language);
    $aboutLink.text(labels[locale].about);
    updateSoundControl();
  });

  updateSoundControl();
});
