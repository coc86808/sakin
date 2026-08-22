// Mobile Sidebar Drawer Management
function initMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const closeBtn = document.getElementById('sidebarCloseBtn');

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('collapsed');
    if (backdrop) backdrop.classList.add('active');
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('collapsed');
    if (backdrop) backdrop.classList.remove('active');
  }

  function toggleSidebar() {
    if (!sidebar) return;
    if (sidebar.classList.contains('collapsed')) {
      openSidebar();
    } else {
      closeSidebar();
    }
  }

  if (toggleBtn) {
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      toggleSidebar();
    };
  }

  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeSidebar();
    };
  }

  if (backdrop) {
    backdrop.onclick = () => closeSidebar();
  }

  // Initial mobile check
  const params = new URLSearchParams(window.location.search);
  if (params.get('sidebar') === '1') {
    openSidebar();
  } else if (window.innerWidth <= 900) {
    closeSidebar();
  }
}

window.addEventListener('resize', () => {
  const backdrop = document.getElementById('sidebarBackdrop');
  if (window.innerWidth > 900 && backdrop) {
    backdrop.classList.remove('active');
  }
});

/**
 * ENGLISH FOR TODAY (CLASSES XI-XII & ALIM) - INTERACTIVE E-BOOK ENGINE
 * Comprehensive Web Application for NCTB English For Today
 */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// 1. APPLICATION STATE
const state = {
  currentPage: 7,
  totalPages: 295,
  viewMode: 'text', // 'text' | 'split' | 'image'
  fontSize: 18,
  lineHeight: 1.8,
  currentTheme: 'dark', // 'dark' | 'light' | 'sepia' | 'cyberpunk'
  soundEnabled: true,
  audioPlaying: false,
  audioPaused: false,
  activeSearchTerm: '',
  bookData: null,
  vocabList: [],
  activeVocabList: [],
  quizIndex: 0,
  quizScore: 0,
  quizLevel: 'all',
  quizUnit: 'all',
  quizLesson: 'all',
  bookmarks: JSON.parse(localStorage.getItem('e4t_bookmarks') || '[]'),
  notes: JSON.parse(localStorage.getItem('e4t_notes') || '[]'),
  highlights: JSON.parse(localStorage.getItem('e4t_highlights') || '[]'),
  speechSynth: window.speechSynthesis || null,
  currentUtterance: null,
  focusedTargetWord: ''
};

// 2. AUDIO SYNTHESIS & SOUND EFFECTS ENGINE
const AudioEngine = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
  },
  playPaperFlip() {
    if (!state.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(2.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch (e) {
      console.warn('Audio SFX play failed:', e);
    }
  },
  playClick() {
    if (!state.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      console.warn('Audio SFX click failed:', e);
    }
  },
  playChime() {
    if (!state.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.08); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio SFX chime failed:', e);
    }
  }
};

// 3. DOM ELEMENTS REPOSITORY
let elements = {};

function initElements() {
  elements = {
    // Navigation & Context
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    pageSlider: document.getElementById('pageSlider'),
    pageJumpInput: document.getElementById('pageJumpInput'),
    pageJumpBtn: document.getElementById('pageJumpBtn'),
    currentPageBadge: document.getElementById('currentPageBadge'),
    readingProgressBar: document.getElementById('readingProgressBar'),
    contextUnit: document.getElementById('contextUnit'),
    contextLesson: document.getElementById('contextLesson'),
    readingTimeText: document.getElementById('readingTimeText'),
    wordCountText: document.getElementById('wordCountText'),
    textPageNum: document.getElementById('textPageNum'),
    textFooterNum: document.getElementById('textFooterNum'),

    // Containers & Viewports
    readerViewport: document.getElementById('readerViewport'),
    readerStage: document.getElementById('readerStage'),
    textViewContainer: document.getElementById('textViewContainer'),
    imageViewContainer: document.getElementById('imageViewContainer'),
    bookPageCard: document.getElementById('bookPageCard'),
    pageCardBody: document.getElementById('pageCardBody'),
    originalPageImg: document.getElementById('originalPageImg'),

    // View Mode Buttons
    btnModeText: document.getElementById('btnModeText'),
    btnModeSplit: document.getElementById('btnModeSplit'),
    btnModeImage: document.getElementById('btnModeImage'),

    // Audio & Narration
    audioPlayBtn: document.getElementById('audioPlayBtn'),
    audioStopBtn: document.getElementById('audioStopBtn'),
    ttsRateSelect: document.getElementById('ttsRateSelect'),

    // Sidebar & Navigation Panels
    sidebar: document.getElementById('sidebar'),
    sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
    tabUnitsBtn: document.getElementById('tabUnitsBtn'),
    tabBookmarksBtn: document.getElementById('tabBookmarksBtn'),
    tabNotesBtn: document.getElementById('tabNotesBtn'),
    tabVocabBtn: document.getElementById('tabVocabBtn'),
    paneUnits: document.getElementById('paneUnits'),
    paneBookmarks: document.getElementById('paneBookmarks'),
    paneNotes: document.getElementById('paneNotes'),
    paneVocab: document.getElementById('paneVocab'),
    tocTree: document.getElementById('tocTree'),
    tocSearchInput: document.getElementById('tocFilterInput') || document.getElementById('tocSearchInput'),
    tocFilterInput: document.getElementById('tocFilterInput') || document.getElementById('tocSearchInput'),
    bookmarksList: document.getElementById('bookmarksList'),
    notesList: document.getElementById('notesList'),
    sidebarVocabList: document.getElementById('sidebarVocabList'),
    launchVocabStudioBtn: document.getElementById('launchVocabStudioBtn'),
    clearAllNotesBtn: document.getElementById('clearAllNotesBtn'),

    // Search Engine
    searchModal: document.getElementById('searchModal'),
    searchModalBackdrop: document.getElementById('searchModalBackdrop'),
    searchModalClose: document.getElementById('searchModalClose'),
    searchTriggerBtn: document.getElementById('searchTriggerBtn'),
    globalSearchInput: document.getElementById('globalSearchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    searchResultsList: document.getElementById('searchResultsList'),

    // Settings & Personalization
    settingsModal: document.getElementById('settingsModal'),
    settingsModalBackdrop: document.getElementById('settingsModalBackdrop'),
    settingsModalClose: document.getElementById('settingsModalClose'),
    settingsTriggerBtn: document.getElementById('settingsTriggerBtn'),
    fontSizeSlider: document.getElementById('fontSizeSlider'),
    fontSizeVal: document.getElementById('fontSizeVal'),
    lineHeightSlider: document.getElementById('lineHeightSlider'),
    lineHeightVal: document.getElementById('lineHeightVal'),
    soundEffectsToggle: document.getElementById('soundEffectsToggle'),

    // Modals: Notes, Dictionary, Shortcuts, Vocab Studio
    bookmarkTriggerBtn: document.getElementById('bookmarkTriggerBtn'),
    noteModal: document.getElementById('noteModal'),
    noteModalBackdrop: document.getElementById('noteModalBackdrop'),
    noteModalClose: document.getElementById('noteModalClose'),
    noteQuotePreview: document.getElementById('noteQuotePreview'),
    noteInput: document.getElementById('noteInput'),
    saveNoteBtn: document.getElementById('saveNoteBtn'),
    textSelectionMenu: document.getElementById('textSelectionMenu'),
    selDefineBtn: document.getElementById('selDefineBtn'),
    selHighlightYellow: document.getElementById('selHighlightYellow'),
    selHighlightGreen: document.getElementById('selHighlightGreen'),
    selHighlightPink: document.getElementById('selHighlightPink'),
    selAddNoteBtn: document.getElementById('selAddNoteBtn'),

    dictionaryModal: document.getElementById('dictionaryModal'),
    dictionaryModalBackdrop: document.getElementById('dictionaryModalBackdrop'),
    dictionaryModalClose: document.getElementById('dictionaryModalClose'),
    dictWordTitle: document.getElementById('dictWordTitle'),
    dictPhonetic: document.getElementById('dictPhonetic'),
    dictSpeakBtn: document.getElementById('dictSpeakBtn'),
    dictModalBody: document.getElementById('dictModalBody'),
    quickDefineHintBtn: document.getElementById('quickDefineHintBtn'),

    shortcutsModal: document.getElementById('shortcutsModal'),
    shortcutsModalBackdrop: document.getElementById('shortcutsModalBackdrop'),
    shortcutsModalClose: document.getElementById('shortcutsModalClose'),
    shortcutsTriggerBtn: document.getElementById('shortcutsTriggerBtn'),

    vocabStudioModal: document.getElementById('vocabStudioModal'),
    vocabStudioBackdrop: document.getElementById('vocabStudioBackdrop'),
    vocabStudioClose: document.getElementById('vocabStudioClose'),
    vocabQuizTriggerBtn: document.getElementById('vocabQuizTriggerBtn'),
    vUnitSelect: document.getElementById('vUnitSelect'),
    vLessonSelect: document.getElementById('vLessonSelect'),
    vCurrentWordIndex: document.getElementById('vCurrentWordIndex'),
    vTotalWordsCount: document.getElementById('vTotalWordsCount'),
    vCurrentScore: document.getElementById('vCurrentScore'),
    vQuizProgressBar: document.getElementById('vQuizProgressBar'),
    vQuestionCard: document.getElementById('vQuestionCard'),
    vWordBadge: document.getElementById('vWordBadge'),
    vTargetWord: document.getElementById('vTargetWord'),
    vSpeakWordBtn: document.getElementById('vSpeakWordBtn'),
    vocabOptionsContainer: document.getElementById('vocabOptionsContainer'),
    vocabFeedbackCard: document.getElementById('vocabFeedbackCard'),
    vFeedbackBanner: document.getElementById('vFeedbackBanner'),
    vNextWordBtn: document.getElementById('vNextWordBtn'),
    vResultsScreen: document.getElementById('vResultsScreen'),
    vFinalScore: document.getElementById('vFinalScore'),
    vPerformanceMsg: document.getElementById('vPerformanceMsg'),
    vRestartQuizBtn: document.getElementById('vRestartQuizBtn')
  };
}

// 4. MAIN INITIALIZATION
function initApp() {
  initElements();
  initMobileSidebar();
  loadSavedPreferences();
  
  if (window.BOOK_CONTENT_DATA) {
    state.bookData = window.BOOK_CONTENT_DATA;
    state.totalPages = state.bookData.total_pages || 295;
    if (elements.pageSlider) elements.pageSlider.max = state.totalPages;
  }
  
  initVocabQuiz();
  renderTOC();
  renderBookmarks();
  renderNotes();
  
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = parseInt(urlParams.get('page'), 10);
  const modeParam = urlParams.get('mode');
  const quizParam = urlParams.get('quiz');
  const focusWordParam = urlParams.get('focus_word');
  const dictParam = urlParams.get('dict');
  const unitParam = urlParams.get('unit');
  const lessonParam = urlParams.get('lesson');
  
  const savedPage = pageParam || parseInt(localStorage.getItem('e4t_last_page') || '7', 10);
  
  if (modeParam && ['text', 'split', 'image'].includes(modeParam)) {
    setViewMode(modeParam);
  }

  if (focusWordParam) {
    state.focusedTargetWord = focusWordParam;
  }
  
  goToPage(savedPage, false);

  if (quizParam === '1' || quizParam === 'true') {
    if (unitParam) state.quizUnit = unitParam;
    if (lessonParam) state.quizLesson = lessonParam;
    setTimeout(openVocabQuizModal, 100);
  } else if (dictParam) {
    setTimeout(() => lookupDictionary(dictParam), 150);
  }

  setupEventListeners();
  setupTextSelectionEngine();
  setupKeyboardShortcuts();
}

function escapeRegExp(string) {
  if (!string) return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightSearchTerm(text) {
  if (!state.activeSearchTerm || !text) return text;
  const pattern = new RegExp('(' + escapeRegExp(state.activeSearchTerm) + ')', 'gi');
  return text.replace(pattern, '<mark class="search-highlight">$1</mark>');
}

function highlightTargetVocabInText(text, vocabList) {
  if (!text || !vocabList || vocabList.length === 0) return text;
  const pattern = new RegExp('\\b(' + vocabList.map(w => escapeRegExp(w)).join('|') + ')\\b', 'gi');
  return text.replace(pattern, '<mark class="vocab-target-highlight" title="Target Vocabulary Word for Exercises">$1</mark>');
}

function cleanOcrText(str) {
  if (!str) return '';
  return str
    .replace(/\bY%at\b/gi, 'What')
    .replace(/\bRhona\b/g, 'Khona')
    .replace(/\bLhe\b/g, 'The')
    .replace(/\bIcarua\b/g, 'Icarus')
    .replace(/â€œ|â€\x9d|“|”/g, '"')
    .replace(/â€˜|â€™|‘|’/g, "'")
    .replace(/â€”|—/g, ' — ');
}

function formatLinksInText(text) {
  if (!text) return '';
  const urlPattern = /(https?:\/\/[^\s\)]+)/g;
  return text.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer" class="book-resource-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> $1</a>');
}

// 5. CORE PAGE RENDERER
function goToPage(pageNum, triggerFlipAnim = true) {
  pageNum = Math.max(1, Math.min(pageNum, state.totalPages));
  state.currentPage = pageNum;
  localStorage.setItem('e4t_last_page', pageNum);
  
  stopAudio();

  if (triggerFlipAnim) {
    AudioEngine.playPaperFlip();
  }

  const pageObj = (state.bookData && state.bookData.pages) ? state.bookData.pages[pageNum - 1] : null;
  const printedNum = pageObj ? (pageObj.printed_page_number || (pageNum >= 7 ? pageNum - 6 : pageNum)) : pageNum;

  if (elements.pageJumpInput) elements.pageJumpInput.value = pageNum;
  if (elements.pageSlider) elements.pageSlider.value = pageNum;
  if (elements.currentPageBadge) elements.currentPageBadge.textContent = printedNum;
  if (elements.textPageNum) elements.textPageNum.textContent = `Page ${printedNum}`;
  if (elements.textFooterNum) elements.textFooterNum.textContent = `Page ${printedNum}`;
  
  const progressPct = ((pageNum - 1) / (state.totalPages - 1)) * 100;
  if (elements.readingProgressBar) elements.readingProgressBar.style.width = `${progressPct}%`;
  
  updateBookmarkButtonState();
  
  if (!pageObj) return;
  
  updateContextBanner(pageObj);
  renderTextContent(pageObj, triggerFlipAnim);
  updateReadingMetrics(pageObj.text || '');

  highlightActiveTOC(pageNum);
  applyUserHighlights(pageNum);

  if (elements.originalPageImg && (state.viewMode === 'image' || state.viewMode === 'split')) {
    elements.originalPageImg.src = pageObj.image || `assets/pages/page_${pageNum}.png`;
  }

  if (state.focusedTargetWord) {
    const wordToFocus = state.focusedTargetWord;
    state.focusedTargetWord = '';
    setTimeout(() => focusWordInRenderedPage(wordToFocus), 50);
    setTimeout(() => focusWordInRenderedPage(wordToFocus), 250);
  }
}

function updateContextBanner(pageObj) {
  let activeUnit = "ENGLISH FOR TODAY";
  let activeLesson = `Page ${pageObj.page_number}`;

  if (pageObj.unit_title) activeUnit = pageObj.unit_title;
  if (pageObj.lesson_title) activeLesson = pageObj.lesson_title;

  if (state.bookData && state.bookData.toc) {
    for (const unit of state.bookData.toc) {
      if (unit.start_page <= pageObj.page_number) {
        activeUnit = unit.title;
        if (unit.lessons) {
          for (const lesson of unit.lessons) {
            if (lesson.start_page <= pageObj.page_number) {
              activeLesson = lesson.title;
            }
          }
        }
      }
    }
  }

  if (elements.contextUnit) elements.contextUnit.textContent = activeUnit;
  if (elements.contextLesson) elements.contextLesson.textContent = activeLesson;
}

function updateReadingMetrics(text) {
  if (!text || !text.trim()) {
    if (elements.readingTimeText) elements.readingTimeText.textContent = '1 min read';
    if (elements.wordCountText) elements.wordCountText.textContent = '0 words';
    return;
  }

  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  
  if (elements.readingTimeText) elements.readingTimeText.textContent = `${minutes} min read`;
  if (elements.wordCountText) elements.wordCountText.textContent = `${words} words`;
}

function renderTextContent(pageObj, triggerFlipAnim) {
  if (triggerFlipAnim && elements.bookPageCard) {
    elements.bookPageCard.classList.remove('page-flip-anim');
    void elements.bookPageCard.offsetWidth;
    elements.bookPageCard.classList.add('page-flip-anim');
  }

  let rawText = pageObj ? pageObj.text : '';

  if (!rawText || !rawText.trim()) {
    if (elements.pageCardBody) {
      elements.pageCardBody.innerHTML = `
        <div class="empty-page-notice">
          <i class="fa-solid fa-file-lines"></i>
          <p>[ Blank Page in Original Book ]</p>
        </div>
      `;
    }
    return;
  }

  const targetVocab = pageObj.target_vocab || [];

  let clean = cleanOcrText(rawText)
    .replace(/^\s*\d+\s+English For Today\s*/gi, '')
    .replace(/^English For Today.*?\d+\s*/gi, '')
    .replace(/^Forma-\d+.*English\s*/gi, '')
    .replace(/Education and Life\s+/gi, '')
    .trim();

  clean = clean.replace(/\bI\.\s+(?=Do you|What|Why|How)/g, '1. ');
  clean = clean.replace(/\b7\s+2\.\s+/g, '2. ');
  clean = clean.replace(/\b3,\s+/g, '3. ');

  clean = clean.replace(/([a-e])\.\s+([a-z]+)\s+([a-e])\.\s+([a-z]+)\s+([a-e])\.\s+([a-z]+)/gi, '\n__VOCAB_STACK__\n$1. $2\n$3. $4\n$5. $6\n');
  clean = clean.replace(/(\d+\.\s+[^:\n]+:\s*a\.\s+[^|\n]+\|\s*b\.\s+[^|\n]+(?:\|\s*c\.\s+[^|\n]+)?(?:\|\s*d\.\s+[^|\n]+)?)/gi, '\n__MCQ_ITEM__\n$1\n');
  clean = clean.replace(/\b(Lesson\s+\d+)\s+(.*?)(?=\s+[A-Z]\.|\s+A\b|\s+Warm)/gi, '\n__LESSON_HEADER__\n$1\n$2\n');
  clean = clean.replace(/\s+([A-E]\.\s+.*?)(?=\s+\d+\.|\s+Read|\s+Look|\s+Discuss|\s+Think|\s+Now|\s+[A-Z][a-z]+)/g, '\n__SECTION_HEADER__\n$1\n');
  clean = clean.replace(/\s+(\d+\.\s+.*?)(?=\s+\d+\.|\s+[A-E]\.|\s+[A-Z][a-z]+)/g, '\n__QUESTION_ITEM__\n$1\n');
  clean = clean.replace(/\s+(By\s+[A-Z][a-z]+\s+[A-Z][a-z]+)/g, '\n__AUTHOR_BYLINE__\n$1\n');
  clean = clean.replace(/\s+(Advantages of AI in the Classroom|Disadvantages of AI|Role of EdTech Companies)/gi, '\n__SUBHEADING__\n$1\n');
  clean = clean.replace(/\s+(AI in The Classroom: Pros, Cons and The Role Of EdTech Companies)/gi, '\n__ARTICLE_TITLE__\n$1\n');

  const rawLines = clean.split('\n');
  let html = '';
  let inQuestionList = false;

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();
    if (!line) continue;

    if (line === '__MCQ_ITEM__') {
      if (inQuestionList) { html += '</div>'; inQuestionList = false; }
      const mcqText = (rawLines[++i] || '').trim();
      const parts = mcqText.split(':');
      const qWord = parts[0].trim();
      const optsRaw = (parts[1] || '').split('|');

      html += `
        <div class="book-mcq-card">
          <div class="mcq-word-header"><i class="fa-solid fa-pen-nib"></i> ${highlightSearchTerm(formatLinksInText(qWord))}</div>
          <div class="mcq-options-grid">
            ${optsRaw.map(opt => `<div class="mcq-opt-pill" onclick="this.classList.toggle('selected')">${highlightSearchTerm(formatLinksInText(opt.trim()))}</div>`).join('')}
          </div>
        </div>
      `;
    }
    else if (line === '__LESSON_HEADER__') {
      if (inQuestionList) { html += '</div>'; inQuestionList = false; }
      const lNum = (rawLines[++i] || '').trim();
      const lTitle = (rawLines[++i] || '').trim();
      html += `
        <div class="book-lesson-header-box">
          <div class="book-lesson-number">${highlightSearchTerm(formatLinksInText(lNum))}</div>
          <h1 class="book-lesson-title">${highlightSearchTerm(formatLinksInText(lTitle))}</h1>
        </div>
      `;
    }
    else if (line === '__SECTION_HEADER__') {
      if (inQuestionList) { html += '</div>'; inQuestionList = false; }
      const secText = (rawLines[++i] || '').trim();
      html += `<div class="book-section-header"><i class="fa-solid fa-layer-group"></i> ${highlightSearchTerm(formatLinksInText(secText))}</div>`;
    }
    else if (line === '__QUESTION_ITEM__') {
      const qText = (rawLines[++i] || '').trim();
      if (!inQuestionList) { html += '<div class="book-question-list">'; inQuestionList = true; }
      html += `<div class="book-question-item"><i class="fa-solid fa-circle-question"></i> ${highlightSearchTerm(formatLinksInText(qText))}</div>`;
    }
    else if (line === '__ARTICLE_TITLE__') {
      if (inQuestionList) { html += '</div>'; inQuestionList = false; }
      const artTitle = (rawLines[++i] || '').trim();
      html += `<h2 class="book-article-title">${highlightSearchTerm(formatLinksInText(artTitle))}</h2>`;
    }
    else if (line === '__AUTHOR_BYLINE__') {
      if (inQuestionList) { html += '</div>'; inQuestionList = false; }
      const byline = (rawLines[++i] || '').trim();
      html += `<div class="book-author-byline">${highlightSearchTerm(formatLinksInText(byline))}</div>`;
    }
    else if (line === '__SUBHEADING__') {
      if (inQuestionList) { html += '</div>'; inQuestionList = false; }
      const sub = (rawLines[++i] || '').trim();
      html += `<h3 class="book-subheading">${highlightSearchTerm(formatLinksInText(sub))}</h3>`;
    }
    else {
      if (inQuestionList && !/^\d+\./.test(line)) { html += '</div>'; inQuestionList = false; }

      const formatted = formatLinksInText(line);

      if (/^[A-Za-z0-9\s\-\–]+\s*:\s+[\s\S]+/i.test(line) && !/^\d+\./.test(line) && line.indexOf('|') === -1) {
        const parts = line.split(':');
        const label = parts[0].trim();
        const value = parts.slice(1).join(':').trim();

        html += `
          <div class="book-colon-row">
            <span class="colon-label">${highlightSearchTerm(formatLinksInText(label))}</span>
            <span class="colon-sep">:</span>
            <span class="colon-value">${highlightSearchTerm(formatLinksInText(value))}</span>
          </div>
        `;
      }
      else if (/^[a-e]\.\s+[a-z]+$/i.test(line)) {
        html += `<div class="vocab-stacked-item"><span class="vocab-letter-badge"><i class="fa-solid fa-tag"></i> ${line.slice(0, 2)}</span> <span class="vocab-word-title">${highlightSearchTerm(line.slice(3))}</span></div>`;
      }
      else if (/^[a-e]\.\s+.*/i.test(line)) {
        html += `<div class="book-subquestion-item"><span class="subq-badge">${line.slice(0, 2)}</span> <span class="subq-text">${highlightSearchTerm(formatLinksInText(line.slice(3)))}</span></div>`;
      }
      else if (/^(Unit\s+[I|V|X|\d]+[:\.\s]*.*)/i.test(line) && line.length < 60) {
        html += `<div class="unit-banner-tag-centered"><i class="fa-solid fa-bookmark"></i> ${highlightSearchTerm(formatted)}</div>`;
      }
      else if (/^(Lesson\s+\d+[:\.\s]*.*)/i.test(line) && line.length < 60) {
        html += `<h2 class="lesson-main-heading-centered">${highlightSearchTerm(formatted)}</h2>`;
      }
      else if (/^[A-E]\.\s+.*/.test(line) && line.length < 120) {
        html += `<div class="book-section-header"><i class="fa-solid fa-layer-group"></i> ${highlightSearchTerm(formatted)}</div>`;
      }
      else {
        html += `<p class="book-paragraph">${highlightSearchTerm(highlightTargetVocabInText(formatted, targetVocab))}</p>`;
      }
    }
  }

  if (inQuestionList) html += '</div>';

  let illustrationHtml = '';
  if (pageObj.page_number === 7) {
    illustrationHtml = `
      <div class="book-art-card">
        <img src="assets/illustrations/parrots_tale.jpg" alt="Rabindranath Tagore's The Parrot's Tale" class="book-art-img">
        <div class="book-art-caption">Illustration: Rabindranath Tagore's The Parrot's Tale</div>
      </div>
    `;
  }

  if (elements.pageCardBody) {
    elements.pageCardBody.innerHTML = illustrationHtml + html;
  }
}

// 6. PRECISION TREEWALKER-BASED TEXT MARKING & SPOTLIGHT FOCUS ENGINE
function highlightWordInDOMTextNodes(container, targetWord) {
  if (!container || !targetWord) return null;
  const cleanWord = targetWord.trim();
  const escaped = escapeRegExp(cleanWord);
  const regex = new RegExp('\\b(' + escaped + ')\\b', 'i');
  
  const root = cleanWord.replace(/(ed|ing|tion|s|es|ly|ive|al|ic)$/i, '');
  const rootRegex = root.length >= 4 
    ? new RegExp('\\b(' + escapeRegExp(root) + '[a-z]*)\\b', 'i')
    : null;

  // Clean previous marks
  const oldMarks = container.querySelectorAll('.target-word-glow-focus, #focusedWordMark');
  oldMarks.forEach(m => {
    const parent = m.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    }
  });

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        const pName = node.parentNode ? node.parentNode.nodeName.toLowerCase() : '';
        if (pName === 'script' || pName === 'style' || pName === 'button') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let targetTextNode = null;
  let matchResult = null;
  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  for (const node of textNodes) {
    const text = node.textContent;
    let m = text.match(regex);
    if (!m && rootRegex) {
      m = text.match(rootRegex);
    }
    if (m) {
      targetTextNode = node;
      matchResult = m;
      break;
    }
  }

  if (!targetTextNode || !matchResult) {
    return null;
  }

  const matchText = matchResult[0];
  const matchIndex = targetTextNode.textContent.indexOf(matchText);
  if (matchIndex === -1) return null;

  const afterNode = targetTextNode.splitText(matchIndex);
  afterNode.textContent = afterNode.textContent.substring(matchText.length);

  const mark = document.createElement('mark');
  mark.className = 'target-word-glow-focus';
  mark.id = 'focusedWordMark';
  mark.textContent = matchText;

  targetTextNode.parentNode.insertBefore(mark, afterNode);
  return mark;
}

function focusWordInRenderedPage(targetWord) {
  if (!targetWord) return;
  const container = elements.pageCardBody || document.getElementById('pageCardBody');
  if (!container) return;

  try {
    const cleanWord = targetWord.trim();
    const markElem = highlightWordInDOMTextNodes(container, cleanWord);

    if (markElem) {
      AudioEngine.playChime();

      const performScroll = () => {
        const mark = document.getElementById('focusedWordMark');
        if (!mark) return;

        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const stage = elements.readerStage || document.getElementById('readerStage') || elements.readerViewport;
        if (stage && stage.scrollTo) {
          const markRect = mark.getBoundingClientRect();
          const stageRect = stage.getBoundingClientRect();
          const currentScroll = stage.scrollTop;
          const relativeTop = markRect.top - stageRect.top + currentScroll;
          stage.scrollTo({
            top: Math.max(0, relativeTop - (stage.clientHeight / 2)),
            behavior: 'smooth'
          });
        }
      };

      performScroll();
      setTimeout(performScroll, 120);
      setTimeout(performScroll, 350);
      setTimeout(performScroll, 600);

      showToast(`🎯 Located & Highlighted in Textbook: "${cleanWord}"`, 'info');
    } else {
      console.warn('Word not matched directly in DOM text nodes:', cleanWord);
    }
  } catch (e) {
    console.warn('focusWordInRenderedPage notice:', e);
  }
}

function jumpToWordInBook(targetPageNum, targetWord) {
  if (elements.vocabStudioModal) elements.vocabStudioModal.classList.remove('open');
  if (elements.dictionaryModal) elements.dictionaryModal.classList.remove('open');
  
  state.focusedTargetWord = targetWord;

  if (state.viewMode === 'image') {
    setViewMode('text');
  }

  goToPage(targetPageNum, false);

  setTimeout(() => focusWordInRenderedPage(targetWord), 60);
  setTimeout(() => focusWordInRenderedPage(targetWord), 200);
  setTimeout(() => focusWordInRenderedPage(targetWord), 450);
}

// 7. MAGOOSH-STYLE VOCABULARY BUILDER & QUIZ ENGINE (ALL 12 UNITS & 47 LESSONS)
function initVocabQuiz() {
  state.vocabList = window.VOCAB_DATA || [];
  state.activeVocabList = [...state.vocabList];
  updateLessonDropdown();
  renderSidebarVocabList();
}

function openVocabQuizModal() {
  if (!elements.vocabStudioModal) return;
  elements.vocabStudioModal.classList.add('open');
  if (elements.vUnitSelect) elements.vUnitSelect.value = state.quizUnit;
  updateLessonDropdown();
  if (elements.vLessonSelect) elements.vLessonSelect.value = state.quizLesson;
  filterVocabQuestions();
}

function updateLessonDropdown() {
  if (!elements.vLessonSelect) return;
  const currentUnit = elements.vUnitSelect ? elements.vUnitSelect.value : 'all';
  
  let filteredWords = state.vocabList;
  if (currentUnit !== 'all') {
    filteredWords = state.vocabList.filter(w => String(w.unitNumber) === String(currentUnit));
  }

  const lessonsSet = new Set(filteredWords.map(w => w.lesson).filter(Boolean));
  
  let optionsHtml = '<option value="all">📖 All Lessons</option>';
  lessonsSet.forEach(les => {
    optionsHtml += `<option value="${les}">${les}</option>`;
  });

  elements.vLessonSelect.innerHTML = optionsHtml;
}

function filterVocabQuestions() {
  const selectedUnit = elements.vUnitSelect ? elements.vUnitSelect.value : 'all';
  const selectedLesson = elements.vLessonSelect ? elements.vLessonSelect.value : 'all';
  const selectedLevel = state.quizLevel;

  state.quizUnit = selectedUnit;
  state.quizLesson = selectedLesson;

  state.activeVocabList = state.vocabList.filter(w => {
    const matchUnit = (selectedUnit === 'all') || (String(w.unitNumber) === String(selectedUnit));
    const matchLesson = (selectedLesson === 'all') || (w.lesson === selectedLesson);
    const matchLevel = (selectedLevel === 'all') || (w.level.toLowerCase() === selectedLevel.toLowerCase());
    return matchUnit && matchLesson && matchLevel;
  });

  state.quizIndex = 0;
  state.quizScore = 0;

  if (state.activeVocabList.length === 0) {
    if (elements.vQuestionCard) elements.vQuestionCard.style.display = 'none';
    if (elements.vResultsScreen) {
      elements.vResultsScreen.style.display = 'block';
      if (elements.vPerformanceMsg) {
        elements.vPerformanceMsg.innerHTML = '<div style="color: #f59e0b; padding: 2rem;">No vocabulary words found for this selection.<br>Try selecting "All Lessons" or a different Unit.</div>';
      }
      if (elements.vFinalScore) elements.vFinalScore.textContent = '0';
    }
    return;
  }

  if (elements.vQuestionCard) elements.vQuestionCard.style.display = 'block';
  if (elements.vResultsScreen) elements.vResultsScreen.style.display = 'none';
  renderVocabQuestion();
}

function startQuizForUnit(unitNum) {
  state.quizUnit = String(unitNum);
  state.quizLesson = 'all';
  openVocabQuizModal();
}

function startQuizForLesson(lessonTitle) {
  state.quizLesson = lessonTitle;
  // find unit for this lesson
  const found = state.vocabList.find(w => w.lesson === lessonTitle);
  if (found && found.unitNumber) {
    state.quizUnit = String(found.unitNumber);
  }
  openVocabQuizModal();
}

function renderVocabQuestion() {
  if (state.activeVocabList.length === 0) return;
  if (state.quizIndex >= state.activeVocabList.length) {
    showVocabResults();
    return;
  }

  const wordObj = state.activeVocabList[state.quizIndex];
  
  if (elements.vCurrentWordIndex) elements.vCurrentWordIndex.textContent = state.quizIndex + 1;
  if (elements.vTotalWordsCount) elements.vTotalWordsCount.textContent = state.activeVocabList.length;
  if (elements.vCurrentScore) elements.vCurrentScore.textContent = state.quizScore;
  
  const progressPct = ((state.quizIndex) / state.activeVocabList.length) * 100;
  if (elements.vQuizProgressBar) elements.vQuizProgressBar.style.width = `${progressPct}%`;

  if (elements.vWordBadge) {
    elements.vWordBadge.textContent = `${(wordObj.level || 'Intermediate').toUpperCase()} • ${(wordObj.lesson || 'Lesson').toUpperCase()}`;
  }
  if (elements.vTargetWord) elements.vTargetWord.textContent = wordObj.word;

  if (elements.vSpeakWordBtn) {
    elements.vSpeakWordBtn.onclick = (e) => {
      e.stopPropagation();
      speakText(wordObj.word);
    };
  }

  if (elements.vocabFeedbackCard) elements.vocabFeedbackCard.style.display = 'none';

  if (elements.vocabOptionsContainer) {
    const letters = ['A', 'B', 'C', 'D'];
    let html = '';
    wordObj.options.forEach((opt, idx) => {
      html += `
        <div class="vocab-option-pill" data-index="${idx}">
          <span class="vocab-opt-letter">${letters[idx]}</span>
          <span class="vocab-opt-text">${opt}</span>
        </div>
      `;
    });
    elements.vocabOptionsContainer.innerHTML = html;

    elements.vocabOptionsContainer.querySelectorAll('.vocab-option-pill').forEach(pill => {
      pill.onclick = () => handleVocabOptionSelection(pill, wordObj);
    });
  }
}

function handleVocabOptionSelection(pill, wordObj) {
  const allPills = elements.vocabOptionsContainer.querySelectorAll('.vocab-option-pill');
  allPills.forEach(p => p.classList.add('disabled'));

  const selectedText = pill.querySelector('.vocab-opt-text').textContent.trim();
  const isCorrect = selectedText === wordObj.correctDefinition;

  if (isCorrect) {
    pill.classList.add('correct');
    state.quizScore += 10;
    AudioEngine.playChime();
    if (elements.vFeedbackBanner) {
      elements.vFeedbackBanner.className = 'feedback-status-banner correct';
      elements.vFeedbackBanner.innerHTML = '<i class="fa-solid fa-circle-check"></i> Correct! Excellent memory!';
    }
  } else {
    pill.classList.add('wrong');
    AudioEngine.playClick();
    if (elements.vFeedbackBanner) {
      elements.vFeedbackBanner.className = 'feedback-status-banner incorrect';
      elements.vFeedbackBanner.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Not quite — see meaning and use cases below!';
    }
    allPills.forEach(p => {
      if (p.querySelector('.vocab-opt-text').textContent.trim() === wordObj.correctDefinition) {
        p.classList.add('correct');
      }
    });
  }

  let feedbackHtml = '';
  
  if (wordObj.bangla) {
    feedbackHtml += `
      <div class="feedback-bangla-banner">
        <div class="feedback-bangla-title"><i class="fa-solid fa-language"></i> বাংলা অর্থ (Bangla Meaning)</div>
        <div class="feedback-bangla-val">${wordObj.bangla}</div>
      </div>
    `;
  }

  feedbackHtml += `
    <div class="feedback-def-row">
      <span class="feedback-pos">${wordObj.partOfSpeech}</span>
      <span class="feedback-def">${wordObj.correctDefinition}</span>
    </div>
  `;

  if (wordObj.textbookUseCase || wordObj.example) {
    feedbackHtml += `
      <div class="dict-usecase-item textbook" style="margin-bottom: 8px;">
        <div class="usecase-tag"><i class="fa-solid fa-book-bookmark" style="color: #f59e0b;"></i> পাঠ্যবইয়ের প্রেক্ষাপট (Textbook Context)</div>
        <div class="usecase-sentence">"${wordObj.textbookUseCase || wordObj.example}"</div>
      </div>
    `;
  }

  if (wordObj.useCase) {
    feedbackHtml += `
      <div class="dict-usecase-item" style="margin-bottom: 12px;">
        <div class="usecase-tag"><i class="fa-solid fa-circle-check" style="color: #22c55e;"></i> বাস্তব প্রয়োগ ও পরীক্ষা ব্যবহারের বাক্য (Practical Use Case)</div>
        <div class="usecase-sentence">"${wordObj.useCase}"</div>
      </div>
    `;
  }

  // Morphological & Grammatical Forms
  const posFamily = GrammarEngine.derivePOSFamily(wordObj.word, wordObj.partOfSpeech);
  const verbForms = GrammarEngine.deriveVerbForms(wordObj.word, posFamily.verb);
  const degrees = GrammarEngine.deriveDegrees(wordObj.word, posFamily.adjective);

  feedbackHtml += `
    <div class="dict-grammar-card" style="margin: 10px 0;">
      <div class="grammar-card-header"><i class="fa-solid fa-shapes"></i> পদ পরিবর্তন ও ব্যাকরণগত রূপভেদ (Grammatical Forms)</div>
      <div class="pos-family-grid">
        <div class="pos-family-item"><span class="pos-family-tag">Noun</span><span class="pos-family-val">${posFamily.noun || '—'}</span></div>
        <div class="pos-family-item"><span class="pos-family-tag">Verb</span><span class="pos-family-val">${posFamily.verb || '—'}</span></div>
        <div class="pos-family-item"><span class="pos-family-tag">Adjective</span><span class="pos-family-val">${posFamily.adjective || '—'}</span></div>
        <div class="pos-family-item"><span class="pos-family-tag">Adverb</span><span class="pos-family-val">${posFamily.adverb || '—'}</span></div>
      </div>
      <div class="verb-forms-container">
        <div class="verb-forms-title"><i class="fa-solid fa-clock"></i> ক্রিয়ার কাল ও রূপ (Verb Tenses: V1, V2, V3, V4 & Future)</div>
        <div class="verb-forms-row">
          <div class="verb-form-cell"><span class="verb-form-lbl">Present (V1)</span><span class="verb-form-text">${verbForms.v1_present}</span></div>
          <div class="verb-form-cell"><span class="verb-form-lbl">Past (V2)</span><span class="verb-form-text">${verbForms.v2_past}</span></div>
          <div class="verb-form-cell"><span class="verb-form-lbl">Past Part. (V3)</span><span class="verb-form-text">${verbForms.v3_past_participle}</span></div>
          <div class="verb-form-cell"><span class="verb-form-lbl">Cont. (V4)</span><span class="verb-form-text">${verbForms.v4_continuous}</span></div>
          <div class="verb-form-cell"><span class="verb-form-lbl">Future</span><span class="verb-form-text">${verbForms.future}</span></div>
        </div>
      </div>
      <div class="degrees-container">
        <div class="degrees-title"><i class="fa-solid fa-chart-simple"></i> বিশেষণের তারতম্য (Degrees of Comparison)</div>
        <div class="degrees-row">
          <div class="degree-cell"><span class="degree-lbl">Positive</span><span class="degree-text">${degrees.positive}</span></div>
          <div class="degree-cell"><span class="degree-lbl">Comparative</span><span class="degree-text">${degrees.comparative}</span></div>
          <div class="degree-cell"><span class="degree-lbl">Superlative</span><span class="degree-text">${degrees.superlative}</span></div>
        </div>
      </div>
    </div>

    <!-- Synonyms & Antonyms in Quiz Feedback -->
    <div class="dict-syn-ant-container" style="margin: 10px 0;">
      <div class="synonyms-card">
        <div class="syn-ant-title syn"><i class="fa-solid fa-arrow-right-arrow-left"></i> সমার্থক শব্দ (Synonyms)</div>
        <div class="syn-ant-pills-wrap">
          ${(wordObj.synonyms || 'similar term, related word').split(',').map(s => `<span class="syn-pill">${s.trim()}</span>`).join('')}
        </div>
      </div>
      <div class="antonyms-card">
        <div class="syn-ant-title ant"><i class="fa-solid fa-arrows-split-up-and-left"></i> বিপরীতার্থক শব্দ (Antonyms)</div>
        <div class="syn-ant-pills-wrap">
          ${(wordObj.antonyms || 'opposite term, contrary').split(',').map(a => `<span class="ant-pill">${a.trim()}</span>`).join('')}
        </div>
      </div>
    </div>
  `;

  feedbackHtml += `
    <div class="textbook-reference-box">
      <div class="ref-meta">
        <i class="fa-solid fa-book-bookmark"></i>
        <span>${wordObj.unit} • ${wordObj.lesson}</span>
      </div>
      <button class="jump-to-book-btn" onclick="jumpToWordInBook(${wordObj.page}, '${wordObj.word}')" title="Redirect directly to this word in the textbook and highlight it">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> 📖 View in Textbook (Book Page ${wordObj.printedPage}) &rarr;
      </button>
    </div>
  `;

  const detailsContainer = elements.vocabFeedbackCard.querySelector('.feedback-details');
  if (detailsContainer) {
    detailsContainer.innerHTML = feedbackHtml;
  }

  if (elements.vocabFeedbackCard) {
    elements.vocabFeedbackCard.style.display = 'block';
  }
}

function showVocabResults() {
  if (elements.vQuestionCard) elements.vQuestionCard.style.display = 'none';
  if (elements.vocabFeedbackCard) elements.vocabFeedbackCard.style.display = 'none';
  if (elements.vResultsScreen) elements.vResultsScreen.style.display = 'block';

  const total = state.activeVocabList.length;
  const maxScore = total * 10;
  const pct = maxScore > 0 ? (state.quizScore / maxScore) * 100 : 0;

  if (elements.vFinalScore) elements.vFinalScore.textContent = `${state.quizScore} / ${maxScore} pts`;

  let msg = '';
  if (pct >= 90) msg = '🌟 Brilliant Mastery! You have exceptional command of NCTB textbook vocabulary!';
  else if (pct >= 70) msg = '👏 Great Job! Keep practicing lessons to achieve 100% mastery!';
  else if (pct >= 50) msg = '💪 Good Effort! Review the textbook context and retake the quiz to sharpen your recall.';
  else msg = '📖 Keep Learning! Read the lessons closely and practice active recall to build strong vocabulary.';

  if (elements.vPerformanceMsg) elements.vPerformanceMsg.textContent = msg;
}

function renderSidebarVocabList() {
  if (!elements.sidebarVocabList) return;
  
  const unitsMap = {};
  state.vocabList.forEach(w => {
    const uNum = w.unitNumber || 1;
    if (!unitsMap[uNum]) {
      unitsMap[uNum] = { unit: w.unit, words: [] };
    }
    unitsMap[uNum].words.push(w);
  });

  let html = '';
  Object.keys(unitsMap).sort((a,b) => a - b).forEach(uNum => {
    const uObj = unitsMap[uNum];
    html += `
      <div class="vocab-unit-practice-card" onclick="startQuizForUnit(${uNum})">
        <div class="vup-header">
          <span class="vup-title">${uObj.unit}</span>
          <span class="vup-badge">${uObj.words.length} Words</span>
        </div>
        <div class="vup-lessons">${Array.from(new Set(uObj.words.map(w => w.lesson))).join(' • ')}</div>
        <div class="vup-action"><i class="fa-solid fa-play"></i> Practice Unit ${uNum} MCQs &rarr;</div>
      </div>
    `;
  });

  elements.sidebarVocabList.innerHTML = html;
}

// 7.5 ADVANCED GRAMMATICAL MORPHOLOGY & CONJUGATION ENGINE
const GrammarEngine = {
  capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  },

  derivePOSFamily(word, posHint) {
    const w = word.toLowerCase().trim();
    if (window.BANGLA_DICT_DATA && window.BANGLA_DICT_DATA[w] && window.BANGLA_DICT_DATA[w].noun) {
      return {
        noun: window.BANGLA_DICT_DATA[w].noun,
        verb: window.BANGLA_DICT_DATA[w].verb,
        adjective: window.BANGLA_DICT_DATA[w].adjective,
        adverb: window.BANGLA_DICT_DATA[w].adverb
      };
    }

    let noun = '', verb = '', adjective = '', adverb = '';
    
    if (w.endsWith('tion') || w.endsWith('sion') || w.endsWith('ment') || w.endsWith('ness') || w.endsWith('ity') || w.endsWith('ance') || w.endsWith('ence')) {
      noun = this.capitalize(w);
      let base = w.replace(/(tion|sion|ment|ness|ity|ance|ence)$/, '');
      if (w.endsWith('tion')) verb = this.capitalize(base + (base.endsWith('a') ? 'te' : 'e'));
      else if (w.endsWith('ment')) verb = this.capitalize(base);
      else if (w.endsWith('ness')) adjective = this.capitalize(base);
      else verb = this.capitalize(base);
      
      if (!adjective) adjective = this.capitalize(base + 'al');
      if (!adverb) adverb = this.capitalize(base + 'ally');
    } else if (w.endsWith('ive') || w.endsWith('ous') || w.endsWith('ful') || w.endsWith('able') || w.endsWith('ible') || w.endsWith('al') || w.endsWith('ic') || w.endsWith('less')) {
      adjective = this.capitalize(w);
      adverb = this.capitalize(w.endsWith('ic') ? w + 'ally' : (w.endsWith('le') ? w.slice(0, -1) + 'y' : w + 'ly'));
      if (w.endsWith('ive')) {
        let base = w.slice(0, -3);
        verb = this.capitalize(base + (base.endsWith('t') ? '' : 'e'));
        noun = this.capitalize(base + 'tion');
      } else if (w.endsWith('ful')) {
        let base = w.slice(0, -3);
        noun = this.capitalize(base);
        verb = this.capitalize(base);
      } else if (w.endsWith('able')) {
        let base = w.slice(0, -4);
        verb = this.capitalize(base);
        noun = this.capitalize(base + 'ability');
      } else {
        noun = this.capitalize(w + 'ness');
      }
    } else if (w.endsWith('ly')) {
      adverb = this.capitalize(w);
      let adjBase = w.endsWith('ily') ? w.slice(0, -3) + 'y' : w.slice(0, -2);
      adjective = this.capitalize(adjBase);
      noun = this.capitalize(adjBase + 'ness');
      verb = this.capitalize(adjBase);
    } else {
      verb = this.capitalize(w);
      noun = this.capitalize(w.endsWith('e') ? w.slice(0, -1) + 'ation' : w + 'ation');
      adjective = this.capitalize(w.endsWith('e') ? w + 'd' : w + 'ed');
      adverb = this.capitalize(w + 'ly');
    }

    return {
      noun: noun || this.capitalize(w + ' (Noun)'),
      verb: verb || this.capitalize(w + ' (Verb)'),
      adjective: adjective || this.capitalize(w + ' (Adj)'),
      adverb: adverb || this.capitalize(w + ' (Adv)')
    };
  },

  deriveVerbForms(word, verbCandidate) {
    const w = word.toLowerCase().trim();
    if (window.BANGLA_DICT_DATA && window.BANGLA_DICT_DATA[w] && window.BANGLA_DICT_DATA[w].verbForms) {
      return window.BANGLA_DICT_DATA[w].verbForms;
    }

    const v = (verbCandidate || word).toLowerCase().split(/[\s\/]/)[0];
    const irregulars = {
      "be": { v1_present: "be / is / are", v2_past: "was / were", v3_past_participle: "been", v4_continuous: "being", future: "will be" },
      "have": { v1_present: "have / has", v2_past: "had", v3_past_participle: "had", v4_continuous: "having", future: "will have" },
      "do": { v1_present: "do / does", v2_past: "did", v3_past_participle: "done", v4_continuous: "doing", future: "will do" },
      "go": { v1_present: "go / goes", v2_past: "went", v3_past_participle: "gone", v4_continuous: "going", future: "will go" },
      "eat": { v1_present: "eat / eats", v2_past: "ate", v3_past_participle: "eaten", v4_continuous: "eating", future: "will eat" },
      "sing": { v1_present: "sing / sings", v2_past: "sang", v3_past_participle: "sung", v4_continuous: "singing", future: "will sing" },
      "fly": { v1_present: "fly / flies", v2_past: "flew", v3_past_participle: "flown", v4_continuous: "flying", future: "will fly" },
      "write": { v1_present: "write / writes", v2_past: "wrote", v3_past_participle: "written", v4_continuous: "writing", future: "will write" },
      "break": { v1_present: "break / breaks", v2_past: "broke", v3_past_participle: "broken", v4_continuous: "breaking", future: "will break" },
      "take": { v1_present: "take / takes", v2_past: "took", v3_past_participle: "taken", v4_continuous: "taking", future: "will take" },
      "see": { v1_present: "see / sees", v2_past: "saw", v3_past_participle: "seen", v4_continuous: "seeing", future: "will see" },
      "beat": { v1_present: "beat / beats", v2_past: "beat", v3_past_participle: "beaten", v4_continuous: "beating", future: "will beat" },
      "swim": { v1_present: "swim / swims", v2_past: "swam", v3_past_participle: "swum", v4_continuous: "swimming", future: "will swim" }
    };

    if (irregulars[v]) return irregulars[v];

    let v1 = `${v} / ${v.endsWith('s') || v.endsWith('sh') || v.endsWith('ch') || v.endsWith('x') ? v + 'es' : (v.endsWith('y') && !/[aeiou]y$/.test(v) ? v.slice(0, -1) + 'ies' : v + 's')}`;
    let v2 = v.endsWith('e') ? v + 'd' : (v.endsWith('y') && !/[aeiou]y$/.test(v) ? v.slice(0, -1) + 'ied' : v + 'ed');
    let v3 = v2;
    let v4 = v.endsWith('ie') ? v.slice(0, -2) + 'ying' : (v.endsWith('e') && !v.endsWith('ee') ? v.slice(0, -1) + 'ing' : v + 'ing');
    let fut = `will ${v}`;

    return {
      v1_present: v1,
      v2_past: v2,
      v3_past_participle: v3,
      v4_continuous: v4,
      future: fut
    };
  },

  deriveDegrees(word, adjCandidate) {
    const w = word.toLowerCase().trim();
    if (window.BANGLA_DICT_DATA && window.BANGLA_DICT_DATA[w] && window.BANGLA_DICT_DATA[w].degrees) {
      return window.BANGLA_DICT_DATA[w].degrees;
    }

    const a = (adjCandidate || word).toLowerCase().split(/[\s\/]/)[0];
    const irregularDegrees = {
      "good": { positive: "good", comparative: "better", superlative: "best" },
      "well": { positive: "well", comparative: "better", superlative: "best" },
      "bad": { positive: "bad", comparative: "worse", superlative: "worst" },
      "ill": { positive: "ill", comparative: "worse", superlative: "worst" },
      "little": { positive: "little", comparative: "less / lesser", superlative: "least" },
      "much": { positive: "much", comparative: "more", superlative: "most" },
      "many": { positive: "many", comparative: "more", superlative: "most" },
      "far": { positive: "far", comparative: "farther / further", superlative: "farthest / furthest" },
      "old": { positive: "old", comparative: "older / elder", superlative: "oldest / eldest" }
    };

    if (irregularDegrees[a]) return irregularDegrees[a];

    if (a.length <= 5 && !a.endsWith('ed') && !a.endsWith('ic') && !a.endsWith('al')) {
      let comp = a.endsWith('e') ? a + 'r' : (a.endsWith('y') ? a.slice(0, -1) + 'ier' : a + 'er');
      let sup = a.endsWith('e') ? a + 'st' : (a.endsWith('y') ? a.slice(0, -1) + 'iest' : a + 'est');
      return { positive: a, comparative: comp, superlative: sup };
    }

    return {
      positive: a,
      comparative: `more ${a}`,
      superlative: `most ${a}`
    };
  }
};

// 8. BILINGUAL BANGLA DICTIONARY LOOKUP ENGINE
async function lookupDictionary(word) {
  if (!word || !word.trim()) return;
  const cleanWord = word.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
  if (!cleanWord) return;

  if (elements.dictWordTitle) elements.dictWordTitle.textContent = cleanWord;
  if (elements.dictPhonetic) elements.dictPhonetic.textContent = 'Looking up...';
  if (elements.dictModalBody) {
    elements.dictModalBody.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--accent); margin-bottom: 0.8rem;"></i>
        <p style="color: var(--text-muted);">Fetching definition & Bangla translation...</p>
      </div>
    `;
  }

  if (elements.dictionaryModal) elements.dictionaryModal.classList.add('open');

  if (elements.dictSpeakBtn) {
    elements.dictSpeakBtn.onclick = () => speakText(cleanWord);
  }

  let localData = null;
  if (window.BANGLA_DICT_DATA && window.BANGLA_DICT_DATA[cleanWord]) {
    localData = window.BANGLA_DICT_DATA[cleanWord];
  } else if (window.VOCAB_DATA) {
    const vMatch = window.VOCAB_DATA.find(v => v.word.toLowerCase() === cleanWord);
    if (vMatch) {
      localData = {
        bangla: vMatch.bangla,
        definition: vMatch.correctDefinition,
        partOfSpeech: vMatch.partOfSpeech,
        useCase: vMatch.useCase,
        textbookUseCase: vMatch.textbookUseCase,
        synonyms: vMatch.synonyms,
        antonyms: vMatch.antonyms
      };
    }
  }

  let apiEntry = null;
  let liveBangla = null;

  try {
    const dictResp = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
    if (dictResp.ok) {
      const data = await dictResp.json();
      if (Array.isArray(data) && data.length > 0) {
        apiEntry = data[0];
      }
    }
  } catch (e) {
    console.warn('Free Dictionary API notice:', e);
  }

  if (!localData || !localData.bangla) {
    try {
      const transResp = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|bn`);
      if (transResp.ok) {
        const tData = await transResp.json();
        if (tData.responseData && tData.responseData.translatedText) {
          liveBangla = tData.responseData.translatedText;
        }
      }
    } catch (e) {
      console.warn('MyMemory Bangla Translation notice:', e);
    }
  }

  const finalBangla = (localData && localData.bangla) ? localData.bangla : (liveBangla || 'অভিধানে অর্থ খোঁজা হচ্ছে...');
  renderBilingualDictionaryData(cleanWord, apiEntry, localData, finalBangla);
}

function renderBilingualDictionaryData(word, entry, localData, banglaText) {
  const phonetic = entry ? (entry.phonetic || (entry.phonetics && entry.phonetics[0] ? entry.phonetics[0].text : '')) : '';
  if (elements.dictPhonetic) elements.dictPhonetic.textContent = phonetic || `/${word}/`;

  let html = '';

  // 1. Prominent Bangla Meaning Box
  if (banglaText) {
    html += `
      <div class="dict-bangla-box">
        <div class="dict-bangla-label"><i class="fa-solid fa-language"></i> বাংলা অর্থ (Bangla Meaning)</div>
        <div class="dict-bangla-text">${banglaText}</div>
      </div>
    `;
  }

  // 2. English Definitions & Part of Speech
  let detectedPos = 'noun';
  if (entry && entry.meanings && entry.meanings.length > 0) {
    detectedPos = entry.meanings[0].partOfSpeech || 'noun';
    entry.meanings.forEach(m => {
      html += `<div class="dict-meaning-item">`;
      html += `<span class="dict-part-of-speech">${m.partOfSpeech}</span>`;
      if (m.definitions) {
        m.definitions.slice(0, 2).forEach((d, idx) => {
          html += `<div class="dict-def-text"><strong>${idx + 1}.</strong> ${d.definition}</div>`;
          if (d.example) {
            html += `<div class="dict-example-text">"${d.example}"</div>`;
          }
        });
      }
      html += `</div>`;
    });
  } else if (localData && localData.definition) {
    detectedPos = (localData.partOfSpeech || '').toLowerCase().includes('adj') ? 'adjective' : ((localData.partOfSpeech || '').toLowerCase().includes('verb') ? 'verb' : 'noun');
    html += `
      <div class="dict-meaning-item">
        <span class="dict-part-of-speech">${localData.partOfSpeech || 'Vocabulary'}</span>
        <div class="dict-def-text">${localData.definition}</div>
      </div>
    `;
  }

  // 3. COMPLETE GRAMMATICAL MORPHOLOGY & FORMS SECTION
  const posFamily = GrammarEngine.derivePOSFamily(word, detectedPos);
  const verbForms = GrammarEngine.deriveVerbForms(word, posFamily.verb);
  const degrees = GrammarEngine.deriveDegrees(word, posFamily.adjective);

  html += `
    <div class="dict-grammar-card">
      <div class="grammar-card-header"><i class="fa-solid fa-shapes"></i> পদ পরিবর্তন ও ব্যাকরণগত রূপভেদ (Grammatical Forms)</div>
      
      <!-- 4 Parts of Speech Family Grid -->
      <div class="pos-family-grid">
        <div class="pos-family-item">
          <span class="pos-family-tag">Noun (বিশেষ্য)</span>
          <span class="pos-family-val">${posFamily.noun || '—'}</span>
        </div>
        <div class="pos-family-item">
          <span class="pos-family-tag">Verb (ক্রিয়া)</span>
          <span class="pos-family-val">${posFamily.verb || '—'}</span>
        </div>
        <div class="pos-family-item">
          <span class="pos-family-tag">Adjective (বিশেষণ)</span>
          <span class="pos-family-val">${posFamily.adjective || '—'}</span>
        </div>
        <div class="pos-family-item">
          <span class="pos-family-tag">Adverb (ভাববিশেষণ)</span>
          <span class="pos-family-val">${posFamily.adverb || '—'}</span>
        </div>
      </div>

      <!-- Verb Tense Forms (Present, Past, Past Participle, Continuous, Future) -->
      <div class="verb-forms-container">
        <div class="verb-forms-title"><i class="fa-solid fa-clock"></i> ক্রিয়ার কাল ও রূপ (Verb Tenses: V1, V2, V3, V4 & Future)</div>
        <div class="verb-forms-row">
          <div class="verb-form-cell">
            <span class="verb-form-lbl">Present (V1)</span>
            <span class="verb-form-text">${verbForms.v1_present}</span>
          </div>
          <div class="verb-form-cell">
            <span class="verb-form-lbl">Past (V2)</span>
            <span class="verb-form-text">${verbForms.v2_past}</span>
          </div>
          <div class="verb-form-cell">
            <span class="verb-form-lbl">Past Participle (V3)</span>
            <span class="verb-form-text">${verbForms.v3_past_participle}</span>
          </div>
          <div class="verb-form-cell">
            <span class="verb-form-lbl">Continuous (V4)</span>
            <span class="verb-form-text">${verbForms.v4_continuous}</span>
          </div>
          <div class="verb-form-cell">
            <span class="verb-form-lbl">Future</span>
            <span class="verb-form-text">${verbForms.future}</span>
          </div>
        </div>
      </div>

      <!-- Degrees of Comparison for Adjectives -->
      <div class="degrees-container">
        <div class="degrees-title"><i class="fa-solid fa-chart-simple"></i> বিশেষণের তারতম্য (Degrees of Comparison)</div>
        <div class="degrees-row">
          <div class="degree-cell">
            <span class="degree-lbl">Positive Degree</span>
            <span class="degree-text">${degrees.positive}</span>
          </div>
          <div class="degree-cell">
            <span class="degree-lbl">Comparative Degree</span>
            <span class="degree-text">${degrees.comparative}</span>
          </div>
          <div class="degree-cell">
            <span class="degree-lbl">Superlative Degree</span>
            <span class="degree-text">${degrees.superlative}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // 4. Synonyms & Antonyms Side-by-Side Cards
  const rawSyn = (localData && localData.synonyms) ? localData.synonyms : 'similar term, related word, equivalent';
  const rawAnt = (localData && localData.antonyms) ? localData.antonyms : 'opposite term, contrary, reverse';

  const synList = rawSyn.split(',').map(s => s.trim()).filter(Boolean);
  const antList = rawAnt.split(',').map(s => s.trim()).filter(Boolean);

  html += `
    <div class="dict-syn-ant-container">
      <div class="synonyms-card">
        <div class="syn-ant-title syn"><i class="fa-solid fa-arrow-right-arrow-left"></i> সমার্থক শব্দ (Synonyms)</div>
        <div class="syn-ant-pills-wrap">
          ${synList.map(s => `<span class="syn-pill">${s}</span>`).join('')}
        </div>
      </div>
      <div class="antonyms-card">
        <div class="syn-ant-title ant"><i class="fa-solid fa-arrows-split-up-and-left"></i> বিপরীতার্থক শব্দ (Antonyms)</div>
        <div class="syn-ant-pills-wrap">
          ${antList.map(a => `<span class="ant-pill">${a}</span>`).join('')}
        </div>
      </div>
    </div>
  `;

  // 5. Rich Use Cases Section
  html += `<div class="dict-usecases-section">`;
  html += `<div class="dict-section-title"><i class="fa-solid fa-pen-nib"></i> বাস্তব প্রয়োগ ও ব্যবহারের ক্ষেত্র (Use Cases)</div>`;

  if (localData && localData.textbookUseCase) {
    html += `
      <div class="dict-usecase-item textbook">
        <div class="usecase-tag"><i class="fa-solid fa-book-bookmark" style="color: #f59e0b;"></i> পাঠ্যবইয়ের প্রেক্ষাপট (Textbook Context)</div>
        <div class="usecase-sentence">"${localData.textbookUseCase}"</div>
      </div>
    `;
  }

  if (localData && localData.useCase) {
    html += `
      <div class="dict-usecase-item">
        <div class="usecase-tag"><i class="fa-solid fa-circle-check" style="color: #22c55e;"></i> বাস্তব জীবনে ও পরীক্ষায় ব্যবহারের বাক্য (Practical Use Case)</div>
        <div class="usecase-sentence">"${localData.useCase}"</div>
      </div>
    `;
  } else if (!localData || !localData.useCase) {
    html += `
      <div class="dict-usecase-item">
        <div class="usecase-tag"><i class="fa-solid fa-circle-check" style="color: #22c55e;"></i> বাক্য প্রয়োগ (Sentence Usage)</div>
        <div class="usecase-sentence">"The student learned how to use the word '${word}' accurately in English sentences and comprehension exercises."</div>
      </div>
    `;
  }

  html += `</div>`;

  if (elements.dictModalBody) elements.dictModalBody.innerHTML = html;
}

function speakText(text) {
  if (!text) return;
  if (state.speechSynth && state.speechSynth.speaking) state.speechSynth.cancel();
  const ut = new SpeechSynthesisUtterance(text);
  ut.lang = 'en-US';
  if (elements.ttsRateSelect) ut.rate = parseFloat(elements.ttsRateSelect.value || '1.0');
  state.speechSynth.speak(ut);
}

// 9. TABLE OF CONTENTS & BOOKMARKS
function renderTOC() {
  if (!state.bookData || !state.bookData.toc || !elements.tocTree) return;

  let html = '';
  state.bookData.toc.forEach((unit, uIdx) => {
    const isExpanded = (uIdx === 0) ? 'expanded' : '';
    html += `
      <div class="toc-unit-item ${isExpanded}" data-page="${unit.start_page}" data-unit="${unit.unit_number || (uIdx + 1)}">
        <div class="toc-unit-header" onclick="toggleTOCUnit(this)">
          <div class="toc-unit-left">
            <i class="fa-solid fa-folder${isExpanded ? '-open' : ''} toc-unit-icon"></i>
            <span class="toc-unit-title">${unit.title}</span>
          </div>
          <div class="toc-unit-actions">
            <button class="unit-quiz-mini-btn" onclick="event.stopPropagation(); startQuizForUnit(${unit.unit_number || (uIdx + 1)});" title="Practice MCQs for this Unit">
              <i class="fa-solid fa-graduation-cap"></i> Quiz
            </button>
            <i class="fa-solid fa-chevron-down toc-arrow"></i>
          </div>
        </div>
        <div class="toc-lessons-list">
    `;

    if (unit.lessons && unit.lessons.length > 0) {
      unit.lessons.forEach(lesson => {
        const displayPage = lesson.start_page >= 7 ? lesson.start_page - 6 : lesson.start_page;
        html += `
          <div class="toc-lesson-item" data-page="${lesson.start_page}" onclick="goToPage(${lesson.start_page})">
            <div class="toc-lesson-left">
              <i class="fa-regular fa-file-lines toc-lesson-icon"></i>
              <span class="toc-lesson-title" title="${lesson.title}">${lesson.title}</span>
            </div>
            <div class="toc-lesson-meta">
              <span class="toc-page-tag">p. ${displayPage}</span>
              <button class="lesson-quiz-mini-btn" onclick="event.stopPropagation(); startQuizForLesson('${lesson.title.replace(/'/g, "\'")}');" title="Practice Lesson MCQs">
                <i class="fa-solid fa-graduation-cap"></i>
              </button>
            </div>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;
  });

  elements.tocTree.innerHTML = html;
}

function toggleTOCUnit(headerElem) {
  const unitItem = headerElem.closest('.toc-unit-item');
  if (!unitItem) return;
  unitItem.classList.toggle('expanded');
  const icon = unitItem.querySelector('.toc-unit-icon');
  if (icon) {
    if (unitItem.classList.contains('expanded')) {
      icon.className = 'fa-solid fa-folder-open toc-unit-icon';
    } else {
      icon.className = 'fa-solid fa-folder toc-unit-icon';
    }
  }
}

function filterTOC(query) {
  if (!elements.tocTree) return;
  const q = (query || '').toLowerCase().trim();
  const unitItems = elements.tocTree.querySelectorAll('.toc-unit-item');

  unitItems.forEach(unitItem => {
    const unitTitle = (unitItem.querySelector('.toc-unit-title')?.textContent || '').toLowerCase();
    const lessonItems = unitItem.querySelectorAll('.toc-lesson-item');
    let hasMatchingLesson = false;

    lessonItems.forEach(lItem => {
      const lTitle = (lItem.querySelector('.toc-lesson-title')?.textContent || '').toLowerCase();
      if (!q || lTitle.includes(q) || unitTitle.includes(q)) {
        lItem.style.display = 'flex';
        hasMatchingLesson = true;
      } else {
        lItem.style.display = 'none';
      }
    });

    if (!q) {
      unitItem.style.display = 'block';
    } else if (unitTitle.includes(q) || hasMatchingLesson) {
      unitItem.style.display = 'block';
      unitItem.classList.add('expanded');
    } else {
      unitItem.style.display = 'none';
    }
  });
}

function highlightActiveTOC(pageNum) {
  if (!elements.tocTree) return;
  const lessonItems = elements.tocTree.querySelectorAll('.toc-lesson-item');
  lessonItems.forEach(item => item.classList.remove('active'));

  let activeItem = null;
  lessonItems.forEach(item => {
    const itemPage = parseInt(item.dataset.page, 10);
    if (itemPage <= pageNum) {
      activeItem = item;
    }
  });

  if (activeItem) {
    activeItem.classList.add('active');
    const parentUnit = activeItem.closest('.toc-unit-item');
    if (parentUnit) {
      parentUnit.classList.add('expanded');
      try {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {}
    }
  }
}

function renderBookmarks() {
  if (!elements.bookmarksList) return;
  if (state.bookmarks.length === 0) {
    elements.bookmarksList.innerHTML = '<div class="empty-msg"><i class="fa-regular fa-bookmark" style="font-size: 2rem; color: var(--accent); margin-bottom: 0.5rem; display: block;"></i>No bookmarks saved yet.<br>Click the bookmark icon to save this page!</div>';
    return;
  }

  let html = '';
  state.bookmarks.forEach(b => {
    html += `
      <div class="bookmark-item" onclick="goToPage(${b.page})">
        <div class="bookmark-info">
          <div class="bookmark-title">${b.title || `Book Page ${b.printedPage}`}</div>
          <div class="bookmark-meta">Page ${b.printedPage} • ${b.date}</div>
        </div>
        <button class="remove-btn" onclick="event.stopPropagation(); removeBookmark(${b.page})"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    `;
  });
  elements.bookmarksList.innerHTML = html;
}

function toggleBookmark() {
  const page = state.currentPage;
  const printedPage = state.currentPage >= 7 ? state.currentPage - 6 : state.currentPage;
  const idx = state.bookmarks.findIndex(b => b.page === page);

  if (idx !== -1) {
    state.bookmarks.splice(idx, 1);
    showToast('Bookmark removed', 'info');
  } else {
    const pageObj = (state.bookData && state.bookData.pages) ? state.bookData.pages[page - 1] : null;
    const title = pageObj ? (pageObj.lesson_title || pageObj.unit_title || `Page ${printedPage}`) : `Page ${printedPage}`;
    state.bookmarks.push({
      page,
      printedPage,
      title,
      date: new Date().toLocaleDateString()
    });
    showToast(`Bookmarked Page ${printedPage}!`, 'success');
  }

  localStorage.setItem('e4t_bookmarks', JSON.stringify(state.bookmarks));
  updateBookmarkButtonState();
  renderBookmarks();
}

function removeBookmark(page) {
  state.bookmarks = state.bookmarks.filter(b => b.page !== page);
  localStorage.setItem('e4t_bookmarks', JSON.stringify(state.bookmarks));
  updateBookmarkButtonState();
  renderBookmarks();
}

function updateBookmarkButtonState() {
  if (!elements.bookmarkTriggerBtn) return;
  const isBookmarked = state.bookmarks.some(b => b.page === state.currentPage);
  if (isBookmarked) {
    elements.bookmarkTriggerBtn.classList.add('bookmarked');
    elements.bookmarkTriggerBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
  } else {
    elements.bookmarkTriggerBtn.classList.remove('bookmarked');
    elements.bookmarkTriggerBtn.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
  }
}

// 10. HIGHLIGHTS & NOTES ENGINE
function setupTextSelectionEngine() {
  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      if (elements.textSelectionMenu && !elements.noteModal.classList.contains('open')) {
        elements.textSelectionMenu.style.display = 'none';
      }
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 2) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (elements.textSelectionMenu) {
      elements.textSelectionMenu.style.display = 'flex';
      elements.textSelectionMenu.style.top = `${rect.top + window.scrollY - 45}px`;
      elements.textSelectionMenu.style.left = `${rect.left + window.scrollX + (rect.width / 2) - 100}px`;
    }
  });

  if (elements.selDefineBtn) {
    elements.selDefineBtn.onclick = () => {
      const selection = window.getSelection();
      if (selection) {
        const text = selection.toString().trim();
        lookupDictionary(text);
        if (elements.textSelectionMenu) elements.textSelectionMenu.style.display = 'none';
      }
    };
  }

  if (elements.selHighlightYellow) {
    elements.selHighlightYellow.onclick = () => applyHighlightColor('yellow');
  }
  if (elements.selHighlightGreen) {
    elements.selHighlightGreen.onclick = () => applyHighlightColor('green');
  }
  if (elements.selHighlightPink) {
    elements.selHighlightPink.onclick = () => applyHighlightColor('pink');
  }

  if (elements.selAddNoteBtn) {
    elements.selAddNoteBtn.onclick = () => {
      const selection = window.getSelection();
      if (selection) {
        const text = selection.toString().trim();
        openNoteModal(text);
        if (elements.textSelectionMenu) elements.textSelectionMenu.style.display = 'none';
      }
    };
  }

  // Double Click for instant Dictionary lookup
  if (elements.pageCardBody) {
    elements.pageCardBody.addEventListener('dblclick', (e) => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';
      if (text) {
        lookupDictionary(text);
      }
    });
  }
}

function applyHighlightColor(color) {
  const selection = window.getSelection();
  if (!selection || !selection.toString().trim()) return;

  const text = selection.toString().trim();
  const page = state.currentPage;

  state.highlights.push({
    page,
    text,
    color,
    date: new Date().toLocaleDateString()
  });

  localStorage.setItem('e4t_highlights', JSON.stringify(state.highlights));
  applyUserHighlights(page);
  showToast(`Highlighted in ${color}!`, 'success');

  if (elements.textSelectionMenu) elements.textSelectionMenu.style.display = 'none';
  selection.removeAllRanges();
}

function applyUserHighlights(pageNum) {
  if (!elements.pageCardBody) return;
  const pageHighlights = state.highlights.filter(h => h.page === pageNum);
  if (pageHighlights.length === 0) return;

  pageHighlights.forEach(hl => {
    try {
      const pattern = new RegExp('(' + escapeRegExp(hl.text) + ')', 'gi');
      elements.pageCardBody.innerHTML = elements.pageCardBody.innerHTML.replace(pattern, `<mark class="user-highlight-${hl.color}">$1</mark>`);
    } catch (e) {
      console.warn('Highlight injection notice:', e);
    }
  });
}

function openNoteModal(quote) {
  if (!elements.noteModal) return;
  if (elements.noteQuotePreview) elements.noteQuotePreview.textContent = `"${quote}"`;
  if (elements.noteInput) elements.noteInput.value = '';
  elements.noteModal.classList.add('open');
  if (elements.noteInput) elements.noteInput.focus();
}

function savePersonalNote() {
  const noteText = elements.noteInput ? elements.noteInput.value.trim() : '';
  const quote = elements.noteQuotePreview ? elements.noteQuotePreview.textContent.replace(/^"|"$/g, '') : '';
  
  if (!noteText) {
    showToast('Please type your note text', 'error');
    return;
  }

  const printedPage = state.currentPage >= 7 ? state.currentPage - 6 : state.currentPage;

  state.notes.push({
    id: Date.now(),
    page: state.currentPage,
    printedPage,
    quote,
    note: noteText,
    date: new Date().toLocaleDateString()
  });

  localStorage.setItem('e4t_notes', JSON.stringify(state.notes));
  renderNotes();
  if (elements.noteModal) elements.noteModal.classList.remove('open');
  showToast('Study note saved successfully!', 'success');
}

function renderNotes() {
  if (!elements.notesList) return;
  if (state.notes.length === 0) {
    elements.notesList.innerHTML = '<div class="empty-msg"><i class="fa-solid fa-highlighter" style="font-size: 2rem; color: var(--accent); margin-bottom: 0.5rem; display: block;"></i>Highlight any text on the page to save quotes, study colors, or attach personal study notes!</div>';
    return;
  }

  let html = '';
  state.notes.forEach(n => {
    html += `
      <div class="note-card-item" onclick="goToPage(${n.page})">
        <div class="note-card-header">
          <span class="note-page-tag"><i class="fa-regular fa-bookmark"></i> Page ${n.printedPage}</span>
          <button class="remove-btn" onclick="event.stopPropagation(); deleteNote(${n.id})"><i class="fa-solid fa-trash-can"></i></button>
        </div>
        ${n.quote ? `<div class="note-quote-box">"${n.quote}"</div>` : ''}
        <div class="note-body-text">${n.note}</div>
        <div class="note-date-tag">${n.date}</div>
      </div>
    `;
  });
  elements.notesList.innerHTML = html;
}

function deleteNote(id) {
  state.notes = state.notes.filter(n => n.id !== id);
  localStorage.setItem('e4t_notes', JSON.stringify(state.notes));
  renderNotes();
}

// 11. SEARCH ENGINE (FULL TEXT & TOC)
function performGlobalSearch(query) {
  if (!query || query.length < 2 || !state.bookData) {
    if (elements.searchResultsList) {
      elements.searchResultsList.innerHTML = '<div class="search-empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>Type at least 2 characters to search across all 295 textbook pages.</p></div>';
    }
    return;
  }

  const results = [];
  const cleanQ = query.toLowerCase();

  state.bookData.pages.forEach(p => {
    const txt = p.text || '';
    const idx = txt.toLowerCase().indexOf(cleanQ);
    if (idx !== -1) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(txt.length, idx + cleanQ.length + 60);
      let snippet = txt.substring(start, end).replace(/\n/g, ' ');
      if (start > 0) snippet = '...' + snippet;
      if (end < txt.length) snippet += '...';

      const printedPage = p.printed_page_number || (p.page_number >= 7 ? p.page_number - 6 : p.page_number);

      results.push({
        page: p.page_number,
        printedPage,
        unit: p.unit_title || 'Unit',
        lesson: p.lesson_title || `Page ${printedPage}`,
        snippet
      });
    }
  });

  if (results.length === 0) {
    if (elements.searchResultsList) {
      elements.searchResultsList.innerHTML = `<div class="search-empty-state"><i class="fa-solid fa-face-frown"></i><p>No results found for "${query}".</p></div>`;
    }
    return;
  }

  let html = `<div class="search-results-summary">${results.length} occurrences found in English For Today:</div>`;
  results.slice(0, 50).forEach(res => {
    const highlighted = res.snippet.replace(new RegExp('(' + escapeRegExp(query) + ')', 'gi'), '<mark class="search-highlight">$1</mark>');
    html += `
      <div class="search-result-card" onclick="goToPage(${res.page}); closeSearchModal();">
        <div class="sr-header">
          <span class="sr-title">${res.lesson}</span>
          <span class="sr-badge">Book Page ${res.printedPage}</span>
        </div>
        <div class="sr-unit">${res.unit}</div>
        <div class="sr-snippet">${highlighted}</div>
      </div>
    `;
  });

  if (elements.searchResultsList) elements.searchResultsList.innerHTML = html;
}

function openSearchModal() {
  if (!elements.searchModal) return;
  elements.searchModal.classList.add('open');
  if (elements.globalSearchInput) {
    elements.globalSearchInput.focus();
    elements.globalSearchInput.select();
  }
}

function closeSearchModal() {
  if (elements.searchModal) elements.searchModal.classList.remove('open');
}

// 12. TEXT-TO-SPEECH (AUDIO ENGINE)
function togglePlayAudio() {
  if (!state.speechSynth) {
    showToast('Speech synthesis not supported on this browser', 'error');
    return;
  }

  if (state.audioPlaying) {
    stopAudio();
    return;
  }

  const pageObj = (state.bookData && state.bookData.pages) ? state.bookData.pages[state.currentPage - 1] : null;
  if (!pageObj || !pageObj.text || !pageObj.text.trim()) {
    showToast('No text available to read on this page', 'info');
    return;
  }

  state.speechSynth.cancel();

  const clean = cleanOcrText(pageObj.text)
    .replace(/^\s*\d+\s+English For Today\s*/gi, '')
    .replace(/^English For Today.*?\d+\s*/gi, '');

  state.currentUtterance = new SpeechSynthesisUtterance(clean);
  state.currentUtterance.lang = 'en-US';
  if (elements.ttsRateSelect) state.currentUtterance.rate = parseFloat(elements.ttsRateSelect.value || '1.0');

  state.currentUtterance.onstart = () => {
    state.audioPlaying = true;
    if (elements.audioPlayBtn) {
      elements.audioPlayBtn.classList.add('playing');
      elements.audioPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    }
  };

  state.currentUtterance.onend = () => {
    stopAudio();
  };

  state.currentUtterance.onerror = () => {
    stopAudio();
  };

  state.speechSynth.speak(state.currentUtterance);
}

function stopAudio() {
  if (state.speechSynth) state.speechSynth.cancel();
  state.audioPlaying = false;
  if (elements.audioPlayBtn) {
    elements.audioPlayBtn.classList.remove('playing');
    elements.audioPlayBtn.innerHTML = '<i class="fa-solid fa-headphones"></i> Listen';
  }
}

// 13. SETTINGS, THEMES & PREFERENCES
function setViewMode(mode) {
  state.viewMode = mode;
  [elements.btnModeText, elements.btnModeSplit, elements.btnModeImage].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });

  if (elements.textViewContainer) elements.textViewContainer.style.display = 'none';
  if (elements.imageViewContainer) elements.imageViewContainer.style.display = 'none';
  if (elements.readerStage) elements.readerStage.className = 'reader-stage';

  if (mode === 'text') {
    if (elements.btnModeText) elements.btnModeText.classList.add('active');
    if (elements.textViewContainer) elements.textViewContainer.style.display = 'block';
  } else if (mode === 'image') {
    if (elements.btnModeImage) elements.btnModeImage.classList.add('active');
    if (elements.imageViewContainer) elements.imageViewContainer.style.display = 'flex';
  } else if (mode === 'split') {
    if (elements.btnModeSplit) elements.btnModeSplit.classList.add('active');
    if (elements.textViewContainer) elements.textViewContainer.style.display = 'block';
    if (elements.imageViewContainer) elements.imageViewContainer.style.display = 'flex';
    if (elements.readerStage) elements.readerStage.classList.add('split-mode-active');
  }

  if ((mode === 'image' || mode === 'split') && elements.originalPageImg && state.bookData && state.bookData.pages) {
    const pageObj = state.bookData.pages[state.currentPage - 1];
    if (pageObj) {
      elements.originalPageImg.src = pageObj.image || `assets/pages/page_${state.currentPage}.png`;
    }
  }

  localStorage.setItem('e4t_view_mode', mode);
}

function applyTheme(themeName) {
  document.body.setAttribute('data-theme', themeName);
  state.currentTheme = themeName;
  localStorage.setItem('e4t_theme', themeName);

  document.querySelectorAll('.theme-opt-btn').forEach(btn => {
    if (btn.dataset.theme === themeName) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

function applyFontSize(size) {
  state.fontSize = size;
  document.documentElement.style.setProperty('--font-reader-size', `${size}px`);
  if (elements.fontSizeVal) elements.fontSizeVal.textContent = `${size}px`;
  localStorage.setItem('e4t_font_size', size);
}

function applyLineHeight(lh) {
  state.lineHeight = lh;
  document.documentElement.style.setProperty('--line-height-reader', lh);
  if (elements.lineHeightVal) elements.lineHeightVal.textContent = `${lh}x`;
  localStorage.setItem('e4t_line_height', lh);
}

function loadSavedPreferences() {
  const savedTheme = localStorage.getItem('e4t_theme') || 'dark';
  applyTheme(savedTheme);

  const savedSize = parseInt(localStorage.getItem('e4t_font_size') || '18', 10);
  applyFontSize(savedSize);
  if (elements.fontSizeSlider) elements.fontSizeSlider.value = savedSize;

  const savedLh = parseFloat(localStorage.getItem('e4t_line_height') || '1.8');
  applyLineHeight(savedLh);
  if (elements.lineHeightSlider) elements.lineHeightSlider.value = savedLh;

  const savedSound = localStorage.getItem('e4t_sound_effects');
  if (savedSound !== null) {
    state.soundEnabled = savedSound === 'true';
    if (elements.soundEffectsToggle) elements.soundEffectsToggle.checked = state.soundEnabled;
  }
}

function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `app-toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info')}"></i> <span>${msg}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('visible'), 20);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// 14. EVENT LISTENERS SETUP
function setupEventListeners() {
  // Page Navigation
  if (elements.prevBtn) elements.prevBtn.onclick = () => goToPage(state.currentPage - 1);
  if (elements.nextBtn) elements.nextBtn.onclick = () => goToPage(state.currentPage + 1);

  if (elements.pageSlider) {
    elements.pageSlider.oninput = (e) => {
      goToPage(parseInt(e.target.value, 10), false);
    };
  }

  if (elements.pageJumpBtn && elements.pageJumpInput) {
    elements.pageJumpBtn.onclick = () => {
      const pageVal = parseInt(elements.pageJumpInput.value, 10);
      if (!isNaN(pageVal)) goToPage(pageVal);
    };
    elements.pageJumpInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        const pageVal = parseInt(elements.pageJumpInput.value, 10);
        if (!isNaN(pageVal)) goToPage(pageVal);
      }
    };
  }

  // View Mode
  if (elements.btnModeText) elements.btnModeText.onclick = () => setViewMode('text');
  if (elements.btnModeSplit) elements.btnModeSplit.onclick = () => setViewMode('split');
  if (elements.btnModeImage) elements.btnModeImage.onclick = () => setViewMode('image');

  // Audio Playback
  if (elements.audioPlayBtn) elements.audioPlayBtn.onclick = togglePlayAudio;
  if (elements.audioStopBtn) elements.audioStopBtn.onclick = stopAudio;

  // Sidebar Toggles & Tabs
  if (elements.sidebarToggleBtn) {
    elements.sidebarToggleBtn.onclick = () => {
      if (elements.sidebar) elements.sidebar.classList.toggle('collapsed');
    };
  }

  const switchSidebarTab = (btn, paneId) => {
    [elements.tabUnitsBtn, elements.tabBookmarksBtn, elements.tabNotesBtn, elements.tabVocabBtn].forEach(b => {
      if (b) b.classList.remove('active');
    });
    [elements.paneUnits, elements.paneBookmarks, elements.paneNotes, elements.paneVocab].forEach(p => {
      if (p) p.classList.remove('active');
    });

    if (btn) btn.classList.add('active');
    const targetPane = document.getElementById(paneId);
    if (targetPane) targetPane.classList.add('active');
  };

  if (elements.tabUnitsBtn) elements.tabUnitsBtn.onclick = () => switchSidebarTab(elements.tabUnitsBtn, 'paneUnits');
  if (elements.tabBookmarksBtn) elements.tabBookmarksBtn.onclick = () => switchSidebarTab(elements.tabBookmarksBtn, 'paneBookmarks');
  if (elements.tabNotesBtn) elements.tabNotesBtn.onclick = () => switchSidebarTab(elements.tabNotesBtn, 'paneNotes');
  if (elements.tabVocabBtn) elements.tabVocabBtn.onclick = () => switchSidebarTab(elements.tabVocabBtn, 'paneVocab');

  // Bookmark Trigger
  if (elements.bookmarkTriggerBtn) elements.bookmarkTriggerBtn.onclick = toggleBookmark;

  // Search Modal Triggers
  if (elements.searchTriggerBtn) elements.searchTriggerBtn.onclick = openSearchModal;
  if (elements.searchModalClose) elements.searchModalClose.onclick = closeSearchModal;
  if (elements.searchModalBackdrop) elements.searchModalBackdrop.onclick = closeSearchModal;

  if (elements.globalSearchInput) {
    elements.globalSearchInput.oninput = (e) => performGlobalSearch(e.target.value.trim());
  }
  if (elements.searchClearBtn) {
    elements.searchClearBtn.onclick = () => {
      if (elements.globalSearchInput) {
        elements.globalSearchInput.value = '';
        elements.globalSearchInput.focus();
        performGlobalSearch('');
      }
    };
  }

  // Settings Modal Triggers
  if (elements.settingsTriggerBtn) {
    elements.settingsTriggerBtn.onclick = () => {
      if (elements.settingsModal) elements.settingsModal.classList.add('open');
    };
  }
  if (elements.settingsModalClose) {
    elements.settingsModalClose.onclick = () => {
      if (elements.settingsModal) elements.settingsModal.classList.remove('open');
    };
  }
  if (elements.settingsModalBackdrop) {
    elements.settingsModalBackdrop.onclick = () => {
      if (elements.settingsModal) elements.settingsModal.classList.remove('open');
    };
  }

  // Theme Selectors
  document.querySelectorAll('.theme-opt-btn').forEach(btn => {
    btn.onclick = () => applyTheme(btn.dataset.theme);
  });

  // Font & Line Height
  if (elements.fontSizeSlider) {
    elements.fontSizeSlider.oninput = (e) => applyFontSize(parseInt(e.target.value, 10));
  }
  if (elements.lineHeightSlider) {
    elements.lineHeightSlider.oninput = (e) => applyLineHeight(parseFloat(e.target.value));
  }
  if (elements.soundEffectsToggle) {
    elements.soundEffectsToggle.onchange = (e) => {
      state.soundEnabled = e.target.checked;
      localStorage.setItem('e4t_sound_effects', state.soundEnabled);
    };
  }

  // Notes Modal
  if (elements.saveNoteBtn) elements.saveNoteBtn.onclick = savePersonalNote;
  if (elements.noteModalClose) {
    elements.noteModalClose.onclick = () => {
      if (elements.noteModal) elements.noteModal.classList.remove('open');
    };
  }
  if (elements.noteModalBackdrop) {
    elements.noteModalBackdrop.onclick = () => {
      if (elements.noteModal) elements.noteModal.classList.remove('open');
    };
  }
  if (elements.clearAllNotesBtn) {
    elements.clearAllNotesBtn.onclick = () => {
      if (confirm('Clear all saved notes and highlights?')) {
        state.notes = [];
        state.highlights = [];
        localStorage.removeItem('e4t_notes');
        localStorage.removeItem('e4t_highlights');
        renderNotes();
        applyUserHighlights(state.currentPage);
        showToast('All notes and highlights cleared', 'info');
      }
    };
  }

  // Dictionary Modal
  if (elements.dictionaryModalClose) {
    elements.dictionaryModalClose.onclick = () => {
      if (elements.dictionaryModal) elements.dictionaryModal.classList.remove('open');
    };
  }
  if (elements.dictionaryModalBackdrop) {
    elements.dictionaryModalBackdrop.onclick = () => {
      if (elements.dictionaryModal) elements.dictionaryModal.classList.remove('open');
    };
  }
  if (elements.quickDefineHintBtn) {
    elements.quickDefineHintBtn.onclick = () => {
      lookupDictionary('unlettered');
    };
  }

  // Shortcuts Modal
  if (elements.shortcutsTriggerBtn) {
    elements.shortcutsTriggerBtn.onclick = () => {
      if (elements.shortcutsModal) elements.shortcutsModal.classList.add('open');
    };
  }
  if (elements.shortcutsModalClose) {
    elements.shortcutsModalClose.onclick = () => {
      if (elements.shortcutsModal) elements.shortcutsModal.classList.remove('open');
    };
  }
  if (elements.shortcutsModalBackdrop) {
    elements.shortcutsModalBackdrop.onclick = () => {
      if (elements.shortcutsModal) elements.shortcutsModal.classList.remove('open');
    };
  }

  // Vocab Quiz Studio Modal
  if (elements.vocabQuizTriggerBtn) elements.vocabQuizTriggerBtn.onclick = openVocabQuizModal;
  if (elements.launchVocabStudioBtn) elements.launchVocabStudioBtn.onclick = openVocabQuizModal;
  if (elements.vocabStudioClose) {
    elements.vocabStudioClose.onclick = () => {
      if (elements.vocabStudioModal) elements.vocabStudioModal.classList.remove('open');
    };
  }
  if (elements.vocabStudioBackdrop) {
    elements.vocabStudioBackdrop.onclick = () => {
      if (elements.vocabStudioModal) elements.vocabStudioModal.classList.remove('open');
    };
  }

  if (elements.vUnitSelect) {
    elements.vUnitSelect.onchange = () => {
      updateLessonDropdown();
      filterVocabQuestions();
    };
  }
  if (elements.vLessonSelect) {
    elements.vLessonSelect.onchange = filterVocabQuestions;
  }

  document.querySelectorAll('.quiz-filter-pill').forEach(pill => {
    pill.onclick = () => {
      document.querySelectorAll('.quiz-filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.quizLevel = pill.dataset.level || 'all';
      filterVocabQuestions();
    };
  });

  if (elements.vNextWordBtn) {
    elements.vNextWordBtn.onclick = () => {
      state.quizIndex++;
      renderVocabQuestion();
    };
  }

  if (elements.vRestartQuizBtn) {
    elements.vRestartQuizBtn.onclick = () => {
      state.quizIndex = 0;
      state.quizScore = 0;
      filterVocabQuestions();
    };
  }

  // TOC Filter Input
  if (elements.tocSearchInput) {
    elements.tocSearchInput.oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      const unitItems = elements.tocTree.querySelectorAll('.toc-unit-item');
      unitItems.forEach(u => {
        const title = u.textContent.toLowerCase();
        if (!q || title.includes(q)) {
          u.style.display = 'block';
          if (q) u.classList.add('expanded');
        } else {
          u.style.display = 'none';
        }
      });
    };
  }
}

// 15. KEYBOARD SHORTCUTS ENGINE
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore when typing inside input / textarea
    if (['input', 'textarea', 'select'].includes(document.activeElement.tagName.toLowerCase())) {
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'k') {
      goToPage(state.currentPage - 1);
    } else if (e.key === 'ArrowRight' || e.key === 'j') {
      goToPage(state.currentPage + 1);
    } else if (e.key === 'b') {
      toggleBookmark();
    } else if (e.key === 'd' || (e.ctrlKey && e.key === 'k')) {
      e.preventDefault();
      openSearchModal();
    } else if (e.key === 'q') {
      openVocabQuizModal();
    } else if (e.key === 'Escape') {
      [elements.searchModal, elements.settingsModal, elements.noteModal, elements.dictionaryModal, elements.shortcutsModal, elements.vocabStudioModal].forEach(m => {
        if (m) m.classList.remove('open');
      });
    }
  });
}
