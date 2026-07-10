import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  getDocs,
  deleteDoc, 
  onSnapshot, 
  serverTimestamp, 
  writeBatch 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global elements & State
const submissionsCol = collection(db, "submissions");
const settingsDoc = doc(db, "settings", "lockState");

// Helper: Show notification toast
function showToast(text, isError = false) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  const icon = document.getElementById("toast-icon");
  const msg = document.getElementById("toast-text");
  
  toast.className = `notification ${isError ? 'error' : 'success'} show`;
  icon.innerText = isError ? "❌" : "✓";
  msg.innerText = text;
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// -------------------------------------------------------------
// STUDENT / SUBMISSION PAGE LOGIC
// -------------------------------------------------------------
function initStudentPage() {
  const form = document.getElementById("submission-form");
  const input = document.getElementById("word-input");
  const submitBtn = document.getElementById("submit-btn");
  const lockScreen = document.getElementById("lock-screen");
  const recentWordsList = document.getElementById("recent-words-list");
  const recentContainer = document.getElementById("recent-submissions-container");

  // Listen to lock state from Firestore
  onSnapshot(settingsDoc, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.isLocked) {
        lockScreen.style.display = "flex";
        input.disabled = true;
        submitBtn.disabled = true;
      } else {
        lockScreen.style.display = "none";
        input.disabled = false;
        submitBtn.disabled = false;
      }
    } else {
      // Default to unlocked if document does not exist
      lockScreen.style.display = "none";
      input.disabled = false;
      submitBtn.disabled = false;
    }
  });

  // Load and render recent local submissions
  let myRecentWords = JSON.parse(localStorage.getItem("my_words") || "[]");
  function updateRecentList() {
    if (myRecentWords.length > 0) {
      recentContainer.style.display = "block";
      recentWordsList.innerHTML = "";
      myRecentWords.forEach(word => {
        const tag = document.createElement("span");
        tag.className = "word-tag";
        tag.innerText = word;
        recentWordsList.appendChild(tag);
      });
    } else {
      recentContainer.style.display = "none";
    }
  }
  updateRecentList();

  // Handle Form Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const rawWord = input.value.trim();
    if (!rawWord) return;

    if (rawWord.length > 15) {
      showToast("詞彙過長，上限 15 字", true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "傳送中...";

    try {
      // Add submission doc to firestore
      await addDoc(submissionsCol, {
        text: rawWord,
        timestamp: serverTimestamp()
      });

      // Save locally
      if (!myRecentWords.includes(rawWord)) {
        myRecentWords.unshift(rawWord); // Add to beginning
        if (myRecentWords.length > 10) myRecentWords.pop(); // Keep last 10
        localStorage.setItem("my_words", JSON.stringify(myRecentWords));
      }
      
      showToast("送出成功！");
      input.value = "";
      updateRecentList();
    } catch (err) {
      console.error(err);
      showToast("傳送失敗，請重試", true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "🚀 送出答案";
    }
  });
}

// -------------------------------------------------------------
// PRESENTATION SCREEN PAGE LOGIC
// -------------------------------------------------------------
function initScreenPage() {
  const container = document.getElementById("cloud-container");
  const totalSubmissionsEl = document.getElementById("total-submissions-count");
  const uniqueWordsEl = document.getElementById("unique-words-count");
  const joinUrlDisplay = document.getElementById("join-url-display");
  const lockBtn = document.getElementById("lock-btn");
  const lockBtnIcon = document.getElementById("lock-btn-icon");
  const lockBtnText = document.getElementById("lock-btn-text");
  const clearBtn = document.getElementById("clear-btn");
  const demoBtn = document.getElementById("demo-btn");
  const loadingEl = document.getElementById("cloud-loading");

  // Display URL for students to join
  const joinURL = window.location.origin;
  joinUrlDisplay.innerText = joinURL;

  let currentLockState = false;
  let wordsData = []; // [{text, count}]

  // Preset Colors for Word Cloud
  const neonColors = [
    "#0284c7", // Neon Blue
    "#db2777", // Neon Pink
    "#d97706", // Neon Yellow / Orange
    "#059669", // Neon Green
    "#7c3aed", // Neon Purple
    "#ff5e00", // Bright Orange
    "#f43f5e"  // Rose
  ];

  // Listen to lock state
  onSnapshot(settingsDoc, (docSnap) => {
    if (docSnap.exists()) {
      currentLockState = docSnap.data().isLocked;
    } else {
      currentLockState = false;
    }
    // Update UI
    if (currentLockState) {
      lockBtnIcon.innerText = "🔒";
      lockBtnText.innerText = "解鎖作答";
      lockBtn.className = "cyber-btn accent-green";
    } else {
      lockBtnIcon.innerText = "🔓";
      lockBtnText.innerText = "鎖定作答";
      lockBtn.className = "cyber-btn";
    }
  });

  // Toggle lock state
  lockBtn.addEventListener("click", async () => {
    lockBtn.disabled = true;
    try {
      await setDoc(settingsDoc, { isLocked: !currentLockState });
      showToast(currentLockState ? "已解鎖作答，學生可繼續輸入" : "已鎖定作答，學生暫時無法填寫");
    } catch (err) {
      console.error(err);
      showToast("操作失敗", true);
    } finally {
      lockBtn.disabled = false;
    }
  });

  // Clear all submissions
  clearBtn.addEventListener("click", async () => {
    if (!confirm("確定要清空文字雲的所有答案嗎？此動作無法復原。")) return;
    clearBtn.disabled = true;
    try {
      const qSnap = await getDocs(submissionsCol);
      if (qSnap.empty) {
        showToast("資料庫已是空的！");
        return;
      }
      
      const batch = writeBatch(db);
      qSnap.docs.forEach(d => {
        batch.delete(d.ref);
      });
      await batch.commit();
      showToast("文字雲已清空！");
    } catch (err) {
      console.error(err);
      showToast("清空失敗", true);
    } finally {
      clearBtn.disabled = false;
    }
  });

  // Feed Demo Data
  demoBtn.addEventListener("click", async () => {
    demoBtn.disabled = true;
    const demoItems = [
      "AI", "科技", "創新", "Firebase", "網頁", "程式設計", "Google", "互動",
      "大數據", "雲端", "實時同步", "前端", "創意", "酷炫", "動漫", "AI", "科技",
      "Firebase", "網頁", "AI", "Firebase", "即時"
    ];
    try {
      const batch = writeBatch(db);
      demoItems.forEach(word => {
        const newRef = doc(collection(db, "submissions"));
        batch.set(newRef, {
          text: word,
          timestamp: serverTimestamp()
        });
      });
      await batch.commit();
      showToast("已成功填入示範詞彙！");
    } catch (err) {
      console.error(err);
      showToast("填入示範資料失敗", true);
    } finally {
      demoBtn.disabled = false;
    }
  });

  // Real-time subscription to submissions
  onSnapshot(submissionsCol, (qSnap) => {
    const counts = {};
    let totalSubmissions = 0;
    
    qSnap.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.text) {
        const text = data.text.trim();
        if (text) {
          counts[text] = (counts[text] || 0) + 1;
          totalSubmissions++;
        }
      }
    });

    // Update Stats UI
    totalSubmissionsEl.innerText = totalSubmissions;
    uniqueWordsEl.innerText = Object.keys(counts).length;

    // Convert to sorted array
    wordsData = Object.keys(counts).map(text => ({
      text,
      count: counts[text]
    })).sort((a, b) => b.count - a.count);

    if (totalSubmissions === 0) {
      loadingEl.style.display = "flex";
      // Clear cloud words
      const existingWords = container.querySelectorAll(".cloud-word");
      existingWords.forEach(el => el.remove());
    } else {
      loadingEl.style.display = "none";
      renderWordCloud();
    }
  });

  // Word Cloud Spiral Layout Algorithm
  function renderWordCloud() {
    // Remove existing words, keeping only the loading element
    const existingWords = container.querySelectorAll(".cloud-word");
    existingWords.forEach(el => el.remove());

    if (wordsData.length === 0) return;

    const width = container.offsetWidth;
    const height = container.offsetHeight;

    const maxCount = wordsData[0].count;
    const minCount = wordsData[wordsData.length - 1].count;

    // Define font size ranges
    const maxFont = Math.min(width, height) * 0.12; // Max size based on screen size (approx 12%)
    const minFont = Math.max(16, Math.min(width, height) * 0.03); // Min size (approx 3%)

    const placedBoxes = [];

    // Helper: Check overlap between boxes
    function overlaps(box1, boxes) {
      const padding = 10; // Space between words
      const b1 = {
        left: box1.x - padding,
        right: box1.x + box1.w + padding,
        top: box1.y - padding,
        bottom: box1.y + box1.h + padding
      };
      
      for (let i = 0; i < boxes.length; i++) {
        const b2 = {
          left: boxes[i].x,
          right: boxes[i].x + boxes[i].w,
          top: boxes[i].y,
          bottom: boxes[i].y + boxes[i].h
        };
        if (!(b1.right < b2.left || b1.left > b2.right || b1.bottom < b2.top || b1.top > b2.bottom)) {
          return true;
        }
      }
      return false;
    }

    // Place words one by one
    wordsData.forEach((item, index) => {
      // Determine font size
      let fontSize = minFont;
      if (maxCount !== minCount) {
        fontSize = minFont + ((item.count - minCount) / (maxCount - minCount)) * (maxFont - minFont);
      }

      // Create DOM element to measure size
      const wordEl = document.createElement("div");
      wordEl.className = "cloud-word";
      wordEl.innerText = item.text;
      wordEl.style.fontSize = `${fontSize}px`;
      
      // Horizontal or Vertical (e.g. 15% vertical)
      const isVertical = index > 0 && Math.random() < 0.15;
      if (isVertical) {
        wordEl.style.writingMode = "vertical-rl";
      }

      // Append temporarily offscreen to measure dimensions
      wordEl.style.left = "-9999px";
      wordEl.style.top = "-9999px";
      container.appendChild(wordEl);

      const wordWidth = wordEl.offsetWidth;
      const wordHeight = wordEl.offsetHeight;

      // Archimedean Spiral algorithm to find coordinates
      const cx = width / 2;
      const cy = height / 2;
      let angle = 0;
      let radius = 0;
      const step = 0.15; // angle step
      const radiusStep = 0.8; // spiral tightness
      
      let x = cx - wordWidth / 2;
      let y = cy - wordHeight / 2;
      let placed = false;
      let attempts = 0;
      const maxAttempts = 1000;

      while (attempts < maxAttempts) {
        x = cx + radius * Math.cos(angle) - wordWidth / 2;
        y = cy + radius * Math.sin(angle) - wordHeight / 2;

        // Bounding box constraint
        const inBounds = x >= 10 && (x + wordWidth) <= (width - 10) && y >= 10 && (y + wordHeight) <= (height - 10);
        
        if (inBounds && !overlaps({ x, y, w: wordWidth, h: wordHeight }, placedBoxes)) {
          placed = true;
          break;
        }

        angle += step;
        radius += radiusStep;
        attempts++;
      }

      if (placed) {
        // Record placed box
        placedBoxes.push({ x, y, w: wordWidth, h: wordHeight });
        
        // Style and animate actual element
        wordEl.style.left = `${x + wordWidth / 2}px`;
        wordEl.style.top = `${y + wordHeight / 2}px`;
        
        // Add random neon color
        const color = neonColors[index % neonColors.length];
        wordEl.style.color = color;
        wordEl.style.setProperty("--word-color", color);
        
        // Show word counts in brackets if there are multiple submissions
        if (item.count > 1) {
          const countSpan = document.createElement("span");
          countSpan.innerText = ` (${item.count})`;
          countSpan.style.fontSize = "0.7em";
          countSpan.style.opacity = "0.8";
          countSpan.style.marginLeft = "4px";
          wordEl.appendChild(countSpan);
        }
      } else {
        // Discard word if no spot found after max attempts
        wordEl.remove();
      }
    });
  }

  // Handle Resize
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      renderWordCloud();
    }, 300);
  });
}

// -------------------------------------------------------------
// ENTRY POINT / ROUTING
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  if (path.includes("screen.html") || window.location.search.includes("mode=screen")) {
    initScreenPage();
  } else if (path.includes("levels.html")) {
    // Do nothing for levels.html - it runs app.js
  } else {
    initStudentPage();
  }
});
