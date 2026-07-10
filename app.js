// Interactive Level Finder State and Routing Logic
let currentStepId = 'step-1';
const userChoices = {
  needsStorage: null,
  needsRealtime: null,
  needsAI: null
};

// Map of levels descriptions and titles for results
const levelResults = {
  1: {
    title: 'Lv.1 純前端',
    sub: '自我練習版 ｜ 算完就忘',
    desc: '您的工具主要用於單次計算、隨機抽籤或互動教材演示。因為不需要記住學生成績或調用 AI，純網頁前端開發最簡單、免費且安全。',
    theme: 'result-theme-lv1'
  },
  2: {
    title: 'Lv.2 前端 ＋ Google Sheets',
    sub: '課後回收版 ｜ 存進試算表',
    desc: '您需要把學生的作答紀錄或點名資料留存下來，但不需要全班即時搶答競爭。選擇 Google 試算表當後端最適合您，打開就能用 Excel 公式算成績。',
    theme: 'result-theme-lv2'
  },
  3: {
    title: 'Lv.3 前端 ＋ Firebase',
    sub: '即時競賽版 ｜ 即時多人同步',
    desc: '您的工具需要全班同時在線互動，例如即時排行榜、多人共用看板。Firebase 的實時資料庫（Realtime Database）是您的不二之選，能達到毫秒級即時更新。',
    theme: 'result-theme-lv3'
  },
  4: {
    title: 'Lv.4 前端 ＋ 後端 ＋ AI',
    sub: 'AI 即時講解版 ｜ 用完即走',
    desc: '您需要讓 AI 幫忙閱卷、潤稿、或是扮演對話家教，但您不需要將 AI 的對話或成績存入資料庫。為了金鑰安全，請務必使用 Netlify Functions 等輕量後端代打 AI。',
    theme: 'result-theme-lv4'
  },
  5: {
    title: 'Lv.5 ＋AI ＋ 資料庫',
    sub: 'AI 學習歷程版 ｜ 完整全端架構',
    desc: '最完整的終極系統！您既需要 AI 的思考與批改，也需要把這些 AI 的評語和分數存下來，累積成學生的學習歷程畫像。這需要同時扛起金鑰安全與個資規則。',
    theme: 'result-theme-lv5'
  }
};

/**
 * Handle answers to questions in the Level Finder questionnaire
 * @param {number} questionNum The current question number being answered
 * @param {boolean} answer The true/false answer selected by user
 */
function answerQuestion(questionNum, answer) {
  const activeStep = document.getElementById(currentStepId);
  if (activeStep) {
    activeStep.classList.remove('active');
  }

  const progressIndicator = document.getElementById('finder-progress');

  if (questionNum === 1) {
    userChoices.needsStorage = answer;
    if (answer) {
      // Needs storage -> Go to Q2
      currentStepId = 'step-2';
      progressIndicator.innerText = 'STEP 2 OF 3';
    } else {
      // Doesn't need storage -> Go to Q3 (No-Storage Flow)
      currentStepId = 'step-3';
      progressIndicator.innerText = 'STEP 2 OF 3';
    }
  } 
  else if (questionNum === 2) {
    userChoices.needsRealtime = answer;
    if (answer) {
      // Needs realtime + storage -> Go to Q4 (Realtime AI flow)
      currentStepId = 'step-4';
      progressIndicator.innerText = 'STEP 3 OF 3';
    } else {
      // Non-realtime + storage -> Go to Q5 (Non-realtime AI flow)
      currentStepId = 'step-5';
      progressIndicator.innerText = 'STEP 3 OF 3';
    }
  } 
  else if (questionNum === 3) {
    // No-Storage Flow AI question
    userChoices.needsAI = answer;
    showResult(answer ? 4 : 1);
  } 
  else if (questionNum === 4) {
    // Storage + Realtime Flow AI question
    userChoices.needsAI = answer;
    showResult(answer ? 5 : 3);
  } 
  else if (questionNum === 5) {
    // Storage + Non-realtime Flow AI question
    userChoices.needsAI = answer;
    showResult(answer ? 5 : 2);
  }

  // Activate the new step
  const nextStep = document.getElementById(currentStepId);
  if (nextStep) {
    nextStep.classList.add('active');
  }
}

/**
 * Render the recommended Level Finder result
 * @param {number} recommendedLevel The recommended level (1 to 5)
 */
function showResult(recommendedLevel) {
  currentStepId = 'step-result';
  const progressIndicator = document.getElementById('finder-progress');
  progressIndicator.innerText = 'COMPLETE!';
  progressIndicator.style.background = 'var(--neon-green)';

  const result = levelResults[recommendedLevel];
  
  // Update result view content
  document.getElementById('result-lv-title').innerText = result.title;
  document.getElementById('result-lv-sub').innerText = result.sub;
  document.getElementById('result-desc').innerText = result.desc;

  // Set Theme color box
  const themeBox = document.getElementById('result-theme-box');
  // Clear any existing theme classes
  themeBox.className = 'result-level-box';
  themeBox.classList.add(result.theme);

  // Set detailed link target level
  const detailsBtn = document.getElementById('view-details-btn');
  detailsBtn.setAttribute('onclick', `scrollToLevel(${recommendedLevel})`);
  detailsBtn.setAttribute('href', '#levels-section');
}

/**
 * Reset Level Finder questionnaire back to Step 1
 */
function resetFinder() {
  const activeStep = document.getElementById(currentStepId);
  if (activeStep) {
    activeStep.classList.remove('active');
  }

  // Reset progress indicator
  const progressIndicator = document.getElementById('finder-progress');
  progressIndicator.innerText = 'STEP 1 OF 3';
  progressIndicator.style.background = 'var(--neon-blue)';

  // Reset choices
  userChoices.needsStorage = null;
  userChoices.needsRealtime = null;
  userChoices.needsAI = null;

  currentStepId = 'step-1';
  document.getElementById('step-1').classList.add('active');
}

// Level Detailed Tabs Navigation Logic
const tabs = document.querySelectorAll('.nav-tab');
const panes = document.querySelectorAll('.level-pane');
const contentBox = document.getElementById('level-content-box');

// Mapping for levels container theme classes
const levelThemes = {
  lv1: 'lv1-theme',
  lv2: 'lv2-theme',
  lv3: 'lv3-theme',
  lv4: 'lv4-theme',
  lv5: 'lv5-theme'
};

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.getAttribute('data-target');
    switchLevelTab(target);
  });
});

/**
 * Switch the active level detailed info tab
 * @param {string} targetKey The level string key, e.g. "lv1", "lv2" etc.
 */
function switchLevelTab(targetKey) {
  // Update active tab button style
  tabs.forEach(t => t.classList.remove('active'));
  const activeTab = document.querySelector(`.nav-tab[data-target="${targetKey}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  // Update active detailed panel
  panes.forEach(pane => pane.classList.remove('active'));
  const activePane = document.getElementById(`pane-${targetKey}`);
  if (activePane) {
    activePane.classList.add('active');
  }

  // Update container border and card theme coloring
  contentBox.className = 'level-content-box';
  contentBox.classList.add(levelThemes[targetKey]);
}

/**
 * Scroll smoothly down to the levels section and select the recommended level tab
 * @param {number} levelNum The level number to navigate to (1 to 5)
 */
function scrollToLevel(levelNum) {
  const targetKey = 'lv' + levelNum;
  switchLevelTab(targetKey);
  
  // Smooth scroll
  const section = document.getElementById('levels-section');
  if (section) {
    setTimeout(() => {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }
}
