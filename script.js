const positiveDiv = document.getElementById('positive-items');
const negativeDiv = document.getElementById('negative-items');
const jobsDiv = document.getElementById('jobs');
const resultDiv = document.getElementById('result');

let allJobs = [];
let allItems = [];
let currentLang = "ko"; // "ko" 또는 "en"
// 번역 테이블
let translations = {
    ko: {
        sum: "포인트",
        strength: "근력",
        fitness: "체력"
    },
    en: {
        sum: "Point",
        strength: "Strength",
        fitness: "Fitness"
    }
};
// 2. CSV 로딩 후 업데이트
Papa.parse("translations.csv", {
    download: true,
    header: true,
    complete: function (results) {
        results.data.forEach(row => {
            const key = row.key.trim();   // 예: "Agriculture"
            if (!translations.ko[key]) translations.ko[key] = row.ko.trim();
            if (!translations.en[key]) translations.en[key] = row.en.trim();
        });

        // console.log(translations);
        // 이제 translations.ko["Agriculture"] -> "농업"
        // translations.en["Agriculture"] -> "Agriculture"
    }
});



function loadCSV() {
    Papa.parse("jobs.csv", {
        download: true,
        header: true,
        complete: function (results) {
            allJobs = results.data;
            Papa.parse("items.csv", {
                download: true,
                header: true,
                complete: function (results2) {
                    allItems = results2.data;
                    renderUI();
                }
            });
        }
    });
}

function renderUI() {
    jobsDiv.innerHTML = "";
    positiveDiv.innerHTML = "";
    negativeDiv.innerHTML = "";

    // ---- 직업 ----
    allJobs.forEach(row => {
        if (!row["항목"]) return;

        const names = row["항목"].split(";");
        const langIndex = currentLang === "ko" ? 0 : 1;
        const displayName = names[langIndex] || names[0];

        const value = parseInt(row["값"]) || 0;
        const statsStr = row.stats || "";
        const statPairs = statsStr.split(";"); // str:2;sta:1 ...
        const statObj = {};
        statPairs.forEach(pair => {
            const [key, val] = pair.split(":");
            if (key) statObj[key] = parseInt(val) || 0;
        });
        const displayValue = value >= 0 ? `+${value}` : `${value}`;

        const label = document.createElement("label");
        //label.className = "flex items-center p-2 border rounded-lg cursor-pointer";
        label.className = "flex items-center justify-between p-2 border rounded-lg cursor-pointer";

        const iconSrc = row.icon && row.icon.trim() !== "" ? row.icon : "default.png";

        label.innerHTML = `
        <div class="flex items-center min-w-[150px]">
          <img src="${iconSrc}" class="w-16 h-16 mr-2" alt="아이콘">
          <span>${displayName} (${displayValue})</span>
        </div>
        <input type="radio" name="job" data-value="${value}" data-display-name="${displayName}"  class="w-4 h-4">
      `;

        jobsDiv.appendChild(label);

        const input = label.querySelector("input");
        // statObj의 모든 key-value를 dataset으로 저장
        for (const statKey in statObj) {
            input.dataset[statKey] = statObj[statKey];  // 예: input.dataset.str = 2
        }
        input.dataset.value = value;
        input.addEventListener("change", updateSum);
    });

    // ---- 특성 ----
    allItems.forEach(row => {
        if (!row["항목"]) return;

        const names = row["항목"].split(";");
        const langIndex = currentLang === "ko" ? 0 : 1;
        const displayName = names[langIndex] || names[0];

        const value = parseInt(row["값"]) || 0;
        const statsStr = row.stats || "";
        const statPairs = statsStr.split(";"); // str:2;fit:1 ...
        const statObj = {};
        statPairs.forEach(pair => {
            const [key, val] = pair.split(":");
            if (key) statObj[key] = parseInt(val) || 0;
        });

        const colorClass = value >= 0 ? "text-red-600" : "text-green-600";
        const displayValue = value >= 0 ? `+${value}` : `${value}`;

        const label = document.createElement("label");
        label.className = "flex items-center justify-between p-2 border rounded-lg cursor-pointer";

        const iconSrc = row.icon && row.icon.trim() !== "" ? row.icon : "default.png";

        label.innerHTML = `
        <div class="flex items-center min-w-[150px]">
            <img src="${iconSrc}" class="w-6 h-6 mr-2" alt="아이콘">
            <span class="${colorClass}">${displayName}(${displayValue})</span>
          </div>
          <input type="checkbox"  data-value="${value}" data-display-name="${displayName}" data-iconsrc="${iconSrc}"
            ${Object.entries(statObj).map(([k, v]) => `data-value="${value}"`).join(" ")}
          class="w-4 h-4">
        `;

        if (value >= 0) positiveDiv.appendChild(label);
        else negativeDiv.appendChild(label);

        const input = label.querySelector("input");
        // statObj의 모든 key-value를 dataset으로 저장
        for (const statKey in statObj) {
            input.dataset[statKey] = statObj[statKey];  // 예: input.dataset.str = 2
        }
        input.dataset.value = value;
        input.addEventListener("change", updateSum);
    });

    updateSum(); // 초기 합계 계산
}

//특성 초기화
function resetExtraStats() {
    for (const key in extraStats) {
        extraStats[key].remove(); // 기존 div 삭제
    }
    Object.keys(extraStats).forEach(k => delete extraStats[k]);
}

const extraStats = {}; // key: div id, value: div element
let selectedIcons = [];
// 합계 계산
function updateSum() {
    resetExtraStats();
    selectedIcons = []; // 아이콘 배열 초기화


    let sum = 0, strength = 5, fitness = 5;
    const statsTotal = {};
    const ignoreStats = []; // 무시할 통계 항목
    document.querySelectorAll('input[type="radio"]').forEach(input => {
        //직업 먼저 ignore 확인
        if (input.checked) {
            // stats 처리
            for (const key in input.dataset) {
                if (key != 'value' && key != 'str' && key != 'fit' && key != 'displayName' && key != 'iconsrc') {
                    const statName = key;
                    //console.log(statName);
                    let value = parseInt(input.dataset[key]) || 0;
                    if (value == 0) {
                        ignoreStats.push(statName); // 무시할 통계 항목 추가
                    }
                }

            }
        }
    });



    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        if (input.checked) {


            if (ignoreStats.length > 0) {
                if (translations[currentLang][ignoreStats[0]] == input.dataset.displayName) {
                    //console.log(`무시: ${input.dataset.displayName}`);
                    return; // 무시할 항목이면 건너뛰기
                }
            }
            const iconSrc = input.dataset.iconsrc;
            if (iconSrc != null && input.dataset.displayName != null) {
                // 배열에 같은 src 가진 게 이미 있는지 체크
                const exists = selectedIcons.some(icon => icon.src === iconSrc);
                if (!exists) {
                    selectedIcons.push({
                        src: iconSrc,
                        name: input.dataset.displayName // 툴팁에 표시할 이름
                    });
                }
            }



            sum += parseInt(input.dataset.value) || 0;
            strength += parseInt(input.dataset.str) || 0;
            fitness += parseInt(input.dataset.fit) || 0;

            const val = parseInt(input.dataset.value) || 0;
            // stats 처리
            for (const key in input.dataset) {
                if (key != 'value' && key != 'str' && key != 'fit' && key != 'displayName' && key != 'iconsrc') {
                    const statName = key;
                    let value = parseInt(input.dataset[key]) || 0;
                    //console.log( value);
                    statsTotal[statName] = (statsTotal[statName] || 0) + parseInt(input.dataset[key] || 0);

                }
            }
        }
    });

    let resultSum = document.getElementById("result-sum");
    resultSum.classList.remove("text-red-600", "text-green-600");
    if (sum < 0) {
        resultSum.classList.add("text-red-600");
    } else {
        resultSum.classList.add("text-green-600");
    }
    resultSum.innerText = `${translations[currentLang].sum} : ${sum}`;

    let resultStrength = document.getElementById("result-strength");
    resultStrength.classList.remove("text-red-600", "text-black-600");
    if (strength > 10 || strength < 0) {
        resultStrength.classList.add("text-red-600");
    } else {
        resultStrength.classList.add("text-black-600");
    }
    resultStrength.innerText = `${translations[currentLang].strength} : ${strength}/10`;
    let resultFitness = document.getElementById("result-fitness");
    resultFitness.classList.remove("text-red-600", "text-black-600");
    if (fitness > 10 || fitness < 0) {
        resultFitness.classList.add("text-red-600");
    } else {
        resultFitness.classList.add("text-black-600");
    }
    document.getElementById("result-fitness").innerText = `${translations[currentLang].fitness} : ${fitness}/10`;

    // 동적 항목 표시
    for (const statName in statsTotal) {
        const key = statName.trim();
        const label = translations[currentLang][key] || statName;

        if (!extraStats[statName]) {
            const div = document.createElement('div');

            div.id = `result-${statName}`;
            const value = statsTotal[statName];
            div.innerText = value == 0 ? `${label}` : `${label} +${statsTotal[statName]}`;
            div.className = `py-1 px-2 border rounded-xl bg-white shadow text-lg font-semibold text-center
            ${value == 0 ? "text-gray-500" : "text-green-600"} `;

            // 아이콘 영역보다 위에만 삽입
            const resultPanel = document.getElementById('result-panel');
            const iconContainer = document.getElementById('result-icons');
            if (iconContainer) {
                resultPanel.insertBefore(div, iconContainer); // 아이콘 영역 위에 넣기
            } else {
                resultPanel.appendChild(div);
            }
            extraStats[statName] = div;
        } else {
            extraStats[statName].innerText = `${label} +${statsTotal[statName]}`;
        }
    }
    // 아이콘 표시
    renderSelectedIcons();
}

function renderSelectedIcons() {
    const resultPanel = document.getElementById("result-panel");

    // 아이콘 영역 없으면 새로 생성
    let iconContainer = document.getElementById("result-icons");
    if (!iconContainer) {
        iconContainer = document.createElement("div");
        iconContainer.id = "result-icons";
        iconContainer.className = "flex flex-wrap justify-center gap-2 p-2 border-t";
        resultPanel.appendChild(iconContainer); // 항상 맨 아래 추가
    }

    iconContainer.innerHTML = ""; // 초기화

    // 선택된 아이콘 표시
    selectedIcons.forEach(icon => {
        const img = document.createElement("img");
        img.src = icon.src;
        img.className = "w-6 h-6 rounded shadow";
        img.title = icon.name; // 마우스 올리면 이름 표시
        iconContainer.appendChild(img);
    });
}
// CSV 불러오기
loadCSV('items.csv', positiveDiv); // 양수/음수는 함수 내에서 처리
loadCSV('jobs.csv', jobsDiv, { colorPositive: 'text-blue-500', colorNegative: 'text-blue-700', type: 'radio', name: 'job' });
updateSum();

// 언어 전환 버튼
document.getElementById("lang-ko").addEventListener("click", () => {
    currentLang = "ko";
    renderUI(); // UI 다시 그림
});

document.getElementById("lang-en").addEventListener("click", () => {
    currentLang = "en";
    renderUI(); // UI 다시 그림
});