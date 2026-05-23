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

// 保存されている完了データを取得
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

    const button = document.createElement("button");
    button.textContent = "入力";
    button.addEventListener("click", () => {
      // アクティブタブにスクリプトを実行
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;

        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: fillDateInputs,
          args: [period],
        });
      });

      // 完了マークを付ける
      label.classList.add("done");
      // 保存する
      chrome.storage.local.get([STORAGE_KEY], (res) => {
        const done = res[STORAGE_KEY] || [];
        if (!done.includes(index)) {
          done.push(index);
          chrome.storage.local.set({ [STORAGE_KEY]: done });
        }
      });
    });

    div.appendChild(label);
    div.appendChild(button);
    periodsContainer.appendChild(div);
  });
});

// ページ側で実行される関数
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

    // React/Vue対応: input イベントを発火させる
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
  } else {
    alert("CMSの日付入力欄が見つかりません。セレクタを確認してください。");
  }
}
