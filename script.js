const passwordInput = document.getElementById("passwordInput");
const toggleBtn = document.getElementById("toggleBtn");
const scoreValue = document.getElementById("scoreValue");
const scoreCircle = document.getElementById("scoreCircle");
const strengthLabel = document.getElementById("strengthLabel");
const strengthMessage = document.getElementById("strengthMessage");

const lengthValue = document.getElementById("lengthValue");
const entropyValue = document.getElementById("entropyValue");
const entropyPool = document.getElementById("entropyPool");
const crackValue = document.getElementById("crackValue");

const suggestionBox = document.getElementById("suggestionBox");

const checks = {
  check8: document.getElementById("check8"),
  checkUpper: document.getElementById("checkUpper"),
  checkLower: document.getElementById("checkLower"),
  checkNumber: document.getElementById("checkNumber"),
  checkSpecial: document.getElementById("checkSpecial"),
  check16: document.getElementById("check16"),
};

let currentScore = 0;
let animationFrame;

toggleBtn.addEventListener("click", () => {
  const icon = toggleBtn.querySelector("i");
  const text = toggleBtn.querySelector("span");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    icon.className = "fa-solid fa-eye-slash";
    text.textContent = "Hide";
  } else {
    passwordInput.type = "password";
    icon.className = "fa-solid fa-eye";
    text.textContent = "Show";
  }
});

passwordInput.addEventListener("input", analyzePassword);

function analyzePassword() {
  const password = passwordInput.value;

  const has8 = password.length >= 8;
  const has16 = password.length >= 16;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const hasRepeated = /(.)\1{2,}/.test(password);
  const hasSequence = detectSequence(password);
  const isCommon = detectCommonPassword(password);

  let score = 0;

  if (has8) score += 18;
  if (has16) score += 18;
  if (hasUpper) score += 14;
  if (hasLower) score += 14;
  if (hasNumber) score += 14;
  if (hasSpecial) score += 16;

  if (password.length >= 20) score += 6;

  if (hasRepeated) score -= 10;
  if (hasSequence) score -= 12;
  if (isCommon) score -= 30;

  if (password.length === 0) score = 0;
  score = Math.max(0, Math.min(score, 100));

  animateScore(currentScore, score);
  currentScore = score;

  updateStrengthText(score, password);
  updateStats(password);
  updateChecks({ has8, has16, hasUpper, hasLower, hasNumber, hasSpecial });
  updateSuggestions(password, {
    has8,
    has16,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    hasRepeated,
    hasSequence,
    isCommon,
  });
}

function animateScore(start, end) {
  cancelAnimationFrame(animationFrame);

  const duration = 700;
  const startTime = performance.now();

  scoreCircle.classList.remove("animate");
  void scoreCircle.offsetWidth;
  scoreCircle.classList.add("animate");

  function update(time) {
    const progress = Math.min((time - startTime) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    const animatedScore = Math.round(start + (end - start) * easedProgress);

    scoreValue.textContent = `${animatedScore}%`;

    const degrees = (animatedScore / 100) * 360;
    const color = getScoreColor(animatedScore);

    scoreCircle.style.background = `
      conic-gradient(
        ${color} ${degrees}deg,
        rgba(255, 255, 255, 0.08) ${degrees}deg
      )
    `;

    scoreCircle.style.boxShadow = `
      0 0 25px ${color}55,
      inset 0 0 15px rgba(255,255,255,0.04)
    `;

    scoreValue.style.color = color;

    if (progress < 1) {
      animationFrame = requestAnimationFrame(update);
    }
  }

  animationFrame = requestAnimationFrame(update);
}

function getScoreColor(score) {
  if (score < 30) return "#ff5f8f";
  if (score < 55) return "#ffbd57";
  if (score < 80) return "#55e6ff";
  return "#39f3cb";
}

function updateStrengthText(score, password) {
  if (password.length === 0) {
    strengthLabel.textContent = "Start typing";
    strengthLabel.style.color = "#dfe2ff";
    strengthMessage.textContent = "Enter a password to analyze its security";
    return;
  }

  if (score < 30) {
    strengthLabel.textContent = "Weak";
    strengthLabel.style.color = "#ff5f8f";
    strengthMessage.textContent = "Too easy — highly vulnerable";
  } else if (score < 55) {
    strengthLabel.textContent = "Moderate";
    strengthLabel.style.color = "#ffbd57";
    strengthMessage.textContent = "Needs improvement for better protection";
  } else if (score < 80) {
    strengthLabel.textContent = "Strong";
    strengthLabel.style.color = "#55e6ff";
    strengthMessage.textContent = "Good — reasonably secure";
  } else {
    strengthLabel.textContent = "Very strong";
    strengthLabel.style.color = "#39f3cb";
    strengthMessage.textContent = "Excellent — well secured";
  }
}

function updateStats(password) {
  const length = password.length;
  lengthValue.textContent = length;

  let pool = 0;

  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 32;

  const entropy = length > 0 && pool > 0
    ? Math.round(length * Math.log2(pool))
    : 0;

  entropyValue.textContent = entropy;
  entropyPool.textContent = `${pool}-char pool`;

  crackValue.textContent = estimateCrackTime(entropy);
}

function estimateCrackTime(entropy) {
  if (entropy === 0) return "Instant";

  const guessesPerSecond = 10000000000;
  const seconds = Math.pow(2, entropy) / guessesPerSecond;

  if (seconds < 1) return "Instant";
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} mins`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
  if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`;

  return "Centuries+";
}

function updateChecks(results) {
  setCheckState(checks.check8, results.has8);
  setCheckState(checks.checkUpper, results.hasUpper);
  setCheckState(checks.checkLower, results.hasLower);
  setCheckState(checks.checkNumber, results.hasNumber);
  setCheckState(checks.checkSpecial, results.hasSpecial);
  setCheckState(checks.check16, results.has16);
}

function setCheckState(element, passed) {
  element.classList.remove("pass", "fail");
  element.classList.add(passed ? "pass" : "fail");
}

function updateSuggestions(password, results) {
  if (password.length === 0) {
    suggestionBox.innerHTML = `
      <i class="fa-solid fa-wand-magic-sparkles"></i>
      <span>Type a password to see suggestions</span>
    `;
    return;
  }

  let suggestions = [];

  if (!results.has8) suggestions.push("Use at least 8 characters");
  if (!results.hasUpper) suggestions.push("Add uppercase letters");
  if (!results.hasLower) suggestions.push("Add lowercase letters");
  if (!results.hasNumber) suggestions.push("Include some numbers");
  if (!results.hasSpecial) suggestions.push("Add special characters");
  if (!results.has16) suggestions.push("Use 16+ characters for stronger security");
  if (results.hasRepeated) suggestions.push("Avoid repeated characters like aaa or 111");
  if (results.hasSequence) suggestions.push("Avoid simple sequences like abc or 123");
  if (results.isCommon) suggestions.push("Avoid common passwords like password or 123456");

  if (suggestions.length === 0) {
    suggestionBox.innerHTML = `
      <i class="fa-solid fa-circle-check"></i>
      <span>Great! Your password looks very strong</span>
    `;
    suggestionBox.style.color = "#39f3cb";
    suggestionBox.style.borderColor = "rgba(57, 243, 203, 0.35)";
    suggestionBox.style.background = "rgba(57, 243, 203, 0.08)";
  } else {
    suggestionBox.innerHTML = `
      <i class="fa-solid fa-wand-magic-sparkles"></i>
      <span>${suggestions[0]}</span>
    `;
    suggestionBox.style.color = "#ffbd57";
    suggestionBox.style.borderColor = "rgba(255, 189, 87, 0.35)";
    suggestionBox.style.background = "rgba(255, 189, 87, 0.08)";
  }
}

function detectSequence(password) {
  const lower = password.toLowerCase();

  const sequences = [
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm"
  ];

  for (let sequence of sequences) {
    for (let i = 0; i <= sequence.length - 3; i++) {
      const part = sequence.substring(i, i + 3);
      if (lower.includes(part)) {
        return true;
      }
    }
  }

  return false;
}

function detectCommonPassword(password) {
  const commonPasswords = [
    "password",
    "123456",
    "12345678",
    "qwerty",
    "abc123",
    "admin",
    "welcome",
    "iloveyou",
    "letmein",
    "111111"
  ];

  return commonPasswords.includes(password.toLowerCase());
}