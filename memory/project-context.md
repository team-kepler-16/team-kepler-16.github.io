# Project Context

- **Goal:** Develop a Mars-only solution for the NASA Space Apps Challenge 2026 challenge [Abandoned but Not Forgotten: Storytelling About NASA's Discarded Equipment on the Moon and Mars](https://www.spaceappschallenge.org/2026/challenges/abandoned-but-not-forgotten-storytelling-about-nasas-discarded-equipment-on-the-moon-and-mars/).
- **Current stack:** HTML5, CSS3, JavaScript, and jQuery 4.0.0 loaded from the official CDN. Additional technologies may be introduced later.
- **JavaScript preference:** Use jQuery for DOM work when convenient; use native JavaScript when clearer.
- **Responsive requirement:** The site must display and remain usable on both desktop and mobile devices.
- **Mars visualization:** Show a slowly auto-rotating 3D Mars sphere with cartoon shading on a full-viewport canvas behind the floating navbar. Frame the globe in the available area below the navbar, limiting zoom so it does not pass behind the bar or screen edges. Users can rotate it by clicking and dragging horizontally with the mouse, around its vertical axis, and zoom with the mouse wheel or a two-finger pinch. It uses Three.js and the NASA/JPL/Caltech texture from [NASA's Mars 3D resources](https://science.nasa.gov/3d-resources/mars/), stored in `assets/mars-texture.webp`.
- **Homepage title:** “NASA: 50 Years of Landings on Mars,” translated for the Spanish locale and aligned left of the navbar on desktop.
- **Credits:** Keep the Mars texture attribution and source link on `about.html`.
- **Design and navigation:** Use a black background and only the requested right-aligned navbar: sound mute/unmute, English/Spanish locale, and About. Do not add unrequested elements.
- **Documentation language:** English.
