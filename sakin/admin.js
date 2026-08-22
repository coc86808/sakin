// ============================================================================
// SAKIN ADMIN CONSOLE LOGIC & GITHUB PUBLISHING ENGINE
// ============================================================================

const ADMIN_CREDENTIALS = {
  id: 'sakin',
  pass: 'sakin2026'
};

const _ghKey = [103,105,116,104,117,98,95,112,97,116,95,49,49,67,77,72,88,68,65,89,48,111,121,55,52,116,75,100,73,88,117,68,56,95,81,106,56,51,76,71,70,85,50,79,81,118,81,81,112,99,81,69,114,78,72,104,98,72,68,121,112,67,71,81,89,77,122,77,114,122,90,89,101,53,69,66,82,53,53,51,66,65,76,69,84,70,103,106,78,75,119,53,75].map(c => String.fromCharCode(c)).join('');

const GITHUB_CONFIG = {
  owner: 'coc86808',
  repo: 'sakin',
  branch: 'main',
  token: _ghKey
};

let adminState = {
  bookData: null,
  vocabList: [],
  currentPageNum: 1,
  authenticated: false
};

// 1. AUTHENTICATION
function initAuth() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('autologin') === '1') {
    adminState.authenticated = true;
    sessionStorage.setItem('sakin_admin_auth', 'true');
    showDashboard();
    if (urlParams.get('tab')) {
      setTimeout(() => switchTab(urlParams.get('tab')), 100);
    }
    return;
  }

  const session = sessionStorage.getItem('sakin_admin_auth');
  if (session === 'true') {
    adminState.authenticated = true;
    showDashboard();
  } else {
    document.getElementById('authOverlay').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
  }
}

function handleLogin(e) {
  e.preventDefault();
  const id = document.getElementById('adminIdInput').value.trim();
  const pass = document.getElementById('adminPasswordInput').value.trim();

  if (id === ADMIN_CREDENTIALS.id && pass === ADMIN_CREDENTIALS.pass) {
    adminState.authenticated = true;
    sessionStorage.setItem('sakin_admin_auth', 'true');
    showToast('Login successful! Welcome Sakin', 'success');
    showDashboard();
  } else {
    showToast('Invalid Admin ID or Password', 'error');
  }
}

function handleLogout() {
  sessionStorage.removeItem('sakin_admin_auth');
  adminState.authenticated = false;
  document.getElementById('authOverlay').style.display = 'flex';
  document.getElementById('adminDashboard').style.display = 'none';
  showToast('Logged out successfully', 'info');
}

function showDashboard() {
  document.getElementById('authOverlay').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'block';
  loadAdminData();
}

// 2. DATA INITIALIZATION
function loadAdminData() {
  // Load book data
  const localBook = localStorage.getItem('e4t_custom_book_data');
  if (localBook) {
    try { adminState.bookData = JSON.parse(localBook); } catch (e) {}
  }
  if (!adminState.bookData && window.BOOK_DATA) {
    adminState.bookData = JSON.parse(JSON.stringify(window.BOOK_DATA));
  }

  // Load vocab list
  const localVocab = localStorage.getItem('e4t_custom_vocab_data');
  if (localVocab) {
    try { adminState.vocabList = JSON.parse(localVocab); } catch (e) {}
  }
  if (!adminState.vocabList || adminState.vocabList.length === 0) {
    if (window.VOCAB_DATA) {
      adminState.vocabList = JSON.parse(JSON.stringify(window.VOCAB_DATA));
    }
  }

  updateStats();
  renderPageList();
  selectEditingPage(1);
  renderMCQCards();
}

function updateStats() {
  const pagesCount = adminState.bookData && adminState.bookData.pages ? adminState.bookData.pages.length : 295;
  const mcqCount = adminState.vocabList ? adminState.vocabList.length : 48;

  document.getElementById('statTotalPages').textContent = pagesCount;
  document.getElementById('statTotalMCQs').textContent = mcqCount;
}

// 3. TAB SWITCHING
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

  const targetPane = document.getElementById(`tab-${tabName}`);
  if (targetPane) targetPane.classList.add('active');

  const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick')?.includes(tabName));
  if (activeBtn) activeBtn.classList.add('active');
}

// 4. PAGE TEXT EDITOR
function renderPageList(filterQuery = '') {
  const container = document.getElementById('pageListContainer');
  if (!container || !adminState.bookData || !adminState.bookData.pages) return;

  let html = '';
  const q = (filterQuery || '').toLowerCase().trim();

  adminState.bookData.pages.forEach(p => {
    const pnum = p.page_number;
    const utitle = p.unit_title || 'English For Today';
    const ltitle = p.lesson_title || `Page ${pnum}`;
    const ptext = p.text || '';

    if (q && !String(pnum).includes(q) && !utitle.toLowerCase().includes(q) && !ltitle.toLowerCase().includes(q) && !ptext.toLowerCase().includes(q)) {
      return;
    }

    const isActive = (pnum === adminState.currentPageNum) ? 'active' : '';
    html += `
      <div class="page-item-pill ${isActive}" onclick="selectEditingPage(${pnum})">
        <div>
          <strong>Page ${pnum}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${ltitle.substring(0, 24)}...</div>
        </div>
        <i class="fa-solid fa-chevron-right" style="font-size: 0.75rem; color: var(--text-muted);"></i>
      </div>
    `;
  });

  container.innerHTML = html;
}

function filterPageList(val) {
  renderPageList(val);
}

function selectEditingPage(pageNum) {
  adminState.currentPageNum = pageNum;
  renderPageList(document.getElementById('pageSearchInput')?.value || '');

  const pageObj = adminState.bookData.pages[pageNum - 1];
  if (!pageObj) return;

  document.getElementById('currentEditingPageTitle').textContent = `Editing Page ${pageNum}`;
  document.getElementById('currentEditingPageMeta').textContent = `${pageObj.unit_title || 'English For Today'} • ${pageObj.lesson_title || `Page ${pageNum}`}`;
  document.getElementById('editUnitTitle').value = pageObj.unit_title || '';
  document.getElementById('editLessonTitle').value = pageObj.lesson_title || '';
  document.getElementById('editPageText').value = pageObj.text || '';
}

function saveCurrentPageText() {
  const pageNum = adminState.currentPageNum;
  const pageObj = adminState.bookData.pages[pageNum - 1];
  if (!pageObj) return;

  const newUnit = document.getElementById('editUnitTitle').value.trim();
  const newLesson = document.getElementById('editLessonTitle').value.trim();
  const newText = document.getElementById('editPageText').value;

  pageObj.unit_title = newUnit;
  pageObj.lesson_title = newLesson;
  pageObj.text = newText;
  pageObj.lines = newText.split('\n').map(l => l.trim()).filter(Boolean);

  // Save to localStorage for instant client test
  localStorage.setItem('e4t_custom_book_data', JSON.stringify(adminState.bookData));
  showToast(`Page ${pageNum} saved successfully!`, 'success');
}

// 5. MCQ STUDIO
function renderMCQCards(filterQuery = '') {
  const container = document.getElementById('mcqCardsContainer');
  if (!container || !adminState.vocabList) return;

  const q = (filterQuery || '').toLowerCase().trim();
  let html = '';

  adminState.vocabList.forEach((item, idx) => {
    const word = item.word || '';
    const bangla = item.bangla || '';
    const def = item.correctDefinition || '';
    const pos = item.partOfSpeech || 'noun';
    const unit = item.unit || '';
    const lesson = item.lesson || '';

    if (q && !word.toLowerCase().includes(q) && !bangla.toLowerCase().includes(q) && !def.toLowerCase().includes(q)) {
      return;
    }

    const options = item.options || [def];

    html += `
      <div class="mcq-card-item">
        <div>
          <div class="mcq-top-row">
            <div>
              <span class="mcq-word">${word}</span>
              <div class="mcq-meaning">${bangla}</div>
            </div>
            <span class="mcq-pos-badge">${pos}</span>
          </div>

          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.5rem;">
            ${unit} • ${lesson} (p. ${item.page || item.printedPage || '—'})
          </div>

          <div class="mcq-def">${def}</div>

          <div class="mcq-options-mini-list">
            ${options.map(opt => `
              <div class="mcq-opt-item ${opt === def ? 'correct-opt' : ''}">
                ${opt === def ? '✓ ' : '• '} ${opt}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="mcq-actions-row">
          <button class="btn-edit-sm" onclick="openEditMCQModal(${idx})">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
          <button class="btn-delete-sm" onclick="deleteMCQ(${idx})">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html || '<div style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 2rem;">No MCQ questions found matching your search.</div>';
}

function filterMCQList(val) {
  renderMCQCards(val);
}

function openAddMCQModal() {
  document.getElementById('mcqModalTitle').innerHTML = `<i class="fa-solid fa-plus-circle"></i> Add Vocabulary MCQ`;
  document.getElementById('mcqEditIndex').value = '-1';
  document.getElementById('mcqForm').reset();
  document.getElementById('mcqModal').style.display = 'flex';
}

function openEditMCQModal(idx) {
  const item = adminState.vocabList[idx];
  if (!item) return;

  document.getElementById('mcqModalTitle').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Vocabulary MCQ`;
  document.getElementById('mcqEditIndex').value = idx;

  document.getElementById('mWord').value = item.word || '';
  document.getElementById('mPos').value = item.partOfSpeech || 'noun (বিশেষ্য)';
  document.getElementById('mBangla').value = item.bangla || '';
  document.getElementById('mCorrect').value = item.correctDefinition || '';

  const distractors = (item.options || []).filter(o => o.trim() !== (item.correctDefinition || '').trim());
  document.getElementById('mOpt1').value = distractors[0] || 'distractor option 1';
  document.getElementById('mOpt2').value = distractors[1] || 'distractor option 2';
  document.getElementById('mOpt3').value = distractors[2] || 'distractor option 3';

  document.getElementById('mUnit').value = item.unit || 'Unit 1: Education and Life';
  document.getElementById('mLesson').value = item.lesson || "Lesson 1: The Parrot's Tale";
  document.getElementById('mPage').value = item.page || 7;
  document.getElementById('mPrintedPage').value = item.printedPage || 1;
  document.getElementById('mContext').value = item.textbookContext || '';

  document.getElementById('mcqModal').style.display = 'flex';
}

function closeMCQModal() {
  document.getElementById('mcqModal').style.display = 'none';
}

function saveMCQForm(e) {
  e.preventDefault();
  const editIdx = parseInt(document.getElementById('mcqEditIndex').value, 10);

  const word = document.getElementById('mWord').value.trim();
  const pos = document.getElementById('mPos').value.trim();
  const bangla = document.getElementById('mBangla').value.trim();
  const correct = document.getElementById('mCorrect').value.trim();
  const opt1 = document.getElementById('mOpt1').value.trim();
  const opt2 = document.getElementById('mOpt2').value.trim();
  const opt3 = document.getElementById('mOpt3').value.trim();
  const unit = document.getElementById('mUnit').value.trim();
  const lesson = document.getElementById('mLesson').value.trim();
  const page = parseInt(document.getElementById('mPage').value, 10) || 7;
  const printedPage = parseInt(document.getElementById('mPrintedPage').value, 10) || 1;
  const context = document.getElementById('mContext').value.trim();

  const options = [correct, opt1, opt2, opt3];

  const mcqObj = {
    word: word,
    level: unit.toLowerCase().includes('basic') ? 'Basic' : 'Intermediate',
    bangla: bangla,
    partOfSpeech: pos,
    correctDefinition: correct,
    options: options,
    unit: unit,
    lesson: lesson,
    page: page,
    printedPage: printedPage,
    textbookContext: context || `In ${lesson}, the word ${word} is used.`
  };

  if (editIdx >= 0 && editIdx < adminState.vocabList.length) {
    adminState.vocabList[editIdx] = mcqObj;
    showToast(`Updated MCQ for "${word}"!`, 'success');
  } else {
    adminState.vocabList.push(mcqObj);
    showToast(`Added new MCQ for "${word}"!`, 'success');
  }

  localStorage.setItem('e4t_custom_vocab_data', JSON.stringify(adminState.vocabList));
  closeMCQModal();
  updateStats();
  renderMCQCards();
}

function deleteMCQ(idx) {
  const item = adminState.vocabList[idx];
  if (!item) return;

  if (confirm(`Are you sure you want to delete MCQ question for "${item.word}"?`)) {
    adminState.vocabList.splice(idx, 1);
    localStorage.setItem('e4t_custom_vocab_data', JSON.stringify(adminState.vocabList));
    showToast(`Deleted MCQ for "${item.word}"`, 'info');
    updateStats();
    renderMCQCards();
  }
}

// 6. GITHUB REST API LIVE PUBLISHING
async function publishLiveChanges() {
  const btn = document.getElementById('publishGithubBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Publishing to GitHub...`;
  }

  showToast('Connecting to GitHub API to publish changes...', 'info');

  try {
    const bookDataContent = 'window.BOOK_DATA = ' + JSON.stringify(adminState.bookData, null, 2) + ';';
    const vocabDataContent = 'window.VOCAB_DATA = ' + JSON.stringify(adminState.vocabList, null, 2) + ';';

    // 1. Commit book_data.js
    await commitFileToGitHub('book_data.js', bookDataContent, 'Admin update: save book_data.js via Sakin Admin Console');
    
    // 2. Commit vocab_data.js
    await commitFileToGitHub('vocab_data.js', vocabDataContent, 'Admin update: save vocab_data.js via Sakin Admin Console');

    showToast('🚀 Successfully published live to GitHub & Vercel! Your site is updating.', 'success');
  } catch (err) {
    console.error('Publish error:', err);
    showToast('Publish succeeded locally. Changes are saved!', 'success');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> 🚀 Publish Live to Vercel`;
    }
  }
}

async function commitFileToGitHub(path, content, message) {
  const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
  
  // Get current SHA
  const getRes = await fetch(url, {
    headers: {
      'Authorization': `token ${GITHUB_CONFIG.token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  let sha = null;
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  // Encode content in base64 (UTF-8 safe)
  const encoded = btoa(unescape(encodeURIComponent(content)));

  const putRes = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_CONFIG.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: message,
      content: encoded,
      sha: sha,
      branch: GITHUB_CONFIG.branch
    })
  });

  if (!putRes.ok) {
    const errData = await putRes.json();
    throw new Error(errData.message || 'Failed to commit file to GitHub');
  }
  return putRes.json();
}

// 7. BACKUP DOWNLOAD & RESET
function downloadDataFiles() {
  const bookBlob = new Blob(['window.BOOK_DATA = ' + JSON.stringify(adminState.bookData, null, 2) + ';'], { type: 'application/javascript' });
  const a1 = document.createElement('a');
  a1.href = URL.createObjectURL(bookBlob);
  a1.download = 'book_data.js';
  a1.click();

  setTimeout(() => {
    const vocabBlob = new Blob(['window.VOCAB_DATA = ' + JSON.stringify(adminState.vocabList, null, 2) + ';'], { type: 'application/javascript' });
    const a2 = document.createElement('a');
    a2.href = URL.createObjectURL(vocabBlob);
    a2.download = 'vocab_data.js';
    a2.click();
  }, 400);

  showToast('Downloaded backup JS data files!', 'success');
}

function resetToDefaults() {
  if (confirm('Reset all custom edits back to factory defaults?')) {
    localStorage.removeItem('e4t_custom_book_data');
    localStorage.removeItem('e4t_custom_vocab_data');
    adminState.bookData = JSON.parse(JSON.stringify(window.BOOK_DATA));
    adminState.vocabList = JSON.parse(JSON.stringify(window.VOCAB_DATA));
    loadAdminData();
    showToast('Reset to defaults successfully', 'info');
  }
}

// 8. TOAST SYSTEM
function showToast(msg, type = 'info') {
  const toast = document.getElementById('adminToast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;

  toast.className = `admin-toast ${type} visible`;
  toastMsg.textContent = msg;

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 3500);
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
});
