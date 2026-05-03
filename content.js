(() => {
  const ROOT_ID = "sklight-root";
  if (document.getElementById(ROOT_ID)) {
    return;
  }

  const BASE_LOCATIONS = [
    {
      name: "Bratislava - Hrad",
      lat: 48.142,
      lon: 17.1,
      note: "Panorama Dunaja a stareho mesta.",
      category: "viewpoint",
      bestSpots: ["Hradne nadvorie", "Nabrezie pri Eurovea", "Most SNP - vyhliadka UFO"]
    },
    {
      name: "Bratislava - Nivy zelena strecha",
      lat: 48.1516,
      lon: 17.1288,
      note: "Mestsky rooftop s vyhladom na downtown.",
      category: "viewpoint",
      bestSpots: ["Stred rooftop parku", "Okraj smerom na autobusovu stanicu", "Zapadny roh s vyhladom na skyline"]
    },
    {
      name: "Vysoke Tatry - Strbske Pleso",
      lat: 49.12,
      lon: 20.06,
      note: "Hory a odrazy na hladine jazera.",
      category: "natural",
      bestSpots: ["Molo pri jazere", "Okruh okolo plesa", "Skokansky mostik"]
    },
    {
      name: "Banska Stiavnica - Stary zamok",
      lat: 48.458,
      lon: 18.893,
      note: "Historicka architektura a kopce.",
      category: "castle",
      bestSpots: ["Stary zamok - terasa", "Kalvaria", "Namestie Sv. Trojice"]
    },
    {
      name: "Slovensky raj - Tomasovsky vyhlad",
      lat: 48.943,
      lon: 20.487,
      note: "Skalny vyhlad, lesy a hmla rano.",
      category: "viewpoint",
      bestSpots: ["Hrana skaly", "Lesny chodnik od Cingova", "Udolie Hornadu"]
    },
    {
      name: "Kosice - Hlavna ulica",
      lat: 48.72,
      lon: 21.258,
      note: "Mestska fotografia a vecerne svetla.",
      category: "urban",
      bestSpots: ["Dom sv. Alzbety", "Spievajuca fontana", "Urbanova veza"]
    },
    {
      name: "Orava - Oravsky hrad",
      lat: 49.261,
      lon: 19.356,
      note: "Dramaticky hradny profil.",
      category: "castle",
      bestSpots: ["Nabrezie Oravy pod hradom", "Most pri Oravskom Podzamku", "Pristupova cesta s vyhladom"]
    }
  ];

  const OSM_CACHE_KEY = "osmPhotoSpotsSk.v1";
  const CUSTOM_LOCATIONS_KEY = "yangeCustomLocations.v1";
  const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
  const OSM_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  const MAX_EXTRA_LOCATIONS = 300;

  let locations = BASE_LOCATIONS.map((loc) => ({ ...loc, source: "curated" }));

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (typeof text === "string") {
      node.textContent = text;
    }
    return node;
  }

  function makeRow(text, strong) {
    const row = el("div", "sklight-row");
    if (strong) {
      const s = el("strong", null, text);
      row.appendChild(s);
      return row;
    }
    row.textContent = text;
    return row;
  }

  const root = el("div");
  root.id = ROOT_ID;
  const isStandalonePage = location.protocol === "chrome-extension:" && location.pathname.endsWith("/yange.html");

  const launcher = el("button", "sklight-launcher", "Yange");
  launcher.type = "button";
  launcher.classList.add("is-hidden");

  const overlay = el("div", "sklight-overlay");
  overlay.classList.add("is-hidden");

  const panel = el("aside", "sklight-panel");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Yange panel");
  panel.classList.add("is-hidden");

  const header = el("header", "sklight-header");
  const headerLeft = el("div");
  const h2 = el("h2", null, "Yange");
  const p = el("p", null, "Golden hour, blue hour a miesta na fotenie. ");
  const meta = el("span", "sklight-meta", "");
  p.appendChild(meta);
  headerLeft.appendChild(h2);
  headerLeft.appendChild(p);

  const closeBtn = el("button", "sklight-close", "x");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Zavriet panel");

  header.appendChild(headerLeft);
  header.appendChild(closeBtn);

  const locationLabel = el("label", null, "Lokalita");
  locationLabel.setAttribute("for", "sklight-location");
  const locationSelect = el("select");
  locationSelect.id = "sklight-location";

  const dateLabel = el("label", null, "Datum");
  dateLabel.setAttribute("for", "sklight-date");
  const dateInput = el("input");
  dateInput.id = "sklight-date";
  dateInput.type = "date";

  const customDetails = el("section", "sklight-custom");
  const customSummary = el("h3", null, "Vlastna lokalita");
  const customHelp = el("p", "sklight-custom-help", "Zadaj mesto, adresu, nazov miesta alebo priamo suradnice.");
  const customNameLabel = el("label", null, "Nazov");
  customNameLabel.setAttribute("for", "sklight-custom-name");
  const customNameInput = el("input");
  customNameInput.id = "sklight-custom-name";
  customNameInput.type = "text";
  customNameInput.placeholder = "Napriklad: Moja vyhliadka";

  const customQueryLabel = el("label", null, "Miesto alebo suradnice");
  customQueryLabel.setAttribute("for", "sklight-custom-query");
  const customQueryInput = el("input");
  customQueryInput.id = "sklight-custom-query";
  customQueryInput.type = "text";
  customQueryInput.placeholder = "Bratislavsky hrad alebo 48.142, 17.100";

  const findCustomBtn = el("button", "sklight-find-custom", "Najst suradnice");
  findCustomBtn.type = "button";

  const customGrid = el("div", "sklight-custom-grid");
  const customLatWrap = el("div");
  const customLatLabel = el("label", null, "Lat");
  customLatLabel.setAttribute("for", "sklight-custom-lat");
  const customLatInput = el("input");
  customLatInput.id = "sklight-custom-lat";
  customLatInput.type = "number";
  customLatInput.step = "0.000001";
  customLatInput.placeholder = "48.1486";
  customLatWrap.appendChild(customLatLabel);
  customLatWrap.appendChild(customLatInput);

  const customLonWrap = el("div");
  const customLonLabel = el("label", null, "Lon");
  customLonLabel.setAttribute("for", "sklight-custom-lon");
  const customLonInput = el("input");
  customLonInput.id = "sklight-custom-lon";
  customLonInput.type = "number";
  customLonInput.step = "0.000001";
  customLonInput.placeholder = "17.1077";
  customLonWrap.appendChild(customLonLabel);
  customLonWrap.appendChild(customLonInput);
  customGrid.appendChild(customLatWrap);
  customGrid.appendChild(customLonWrap);

  const addCustomBtn = el("button", "sklight-add-custom", "Ulozit lokalitu");
  addCustomBtn.type = "button";
  const customStatus = el("p", "sklight-custom-status", "");

  customDetails.appendChild(customSummary);
  customDetails.appendChild(customHelp);
  customDetails.appendChild(customNameLabel);
  customDetails.appendChild(customNameInput);
  customDetails.appendChild(customQueryLabel);
  customDetails.appendChild(customQueryInput);
  customDetails.appendChild(findCustomBtn);
  customDetails.appendChild(customGrid);
  customDetails.appendChild(addCustomBtn);
  customDetails.appendChild(customStatus);

  const checkBtn = el("button", "sklight-check", "Skontrolovat podmienky");
  checkBtn.id = "sklight-check";
  checkBtn.type = "button";

  const result = el("section", "sklight-result");
  result.id = "sklight-result";
  result.setAttribute("aria-live", "polite");

  panel.appendChild(header);
  panel.appendChild(locationLabel);
  panel.appendChild(locationSelect);
  panel.appendChild(dateLabel);
  panel.appendChild(dateInput);
  panel.appendChild(customDetails);
  panel.appendChild(checkBtn);
  panel.appendChild(result);

  root.appendChild(launcher);
  root.appendChild(overlay);
  root.appendChild(panel);
  document.documentElement.appendChild(root);

  function hidePanel() {
    overlay.classList.add("is-hidden");
    panel.classList.add("is-hidden");
    launcher.classList.add("is-hidden");
  }

  function showPanel() {
    overlay.classList.remove("is-hidden");
    panel.classList.remove("is-hidden");
    launcher.classList.add("is-hidden");
  }

  overlay.addEventListener("click", hidePanel);
  closeBtn.addEventListener("click", hidePanel);
  launcher.addEventListener("click", showPanel);
  ["click", "mousedown", "mouseup", "keydown", "keyup", "keypress", "input"].forEach((eventName) => {
    panel.addEventListener(eventName, (event) => event.stopPropagation());
  });
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message?.type === "SKLIGHT_TOGGLE_PANEL") {
        const isHidden = panel.classList.contains("is-hidden");
        if (isHidden) {
          showPanel();
        } else {
          hidePanel();
        }
        sendResponse({ ok: true });
        return true;
      }
      if (message?.type === "SKLIGHT_OPEN_PANEL") {
        showPanel();
        sendResponse({ ok: true });
        return true;
      }
      return false;
    });
  }

  function setDefaultDate() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    dateInput.value = local.toISOString().slice(0, 10);
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat("sk-SK", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Bratislava"
    }).format(date);
  }

  function addHours(isoUtc, hours) {
    const date = new Date(isoUtc);
    date.setHours(date.getHours() + hours);
    return date;
  }

  function scoreByCloud(cloudCover) {
    if (cloudCover <= 25) {
      return {
        label: "Vyborne podmienky",
        className: "ok",
        reason: "Malo oblakov, ciste a kontrastne svetlo."
      };
    }
    if (cloudCover <= 60) {
      return {
        label: "Dobre podmienky",
        className: "warn",
        reason: "Mierna oblacnost moze dat maksie farby."
      };
    }
    return {
      label: "Slabsie podmienky",
      className: "bad",
      reason: "Vysoka oblacnost znizuje efekt svetelnych okien."
    };
  }

  function clearNode(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function renderLoading(text = "Nacitavam udaje...") {
    clearNode(result);
    result.appendChild(el("p", "sklight-loading", text));
  }

  function renderError(message) {
    clearNode(result);
    result.appendChild(el("p", "sklight-error", message));
  }

  function normalizeName(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeWhitespaces(text) {
    return String(text).replace(/\s+/g, " ").trim();
  }

  function dedupeLocations(input) {
    const seen = new Set();
    const output = [];

    input.forEach((loc) => {
      const key = `${normalizeName(loc.name)}|${loc.lat.toFixed(3)}|${loc.lon.toFixed(3)}`;
      if (!seen.has(key)) {
        seen.add(key);
        output.push(loc);
      }
    });

    return output;
  }

  function inferCategory(tags = {}) {
    if (tags.tourism === "viewpoint") {
      return "viewpoint";
    }
    if (tags.historic === "castle" || tags.tourism === "castle") {
      return "castle";
    }
    if (tags.natural === "peak" || tags.natural === "waterfall" || tags.natural === "cliff") {
      return "natural";
    }
    if (tags.tourism === "museum" || tags.tourism === "attraction") {
      return "urban";
    }
    return "spot";
  }

  function inferNote(category) {
    const byCategory = {
      viewpoint: "Vyhlad vhodny na siroke kompozicie.",
      castle: "Historicky objekt vhodny na siluety a detail.",
      natural: "Prirodna scena vhodna na krajinky.",
      urban: "Mestsky spot vhodny na street a architekturu.",
      spot: "Fotolokacia importovana z OpenStreetMap."
    };
    return byCategory[category] || byCategory.spot;
  }

  function buildAutoBestSpots(location) {
    const category = location.category || "spot";
    if (category === "viewpoint") {
      return ["Hlavna vyhliadkova hrana", "Siroky zaber krajiny", "Kompozicia s popredim"];
    }
    if (category === "castle") {
      return ["Predhradie", "Pristupova cesta", "Panorama objektu z dialky"];
    }
    if (category === "natural") {
      return ["Vyvyseny bod s horizontom", "Popredie s texturou", "Detail prirodnych prvkov"];
    }
    if (category === "urban") {
      return ["Hlavna os ulice", "Detaily fasad", "Siroky mestsky zaber"];
    }
    return ["Hlavny zaber lokality", "Siroky zaber okolia", "Detail s kontrastnym popredim"];
  }

  function renderBestSpots(location) {
    const container = document.createDocumentFragment();
    container.appendChild(makeRow("Najlepsie miesta:", true));

    const spots = Array.isArray(location.bestSpots) && location.bestSpots.length > 0 ? location.bestSpots : buildAutoBestSpots(location);
    const ul = el("ul", "sklight-spots");
    spots.forEach((spot) => {
      ul.appendChild(el("li", null, spot));
    });
    container.appendChild(ul);
    return container;
  }

  function buildMapUrl(location) {
    const delta = 0.03;
    const left = location.lon - delta;
    const right = location.lon + delta;
    const bottom = location.lat - delta;
    const top = location.lat + delta;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${location.lat}%2C${location.lon}`;
  }

  function renderMap(location) {
    const map = el("div", "sklight-map");
    const frame = document.createElement("iframe");
    frame.title = `Mapa lokality ${location.name}`;
    frame.loading = "lazy";
    frame.referrerPolicy = "no-referrer";
    frame.src = buildMapUrl(location);
    map.appendChild(frame);

    const link = el("a", "sklight-map-link", "Otvorit mapu");
    link.href = `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lon}#map=13/${location.lat}/${location.lon}`;
    link.target = "_blank";
    link.rel = "noreferrer";
    map.appendChild(link);
    return map;
  }

  function renderResult(location, date, times, cloudCover, score) {
    clearNode(result);
    result.appendChild(makeRow(location.name, true));
    result.appendChild(makeRow(`Datum: ${date}`));
    result.appendChild(makeRow(`Tip: ${location.note}`));
    result.appendChild(renderMap(location));
    result.appendChild(renderBestSpots(location));
    result.appendChild(makeRow(`Vychod slnka: ${formatTime(times.sunrise)}`));
    result.appendChild(makeRow(`Zapad slnka: ${formatTime(times.sunset)}`));
    result.appendChild(makeRow(`Ranna blue hour: ${formatTime(times.blueMorningFrom)} - ${formatTime(times.blueMorningTo)}`));
    result.appendChild(makeRow(`Ranna golden hour: ${formatTime(times.goldenMorningFrom)} - ${formatTime(times.goldenMorningTo)}`));
    result.appendChild(makeRow(`Vecerna golden hour: ${formatTime(times.goldenEveningFrom)} - ${formatTime(times.goldenEveningTo)}`));
    result.appendChild(makeRow(`Vecerna blue hour: ${formatTime(times.blueEveningFrom)} - ${formatTime(times.blueEveningTo)}`));
    result.appendChild(makeRow(`Oblacnost teraz: ${cloudCover}%`));

    const status = el("div", `sklight-status ${score.className}`, score.label);
    result.appendChild(status);
    result.appendChild(makeRow(score.reason));
  }

  function updateLocationsMeta() {
    const curated = locations.filter((loc) => loc.source !== "osm" && loc.source !== "custom").length;
    const imported = locations.filter((loc) => loc.source === "osm").length;
    const custom = locations.filter((loc) => loc.source === "custom").length;
    meta.textContent = `${curated} kuratorovanych + ${imported} z OSM + ${custom} vlastnych`;
  }

  function repopulateLocationSelect() {
    const previousValue = locationSelect.value;
    clearNode(locationSelect);

    locations.forEach((loc, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      if (loc.source === "osm") {
        option.textContent = `${loc.name} (OSM)`;
      } else if (loc.source === "custom") {
        option.textContent = `${loc.name} (vlastna)`;
      } else {
        option.textContent = loc.name;
      }
      locationSelect.appendChild(option);
    });

    if (previousValue && Number(previousValue) < locations.length) {
      locationSelect.value = previousValue;
    } else {
      locationSelect.value = "0";
    }
  }

  async function fetchSunData(lat, lon, date) {
    const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${date}&formatted=0`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Nepodarilo sa nacitat udaje o vychode/zapade slnka.");
    }
    const data = await res.json();
    if (!data.results?.sunrise || !data.results?.sunset) {
      throw new Error("API nevratilo platne casy slnka.");
    }
    return data.results;
  }

  async function fetchCloudCover(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=cloud_cover&timezone=Europe%2FBerlin`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Nepodarilo sa nacitat pocasie.");
    }
    const data = await res.json();
    const cloud = data.current?.cloud_cover;
    if (typeof cloud !== "number") {
      throw new Error("Pocasie neobsahuje cloud cover.");
    }
    return cloud;
  }

  function getOsmCache() {
    try {
      const raw = localStorage.getItem(OSM_CACHE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed?.savedAt || !Array.isArray(parsed?.data)) {
        return null;
      }
      if (Date.now() - parsed.savedAt > OSM_CACHE_MAX_AGE_MS) {
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  }

  function saveOsmCache(data) {
    try {
      localStorage.setItem(
        OSM_CACHE_KEY,
        JSON.stringify({
          savedAt: Date.now(),
          data
        })
      );
    } catch {
      // ignore
    }
  }

  function sanitizeCustomLocations(input) {
    if (!Array.isArray(input)) {
      return [];
    }
    return input.filter((loc) => (
      loc?.source === "custom" &&
      typeof loc.name === "string" &&
      typeof loc.lat === "number" &&
      typeof loc.lon === "number"
    ));
  }

  async function loadCustomLocations() {
    try {
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        const data = await chrome.storage.local.get(CUSTOM_LOCATIONS_KEY);
        return sanitizeCustomLocations(data[CUSTOM_LOCATIONS_KEY]);
      }
      const raw = localStorage.getItem(CUSTOM_LOCATIONS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return sanitizeCustomLocations(parsed);
    } catch {
      return [];
    }
  }

  async function saveCustomLocations(customLocations) {
    try {
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        await chrome.storage.local.set({ [CUSTOM_LOCATIONS_KEY]: customLocations });
        return;
      }
      localStorage.setItem(CUSTOM_LOCATIONS_KEY, JSON.stringify(customLocations));
    } catch {
      // ignore
    }
  }

  function setCustomStatus(message, isError = false) {
    customStatus.textContent = message;
    customStatus.classList.toggle("is-error", isError);
  }

  function parseCoordinateValue(value) {
    return Number(String(value).trim().replace(",", "."));
  }

  function parseCoordinatesText(text) {
    const value = String(text || "").trim();
    if (!value) {
      return null;
    }

    try {
      const parsedUrl = new URL(value);
      const latParam = parsedUrl.searchParams.get("mlat") || parsedUrl.searchParams.get("lat");
      const lonParam = parsedUrl.searchParams.get("mlon") || parsedUrl.searchParams.get("lon") || parsedUrl.searchParams.get("lng");
      if (latParam && lonParam) {
        return {
          lat: parseCoordinateValue(latParam),
          lon: parseCoordinateValue(lonParam)
        };
      }
    } catch {
      // Not a URL, continue with plain coordinate parsing.
    }

    const urlCoordinateMatch = value.match(/(?:#map=\d+\/|@|!3d)(-?\d{1,2}(?:[\.,]\d+)?)(?:\/|,|!4d)(-?\d{1,3}(?:[\.,]\d+)?)/);
    if (urlCoordinateMatch) {
      return {
        lat: parseCoordinateValue(urlCoordinateMatch[1]),
        lon: parseCoordinateValue(urlCoordinateMatch[2])
      };
    }

    const match = value.match(/(-?\d{1,2}(?:[\.,]\d+)?)[,\s;]+(-?\d{1,3}(?:[\.,]\d+)?)/);
    if (!match) {
      return null;
    }
    return {
      lat: parseCoordinateValue(match[1]),
      lon: parseCoordinateValue(match[2])
    };
  }

  function areValidCoordinates(coords) {
    return Boolean(
      coords &&
      Number.isFinite(coords.lat) &&
      coords.lat >= -90 &&
      coords.lat <= 90 &&
      Number.isFinite(coords.lon) &&
      coords.lon >= -180 &&
      coords.lon <= 180
    );
  }

  function setCoordinateInputs(coords) {
    customLatInput.value = coords.lat.toFixed(6);
    customLonInput.value = coords.lon.toFixed(6);
  }

  function getManualCoordinates() {
    const lat = parseCoordinateValue(customLatInput.value);
    const lon = parseCoordinateValue(customLonInput.value);
    return { lat, lon };
  }

  async function geocodeCustomQuery(query) {
    const url = new URL(NOMINATIM_SEARCH_URL);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", query);

    const res = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json"
      }
    });
    if (!res.ok) {
      throw new Error("Nepodarilo sa najst suradnice.");
    }
    const data = await res.json();
    const place = Array.isArray(data) ? data[0] : null;
    if (!place?.lat || !place?.lon) {
      throw new Error("Miesto sa nenaslo. Skus presnejsi nazov alebo vloz suradnice.");
    }
    return {
      lat: parseCoordinateValue(place.lat),
      lon: parseCoordinateValue(place.lon),
      name: normalizeWhitespaces(place.name || place.display_name || query)
    };
  }

  async function resolveCustomLocationCoordinates() {
    const manual = getManualCoordinates();
    if (customLatInput.value || customLonInput.value) {
      if (!areValidCoordinates(manual)) {
        throw new Error("Suradnice musia byt platne: latitude -90 az 90, longitude -180 az 180.");
      }
      return manual;
    }

    const query = normalizeWhitespaces(customQueryInput.value);
    if (!query) {
      throw new Error("Zadaj miesto, adresu alebo suradnice.");
    }

    const parsed = parseCoordinatesText(query);
    if (parsed) {
      if (!areValidCoordinates(parsed)) {
        throw new Error("Suradnice musia byt platne: latitude -90 az 90, longitude -180 az 180.");
      }
      setCoordinateInputs(parsed);
      return parsed;
    }

    const geocoded = await geocodeCustomQuery(query);
    if (!areValidCoordinates(geocoded)) {
      throw new Error("Najdene suradnice nie su platne.");
    }
    setCoordinateInputs(geocoded);
    if (!normalizeWhitespaces(customNameInput.value)) {
      customNameInput.value = geocoded.name;
    }
    return geocoded;
  }

  async function onFindCustomLocation() {
    try {
      setCustomStatus("Hladam suradnice...");
      const coords = await resolveCustomLocationCoordinates();
      setCoordinateInputs(coords);
      setCustomStatus(`Najdene: ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`);
    } catch (error) {
      setCustomStatus(error.message || "Nepodarilo sa najst lokalitu.", true);
    }
  }

  async function onAddCustomLocation() {
    let coords;
    try {
      coords = await resolveCustomLocationCoordinates();
    } catch (error) {
      setCustomStatus(error.message || "Nepodarilo sa pripravit lokalitu.", true);
      return;
    }

    const name = normalizeWhitespaces(customNameInput.value || customQueryInput.value);
    if (!name) {
      setCustomStatus("Zadaj nazov lokality.", true);
      return;
    }

    const customLocation = {
      name,
      lat: coords.lat,
      lon: coords.lon,
      note: "Vlastna ulozena fotolokacia.",
      category: "spot",
      source: "custom",
      bestSpots: ["Hlavny zaber lokality", "Smer k vychodu slnka", "Smer k zapadu slnka"]
    };
    const nextCustom = dedupeLocations([...(await loadCustomLocations()), customLocation]);
    await saveCustomLocations(nextCustom);

    locations = dedupeLocations([...locations.filter((loc) => loc.source !== "custom"), ...nextCustom]);
    repopulateLocationSelect();
    const savedIndex = locations.findIndex((loc) => loc.source === "custom" && loc.name === name);
    if (savedIndex >= 0) {
      locationSelect.value = String(savedIndex);
    }
    updateLocationsMeta();
    customNameInput.value = "";
    customQueryInput.value = "";
    customLatInput.value = "";
    customLonInput.value = "";
    setCustomStatus("Lokalita ulozena.");
  }

  function toLocationFromOsmElement(element) {
    const tags = element.tags || {};
    const name = tags["name:sk"] || tags.name;
    const lat = typeof element.lat === "number" ? element.lat : element.center?.lat;
    const lon = typeof element.lon === "number" ? element.lon : element.center?.lon;

    if (!name || typeof lat !== "number" || typeof lon !== "number") {
      return null;
    }

    const category = inferCategory(tags);
    return {
      name: normalizeWhitespaces(name),
      lat,
      lon,
      note: inferNote(category),
      category,
      source: "osm"
    };
  }

  async function fetchOsmLocationsFromWeb() {
    const query = `
[out:json][timeout:45];
area["ISO3166-1"="SK"][admin_level=2]->.searchArea;
(
  node["tourism"~"viewpoint|attraction|museum|castle"](area.searchArea);
  way["tourism"~"viewpoint|attraction|museum|castle"](area.searchArea);
  node["historic"~"castle|ruins|monument"](area.searchArea);
  way["historic"~"castle|ruins|monument"](area.searchArea);
  node["natural"~"peak|waterfall|cliff"](area.searchArea);
  way["natural"~"peak|waterfall|cliff"](area.searchArea);
);
out center;
`;

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: new URLSearchParams({ data: query }).toString()
    });

    if (!res.ok) {
      throw new Error("Nepodarilo sa nacitat lokality z OpenStreetMap.");
    }

    const data = await res.json();
    const elements = Array.isArray(data?.elements) ? data.elements : [];
    const parsed = elements.map(toLocationFromOsmElement).filter(Boolean);
    const deduped = dedupeLocations(parsed).sort((a, b) => a.name.localeCompare(b.name, "sk"));
    return deduped.slice(0, MAX_EXTRA_LOCATIONS);
  }

  async function loadExtraLocations() {
    const cached = getOsmCache();
    if (cached) {
      return cached;
    }
    const fresh = await fetchOsmLocationsFromWeb();
    saveOsmCache(fresh);
    return fresh;
  }

  async function onCheck() {
    try {
      renderLoading();
      const index = Number(locationSelect.value) || 0;
      const location = locations[index] || locations[0];
      const date = dateInput.value;
      if (!date) {
        throw new Error("Vyber datum.");
      }

      const [sunData, cloudCover] = await Promise.all([
        fetchSunData(location.lat, location.lon, date),
        fetchCloudCover(location.lat, location.lon)
      ]);

      const sunrise = new Date(sunData.sunrise);
      const sunset = new Date(sunData.sunset);

      const times = {
        sunrise,
        sunset,
        blueMorningFrom: addHours(sunrise.toISOString(), -1),
        blueMorningTo: sunrise,
        goldenMorningFrom: sunrise,
        goldenMorningTo: addHours(sunrise.toISOString(), 1),
        goldenEveningFrom: addHours(sunset.toISOString(), -1),
        goldenEveningTo: sunset,
        blueEveningFrom: sunset,
        blueEveningTo: addHours(sunset.toISOString(), 1)
      };

      const score = scoreByCloud(cloudCover);
      renderResult(location, date, times, cloudCover, score);
    } catch (error) {
      renderError(error.message || "Nastala neocakavana chyba.");
    }
  }

  async function init() {
    const customLocations = await loadCustomLocations();
    locations = dedupeLocations([...BASE_LOCATIONS.map((loc) => ({ ...loc, source: "curated" })), ...customLocations]);
    repopulateLocationSelect();
    setDefaultDate();
    updateLocationsMeta();
    renderLoading("Nacitavam slovenske fotolokacie z OpenStreetMap...");

    try {
      const imported = await loadExtraLocations();
      locations = dedupeLocations([...BASE_LOCATIONS.map((loc) => ({ ...loc, source: "curated" })), ...imported, ...customLocations]);
    } catch {
      locations = dedupeLocations([...BASE_LOCATIONS.map((loc) => ({ ...loc, source: "curated" })), ...customLocations]);
    }

    repopulateLocationSelect();
    updateLocationsMeta();
    await onCheck();
  }

  checkBtn.addEventListener("click", onCheck);
  addCustomBtn.addEventListener("click", onAddCustomLocation);
  findCustomBtn.addEventListener("click", onFindCustomLocation);
  customQueryInput.addEventListener("input", () => {
    customLatInput.value = "";
    customLonInput.value = "";
    setCustomStatus("");
  });
  customQueryInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onFindCustomLocation();
    }
  });
  if (isStandalonePage) {
    showPanel();
  }
  init();
})();
