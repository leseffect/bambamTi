/**
 * 🔒 보안 점검 사항:
 * 1. 프론트엔드에 API 키를 넣으면 개발자 도구에서 노출될 수 있어, Vercel Serverless Function(/api/gemini-counseling)에서 API 키 호출을 대행합니다.
 * 2. .env 파일은 절대 GitHub에 올리지 않으며, .gitignore에 등록되어 있습니다.
 * 3. Vercel 배포 시에는 Project Settings -> Environment Variables에 GEMINI_API_KEY를 등록해야 합니다.
 * 4. Gemini로 전송하는 데이터는 이름, 학번, 사진 경로를 제외한 최소한의 익명화 정보로 제한합니다.
 */

let selectedCounselingStudent = null;

const USERS = [
  { id: "admin", password: "2026", role: "admin", name: "관리자" },
  { id: "10101", password: "1234", role: "student", studentId: "10101" },
  { id: "10102", password: "1234", role: "student", studentId: "10102" },
  { id: "10103", password: "1234", role: "student", studentId: "10103" },
];

const STUDENTS = [
  {
    id: "10101",
    name: "김코딩",
    photo: "assets/10101_김코딩.jpg",
    grades: {
      "정보 수행평가": "A",
      "웹앱 프로젝트": "92점",
      "디지털 윤리 퀴즈": "88점",
      "수업 참여도": "상",
    },
    traits: [
      "문제 해결 과정을 차분히 설명합니다.",
      "새 도구를 시도할 때 기록을 꼼꼼히 남깁니다.",
      "제출 전 확인 습관을 더 연습하면 좋습니다.",
    ],
    teacherMemo: "프론트엔드 구조 이해가 빠르며, 팀원 질문에 답하는 태도가 좋습니다.",
  },
  {
    id: "10102",
    name: "박개발",
    photo: "assets/10102_박개발.jpg",
    grades: {
      "정보 수행평가": "B+",
      "웹앱 프로젝트": "86점",
      "디지털 윤리 퀴즈": "91점",
      "수업 참여도": "중상",
    },
    traits: [
      "협업 중 역할 분담을 잘 지킵니다.",
      "UI 수정 아이디어를 자주 제안합니다.",
      "프로젝트 범위를 작게 나누는 연습이 필요합니다.",
    ],
    teacherMemo: "기능 구현 의욕이 높고, 오류가 날 때 원인을 함께 추적하려는 태도가 좋습니다.",
  },
  {
    id: "10103",
    name: "이교사",
    photo: "assets/10103_이교사.jpg",
    grades: {
      "정보 수행평가": "A-",
      "웹앱 프로젝트": "89점",
      "디지털 윤리 퀴즈": "95점",
      "수업 참여도": "상",
    },
    traits: [
      "학습 내용을 자기 언어로 정리합니다.",
      "개선할 지점을 발견하면 근거를 함께 제시합니다.",
      "코드 주석을 더 구체적으로 쓰면 좋습니다.",
    ],
    teacherMemo: "질문의 초점이 좋고, 개선 방향을 토의하는 데 적극적입니다.",
  },
];

const loginForm = document.querySelector("#loginForm");
const userIdInput = document.querySelector("#userId");
const passwordInput = document.querySelector("#password");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const loginView = document.querySelector("#loginView");
const studentView = document.querySelector("#studentView");
const adminView = document.querySelector("#adminView");

let currentUser = null;

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const id = userIdInput.value.trim();
  const password = passwordInput.value;
  const user = USERS.find((item) => item.id === id && item.password === password);

  if (!user) {
    loginMessage.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  currentUser = user;
  loginMessage.textContent = "";
  loginForm.reset();

  if (user.role === "admin") {
    renderAdminDashboard();
  } else {
    const student = STUDENTS.find((item) => item.id === user.studentId);
    renderStudentPage(student);
  }
});

logoutButton.addEventListener("click", () => {
  currentUser = null;
  showOnly(loginView);
  logoutButton.classList.add("hidden");
  userIdInput.focus();
});

function showOnly(targetView) {
  [loginView, studentView, adminView].forEach((view) => view.classList.add("hidden"));
  targetView.classList.remove("hidden");
}

function renderStudentPage(student) {
  if (!student) {
    loginMessage.textContent = "학생 정보를 찾을 수 없습니다.";
    showOnly(loginView);
    return;
  }

  studentView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Student</p>
        <h2>${student.name} 학생 페이지</h2>
        <p>로그인한 학생의 학습 현황을 확인합니다.</p>
      </div>
    </div>

    <div class="student-layout">
      <article class="student-profile">
        <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
        <div class="profile-body">
          <h3>${student.name}</h3>
          <p class="student-number">학번 ${student.id}</p>
          <div class="tag-row" aria-label="학습 키워드">
            <span class="tag">정보</span>
            <span class="tag">프로젝트</span>
          </div>
        </div>
      </article>

      <div class="content-stack">
        ${renderGrades(student.grades, false, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
      </div>
    </div>
  `;

  showOnly(studentView);
  logoutButton.classList.remove("hidden");
}

function renderAdminDashboard() {
  adminView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Admin</p>
        <h2>관리자 대시보드</h2>
        <p>학생 3명의 학습 현황을 한 화면에서 비교합니다.</p>
      </div>
    </div>

    <section class="admin-grid" aria-label="전체 학생 정보">
      ${STUDENTS.map(renderStudentCard).join("")}
    </section>

    <!-- AI 학생 상담 전략 도우미 섹션 -->
    <section id="aiCounselingSection" class="ai-counseling-panel" aria-labelledby="aiCounselingTitle">
      <div class="section-title">
        <h3 id="aiCounselingTitle">🤖 AI 학생 상담 전략 도우미</h3>
      </div>
      
      <div class="counseling-layout">
        <!-- 상담 설정 영역 -->
        <div class="counseling-settings">
          <div class="field-group">
            <label>선택된 학생 (화면용 정보 vs 전송용 익명화 정보)</label>
            <div id="counselingStudentDisplay" class="student-display-placeholder">
              학생 카드의 '상담 전략 요청' 버튼을 눌러 학생을 선택해 주세요.
            </div>
          </div>

          <div class="field-group">
            <label for="teacherConcernInput">교사 고민 입력</label>
            <textarea 
              id="teacherConcernInput" 
              placeholder="상담 고민 예시:&#10;- 수업 참여는 좋은데 평가 결과가 낮습니다. 어떻게 상담하면 좋을까요?&#10;- 과제 제출이 자주 늦습니다. 혼내기보다는 원인을 파악하고 싶은데 어떻게 접근하면 좋을까요?&#10;- 친구들과 협업할 때 소극적인 편입니다. 어떤 질문으로 대화를 시작하면 좋을까요?"
              disabled
            ></textarea>
          </div>

          <div class="field-group">
            <label>전송 데이터 미리보기 (익명화 완료)</label>
            <pre id="dataPreview" class="data-preview-block">{}</pre>
          </div>

          <button id="getAiStrategyButton" class="primary-button full-width" disabled type="button">
            AI 상담 전략 받기
          </button>
          
          <div id="counselingError" class="form-message" role="alert" aria-live="polite"></div>
        </div>

        <!-- 상담 전략 결과 영역 -->
        <div class="counseling-result-panel">
          <div class="result-body">
            <label>AI 상담 전략 제안</label>
            <div id="counselingResult" class="counseling-result-placeholder">
              학생을 선택하고 상담 고민을 입력한 후 'AI 상담 전략 받기' 버튼을 누르면 여기에 상담 전략이 표시됩니다.
            </div>
          </div>
          
          <div class="result-footer">
            <p class="counseling-disclaimer">
              ⚠️ AI 상담 전략은 참고용입니다. 최종 판단과 실제 상담은 교사가 학생의 상황을 종합적으로 고려하여 진행해야 합니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  `;

  showOnly(adminView);
  logoutButton.classList.remove("hidden");
  initCounselingEvents();
}

function renderStudentCard(student) {
  return `
    <article class="student-card">
      <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
      <div class="student-card-body">
        <h3>${student.name}</h3>
        <p class="student-number">학번 ${student.id}</p>
        ${renderGrades(student.grades, true, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
        <button class="ghost-button request-strategy-btn" data-student-id="${student.id}" type="button" style="margin-top: 14px; width: 100%;">
          상담 전략 요청
        </button>
      </div>
    </article>
  `;
}

function renderGrades(grades, compact = false, headingId = "gradesTitle") {
  const rows = Object.entries(grades)
    .map(([label, value]) => `<tr><th scope="row">${label}</th><td>${value}</td></tr>`)
    .join("");

  return `
    <section aria-labelledby="${headingId}">
      <div class="section-title">
        <h3 id="${headingId}">성적 정보</h3>
      </div>
      <table class="grade-table ${compact ? "compact-table" : ""}">
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderTraits(student) {
  return `
    <section aria-labelledby="traitsTitle-${student.id}">
      <div class="section-title">
        <h3 id="traitsTitle-${student.id}">학습 특성 및 교사 메모</h3>
      </div>
      <ul class="memo-list">
        ${student.traits.map((trait) => `<li>${trait}</li>`).join("")}
        <li>${student.teacherMemo}</li>
      </ul>
    </section>
  `;
}

// AI 학생 상담 전략 도우미 관련 함수 정의
function getStudentAlias(id) {
  const mapping = {
    "10101": "학생 A",
    "10102": "학생 B",
    "10103": "학생 C"
  };
  return mapping[id] || "학생 X";
}

function getGradeSummary(grades) {
  return Object.entries(grades)
    .map(([subject, score]) => `${subject}(${score})`)
    .join(", ");
}

function getLearningTraits(traits) {
  return traits.join(", ");
}

function selectStudentForCounseling(studentId) {
  const student = STUDENTS.find(s => s.id === studentId);
  if (!student) return;

  selectedCounselingStudent = student;

  const alias = getStudentAlias(student.id);
  const gradeSummary = getGradeSummary(student.grades);
  const learningTraits = getLearningTraits(student.traits);

  const displayHtml = `
    <div class="counseling-info-split">
      <div class="info-block screen-only-info">
        <strong>💻 화면 표시용 (실제 정보)</strong>
        <p>이름: ${student.name} | 학번: ${student.id}</p>
      </div>
      <div class="info-block send-only-info">
        <strong>🔒 Gemini 전송용 (익명화 완료)</strong>
        <p>가명: ${alias}</p>
        <p>성적 요약: ${gradeSummary}</p>
        <p>학습 특성 요약: ${learningTraits}</p>
      </div>
    </div>
  `;
  
  const displayEl = document.querySelector("#counselingStudentDisplay");
  displayEl.innerHTML = displayHtml;
  displayEl.classList.remove("student-display-placeholder");

  const concernInput = document.querySelector("#teacherConcernInput");
  concernInput.removeAttribute("disabled");
  concernInput.value = ""; // Reset concern input on new selection
  
  const getBtn = document.querySelector("#getAiStrategyButton");
  getBtn.removeAttribute("disabled");

  const errorEl = document.querySelector("#counselingError");
  errorEl.textContent = "";

  const resultEl = document.querySelector("#counselingResult");
  resultEl.innerHTML = `학생을 선택하고 상담 고민을 입력한 후 'AI 상담 전략 받기' 버튼을 누르면 여기에 상담 전략이 표시됩니다.`;
  resultEl.classList.add("counseling-result-placeholder");

  updateDataPreview();
}

function updateDataPreview() {
  if (!selectedCounselingStudent) {
    document.querySelector("#dataPreview").textContent = "{}";
    return;
  }

  const concern = document.querySelector("#teacherConcernInput").value;
  const alias = getStudentAlias(selectedCounselingStudent.id);
  const gradeSummary = getGradeSummary(selectedCounselingStudent.grades);
  const learningTraits = getLearningTraits(selectedCounselingStudent.traits);

  const previewData = {
    studentAlias: alias,
    gradeSummary: gradeSummary,
    learningTraits: learningTraits,
    teacherConcern: concern
  };

  document.querySelector("#dataPreview").textContent = JSON.stringify(previewData, null, 2);
}

function initCounselingEvents() {
  const btns = document.querySelectorAll(".request-strategy-btn");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      const studentId = btn.getAttribute("data-student-id");
      selectStudentForCounseling(studentId);
      
      const targetSection = document.querySelector("#aiCounselingSection");
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  const concernInput = document.querySelector("#teacherConcernInput");
  if (concernInput) {
    concernInput.addEventListener("input", updateDataPreview);
  }

  const getBtn = document.querySelector("#getAiStrategyButton");
  if (getBtn) {
    getBtn.addEventListener("click", handleGetAiStrategy);
  }
}

async function handleGetAiStrategy() {
  if (!selectedCounselingStudent) return;

  const concernInput = document.querySelector("#teacherConcernInput");
  const concern = concernInput.value.trim();
  const errorEl = document.querySelector("#counselingError");
  const resultEl = document.querySelector("#counselingResult");
  const getBtn = document.querySelector("#getAiStrategyButton");

  errorEl.textContent = "";

  if (!concern) {
    errorEl.textContent = "상담 고민을 먼저 입력해주세요.";
    return;
  }

  // Set loading state
  resultEl.classList.remove("counseling-result-placeholder");
  resultEl.innerHTML = `
    <div class="loading-state">
      <span class="spinner">⏳</span>
      <span>AI가 상담 전략을 생성하는 중입니다.</span>
    </div>
  `;
  getBtn.setAttribute("disabled", "true");
  concernInput.setAttribute("disabled", "true");

  const alias = getStudentAlias(selectedCounselingStudent.id);
  const gradeSummary = getGradeSummary(selectedCounselingStudent.grades);
  const learningTraits = getLearningTraits(selectedCounselingStudent.traits);

  const payload = {
    studentAlias: alias,
    gradeSummary: gradeSummary,
    learningTraits: learningTraits,
    teacherConcern: concern
  };

  try {
    const response = await fetch("/api/gemini-counseling", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok && data.success) {
      resultEl.innerHTML = formatAiResponse(data.result);
    } else {
      throw new Error(data.error || "상담 전략을 불러오지 못했습니다.");
    }
  } catch (error) {
    console.error("AI Counseling Request Error:", error);
    resultEl.innerHTML = `
      <div class="error-placeholder">
        상담 전략을 받아오는 데 실패했습니다.
      </div>
    `;
    errorEl.textContent = "AI 상담 전략을 불러오지 못했습니다. API 키 또는 Vercel 환경 변수를 확인해주세요.";
  } finally {
    getBtn.removeAttribute("disabled");
    concernInput.removeAttribute("disabled");
  }
}

function formatAiResponse(text) {
  if (!text) return "";
  
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Bullet points
  html = html.replace(/^\s*-\s+(.*)$/gm, "<li>$1</li>");
  
  // Headers (### or 1. etc.)
  html = html.replace(/^###\s+(.*)$/gm, "<h4>$1</h4>");
  html = html.replace(/^##\s+(.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^#\s+(.*)$/gm, "<h2>$1</h2>");

  // Format paragraphs and list grouping
  const lines = html.split("\n");
  let result = [];
  let inList = false;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith("<li>")) {
      if (!inList) {
        result.push("<ul>");
        inList = true;
      }
      result.push(line);
    } else {
      if (inList) {
        result.push("</ul>");
        inList = false;
      }
      if (line.startsWith("<h")) {
        result.push(line);
      } else {
        result.push(`<p>${line}</p>`);
      }
    }
  }
  if (inList) {
    result.push("</ul>");
  }

  return result.join("\n");
}

showOnly(loginView);
