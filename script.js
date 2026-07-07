// ===== 상수 정의 =====
const CONSTANTS = {
    IGNORE_KEYS: ['value', 'str', 'fit', 'displayName', 'iconsrc', 'banned', 'id'],
    DEFAULT_STATS: { strength: 5, fitness: 5 },
    STAT_LIMIT: 10,
    LANGUAGES: { KO: 'ko', EN: 'en' }
};

// ===== 전역 변수 =====
const positiveDiv = document.getElementById('positive-items');
const negativeDiv = document.getElementById('negative-items');
const jobsDiv = document.getElementById('jobs');
const resultPanel = document.getElementById("result-panel");

let allJobs = [];
let allItems = [];
let currentLang = CONSTANTS.LANGUAGES.KO;
let extraStats = {};
let selectedIcons = [];
let translations = { ko: {}, en: {} };

// ===== 번역 로드 =====
Papa.parse("translations.csv", {
    download: true,
    header: true,
    complete: (results) => {
        results.data.forEach(row => {
            const key = row.key.trim();
            if (!translations.ko[key]) translations.ko[key] = row.ko.trim();
            if (!translations.en[key]) translations.en[key] = row.en.trim();
        });
    }
});

// ===== CSV 로드 =====
function loadCSV() {
    Papa.parse("jobs.csv", {
        download: true,
        header: true,
        complete: (results) => {
            allJobs = results.data;
            Papa.parse("items.csv", {
                download: true,
                header: true,
                complete: (results2) => {
                    allItems = results2.data;
                    renderUI();
                }
            });
        }
    });
}

// ===== 통계 파싱 =====
function parseStats(statsStr = "") {
    const stats = {};
    statsStr.split(";").forEach(pair => {
        const [key, value] = pair.split(":");
        if (key) stats[key] = parseInt(value) || 0;
    });
    return stats;
}

// ===== 데이터셋에서 불필요한 키 필터링 =====
function filterStats(dataset) {
    const customStats = {};
    Object.entries(dataset).forEach(([key, value]) => {
        if (!CONSTANTS.IGNORE_KEYS.includes(key)) {
            customStats[key] = parseInt(value) || 0;
        }
    });
    return customStats;
}

// ===== 옵션 생성 =====
function createOption(row, isJob) {
    const names = row["항목"].split(";");
    const displayName = names[currentLang === "ko" ? 0 : 1] || names[0];
    const value = parseInt(row["값"]) || 0;
    const stats = parseStats(row.stats);
    const iconSrc = row.icon?.trim() || "default.png";
    const banned = row["금지항목"]?.trim() || "";

    const label = document.createElement("label");
    label.className = "flex items-center justify-between p-2 border rounded-lg cursor-pointer";

    const iconSize = isJob ? "w-16 h-16" : "w-6 h-6";
    const colorClass = !isJob ? (value >= 0 ? "text-red-600" : "text-green-600") : "";
    const displayValue = value >= 0 ? `+${value}` : value;

    label.innerHTML = `
        <div class="flex items-center min-w-[150px]">
            <img src="${iconSrc}" class="${iconSize} mr-2">
            <span class="${colorClass}">${displayName} (${displayValue})</span>
        </div>
        <input
            type="${isJob ? "radio" : "checkbox"}"
            ${isJob ? 'name="job"' : ""}
            class="w-4 h-4">
    `;

    const input = label.querySelector("input");
    Object.entries(stats).forEach(([key, val]) => {
        input.dataset[key] = val;
    });
    input.dataset.banned = banned;
    input.dataset.displayName = displayName;
    input.dataset.iconsrc = iconSrc;
    input.dataset.value = value;
    input.dataset.id = names[1].trim();

    input.addEventListener("change", () => {
        if (isJob && input.checked) window.currentJob = { name: displayName, icon: iconSrc };
        updateSum();
    });

    return { label, value };
}

// ===== 상쇄 특성에 따라 옵션 비활성화 =====
// TODO: 상쇄 특성에 따라 라디오 옵션 비활성화

// ===== UI 렌더링 =====
function renderUI() {
    jobsDiv.innerHTML = "";
    positiveDiv.innerHTML = "";
    negativeDiv.innerHTML = "";

    allJobs.forEach(row => {
        if (row["항목"]) {
            const option = createOption(row, true);
            jobsDiv.appendChild(option.label);
        }
    });

    allItems.forEach(row => {
        if (row["항목"]) {
            const option = createOption(row, false);
            if (option.value >= 0)
                positiveDiv.appendChild(option.label);
            else
                negativeDiv.appendChild(option.label);
        }
    });

    updateSum();
}

// ===== 특성 초기화 =====
function resetExtraStats() {
    Object.values(extraStats).forEach(div => div.remove());
    extraStats = {};
}

// ===== 결과 값 업데이트 =====
function updateResultDisplay(key, value, element) {
    element.classList.remove("text-red-600", "text-black-600", "text-green-600");

    if (key === "sum") {
        element.classList.add(value < 0 ? "text-red-600" : "text-green-600");
        element.innerText = `${translations[currentLang].sum} : ${value}`;
    } else {
        const isOutOfRange = value > CONSTANTS.STAT_LIMIT || value < 0;
        element.classList.add(isOutOfRange ? "text-red-600" : "text-black-600");
        element.innerText = `${translations[currentLang][key]} : ${value}/${CONSTANTS.STAT_LIMIT}`;
    }
}

// ===== 합계 계산 =====
function updateSum() {
    resetExtraStats();
    selectedIcons = [];

    let sum = 0;
    let strength = CONSTANTS.DEFAULT_STATS.strength;
    let fitness = CONSTANTS.DEFAULT_STATS.fitness;
    const statsTotal = {};
    const bannedTraits = new Set();

    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        if (!input.checked) return;

        // 금지 특성 수집
        const banned = input.dataset.banned;
        if (banned) {
            banned.split(";").forEach(trait =>
                bannedTraits.add(trait.trim())
            );
        }

        // 아이콘 수집
        if(input.type == "checkbox") {
            const { iconsrc, displayName } = input.dataset;
            if (iconsrc && displayName && !selectedIcons.some(icon => icon.src === iconsrc)) {
                selectedIcons.push({ src: iconsrc, name: displayName, value: parseInt(input.dataset.value) });
            }
        }

        // 기본 값 누적
        sum += parseInt(input.dataset.value) || 0;
        strength += parseInt(input.dataset.str) || 0;
        fitness += parseInt(input.dataset.fit) || 0;

        // 커스텀 통계 누적
        const customStats = filterStats(input.dataset);
        Object.entries(customStats).forEach(([key, value]) => {
            statsTotal[key] = (statsTotal[key] || 0) + value;
        });
    });

    // 결과 표시
    updateResultDisplay("sum", sum, document.getElementById("result-sum"));
    updateResultDisplay("strength", strength, document.getElementById("result-strength"));
    updateResultDisplay("fitness", fitness, document.getElementById("result-fitness"));

    // 동적 항목 표시
    Object.entries(statsTotal).forEach(([statName, value]) => {
        const label = translations[currentLang][statName] || statName;
        if (!extraStats[statName]) {
            const div = document.createElement('div');
            div.id = `result-${statName}`;
            div.className = `py-1 px-2 border rounded-xl bg-white shadow text-lg font-semibold text-center ${value === 0 ? "text-gray-500" : "text-green-600"}`;

            const iconContainer = document.getElementById('result-icons');
            if (iconContainer) {
                resultPanel.insertBefore(div, iconContainer);
            } else {
                resultPanel.appendChild(div);
            }
            extraStats[statName] = div;
        }
        extraStats[statName].innerText = value === 0 ? label : `${label} +${value}`;
    });
    disableButtons(bannedTraits);
    renderSelectedIcons();

    window.currentResult = {
        sum,
        strength,
        fitness,
        icons: [...selectedIcons],
        customStats: { ...statsTotal }
    };
}

// ===== 버튼 disable =====
function disableButtons(bannedTraits) {
    document.querySelectorAll('input[type="checkbox"]').forEach(input => {
        const id = input.dataset.id;

        if (bannedTraits.has(id)) {
            input.disabled = true;
            input.parentElement.classList.add("opacity-50");
            if (input.checked) {
                input.checked = false;
                updateSum();
            }
        } else {
            input.disabled = false;
            input.parentElement.classList.remove("opacity-50");
        }
    });
}

// ===== 아이콘 렌더링 =====
function renderSelectedIcons() {
    let iconContainer = document.getElementById("result-icons");
    if (!iconContainer) {
        iconContainer = document.createElement("div");
        iconContainer.id = "result-icons";
        iconContainer.className = "flex flex-wrap justify-center gap-2 p-2 border-t";
        resultPanel.appendChild(iconContainer);
    }

    iconContainer.innerHTML = "";
    selectedIcons.forEach(icon => {
        const img = document.createElement("img");
        img.src = icon.src;
        img.className = "w-6 h-6 rounded shadow";
        img.title = icon.name;
        iconContainer.appendChild(img);
    });
}

// ===== 초기화 =====
loadCSV();

// ===== 언어 변경 =====
document.getElementById("lang-ko").addEventListener("click", () => {
    currentLang = CONSTANTS.LANGUAGES.KO;
    renderUI();
});

document.getElementById("lang-en").addEventListener("click", () => {
    currentLang = CONSTANTS.LANGUAGES.EN;
    renderUI();
});