const CACHE_KEY = "pz-build-cache";

function saveCache(cache) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function loadCache() {
    const json = localStorage.getItem(CACHE_KEY);

    if (!json) return {};

    try {
        return JSON.parse(json);
    } catch (e) {
        console.error("Failed to load cache:", e);
        return {};
    }
}

function saveBuild(name, url) {
    const cache = loadCache();
    cache[name] = url;
    saveCache(cache);
}

function refreshBuildList() {
    const select = document.getElementById("build-list");
    select.innerHTML = `<option id="build-list_placeholder" value="">${translations[currentLang].build_list_placeholder}</option>`;
    const cache = loadCache();

    for (const [name, url] of Object.entries(cache)) {
        const option = document.createElement("option");
        option.value = url;
        option.textContent = name;
        select.appendChild(option);
    }
}

document.getElementById("load-btn").addEventListener("click", () => {
    const url = document.getElementById("build-list").value;
    if (!url) return;
    location.href = url;
});