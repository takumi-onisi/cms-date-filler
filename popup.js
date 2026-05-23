// ハードコーディングされた期間データ
// 各要素は [開始日, 終了日] の形式
// 日付文字列は YYYY-MM-DD
const PERIODS = [
  ["2000-01-01", "2000-12-31"],
  ["2001-01-01", "2001-12-31"],
  ["2002-01-01", "2002-12-31"],
];

// 保存用キー
const STORAGE_KEY = "completedPeriods";

// ページにパネルを生成
const periodsContainer = document.getElementById("periods");

// 現在押されている入力ボタン
let activeInputIndex = null;

chrome.storage.local.get([STORAGE_KEY], (result) => {
  const completed = result[STORAGE_KEY] || [];

  PERIODS.forEach((period, index) => {
    const div = document.createElement("div");
    div.className = "period";

    const label = document.createElement("span");
    label.textContent = `${period[0]} ~ ${period[1]}`;

    if (completed.includes(index)) {
      label.classList.add("done");
    }

    // =========================
    // 入力ボタン
    // =========================

    const inputBtn = document.createElement("button");
    inputBtn.textContent = "入力";

    inputBtn.addEventListener("click", () => {
      // 以前の押下状態解除
      document
        .querySelectorAll(".input-active")
        .forEach((btn) => btn.classList.remove("input-active"));

      // 現在を押下状態へ
      inputBtn.classList.add("input-active");

      activeInputIndex = index;

      // 対応する検索ボタンだけ有効化
      document
        .querySelectorAll(".search-btn")
        .forEach((btn) => (btn.disabled = true));

      searchBtn.disabled = false;

      // CMSへ日付入力
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: fillDateInputs,
          args: [period],
        });
      });
    });

    // =========================
    // 検索ボタン
    // =========================

    const searchBtn = document.createElement("button");

    searchBtn.textContent = "検索";

    searchBtn.classList.add("search-btn");

    // 初期状態は押せない
    searchBtn.disabled = true;

    searchBtn.addEventListener("click", () => {
      // 対応入力ボタン押下中のみ許可
      if (activeInputIndex !== index) {
        return;
      }

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: clickSearchButton,
        });
      });

      // 完了マークを付ける
      label.classList.add("done");

      // 入力ボタン押下状態解除
      inputBtn.classList.remove("input-active");

      activeInputIndex = null;

      // 検索ボタン無効化
      searchBtn.disabled = true;

      // 保存
      chrome.storage.local.get([STORAGE_KEY], (res) => {
        let done = res[STORAGE_KEY] || [];

        if (!done.includes(index)) {
          done.push(index);
        }

        chrome.storage.local.set({
          [STORAGE_KEY]: done,
        });

        // =========================
        // 全完了判定
        // =========================

        if (done.length === PERIODS.length) {
          // 少し遅延してリセット
          setTimeout(() => {
            // done解除
            document
              .querySelectorAll(".period span")
              .forEach((s) => s.classList.remove("done"));

            // 入力ボタン状態解除
            document
              .querySelectorAll(".input-active")
              .forEach((btn) => btn.classList.remove("input-active"));

            // 検索ボタン無効化解除
            document
              .querySelectorAll(".search-btn")
              .forEach((btn) => (btn.disabled = true));

            // storage初期化
            chrome.storage.local.set({
              [STORAGE_KEY]: [],
            });

            activeInputIndex = null;
          }, 300);
        }
      });
    });

    div.appendChild(label);
    div.appendChild(inputBtn);
    div.appendChild(searchBtn);

    periodsContainer.appendChild(div);
  });
});

// ====================================
// CMSへ日付入力
// ====================================

function fillDateInputs(period) {
  const [start, end] = period;

  const [startY, startM, startD] = start.split("-"); // 年月日
  const [endY, endM, endD] = end.split("-");

  // CMSのinput要素に合わせてセレクタを変更してください
  const startYearInput = document.querySelector("#start_year");
  const startMonthInput = document.querySelector("#start_month");
  const startDayInput = document.querySelector("#start_day");

  const endYearInput = document.querySelector("#end_year");
  const endMonthInput = document.querySelector("#end_month");
  const endDayInput = document.querySelector("#end_day");

  if (
    startYearInput &&
    startMonthInput &&
    startDayInput &&
    endYearInput &&
    endMonthInput &&
    endDayInput
  ) {
    startYearInput.value = startY;
    startMonthInput.value = startM;
    startDayInput.value = startD;

    endYearInput.value = endY;
    endMonthInput.value = endM;
    endDayInput.value = endD;

    // CMSのinput要素に合わせてセレクタを変更してください
    [
      startYearInput,
      startMonthInput,
      startDayInput,
      endYearInput,
      endMonthInput,
      endDayInput,
    ].forEach((input) => {
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
}

// ====================================
// CMS検索ボタン
// ====================================

function clickSearchButton() {
  // CMSの検索ボタンセレクタを適宜修正してください
  const searchBtn = document.querySelector("#search_btn");

  if (searchBtn) {
    searchBtn.click();
  } else {
    alert("検索ボタンが見つかりません。セレクタを確認してください。");
  }
}
