// Loyihaning asosiy klassi
class LanguageLearning {
    constructor() {
        // Ma'lumotlarni localStorage'dan olish yoki bo'sh obyektlar yaratish
        this.vocabulary = JSON.parse(localStorage.getItem('vocabulary')) || {};
        this.userProgress = JSON.parse(localStorage.getItem('progress')) || {
            quizzesTaken: 0,
            correctAnswers: 0
        };
        this.quizWords = [];
        this.correctOption = '';

        // Til tanlash elementlari
        this.sourceLangSelect = $('#sourceLangSelect');
        this.targetLangSelect = $('#targetLangSelect');

        this.initEventListeners();
        this.loadState();
    }

    // Barcha event listenerlarni o'rnatish
    initEventListeners() {
        $('#translateBtn').on('click', () => this.translateText($('#sourceText').val()));
        $('#startQuizBtn').on('click', () => this.generateQuiz());
        $('#pronounceBtn').on('click', () => this.pronounceText($('#translatedText').text()));
        
        // Tab tugmalari
        $('.tab-button').on('click', (e) => this.switchTab($(e.currentTarget).data('tab')));

        // Tun/Kun rejimini almashtirish
        $('#themeToggleBtn').on('click', () => this.toggleTheme());

        // Tillarni almashtirish tugmasi
        $('#switchBtn').on('click', () => this.switchLanguages());

        // Til tanlash selectlari o'zgarganda
        this.targetLangSelect.on('change', () => this.updateUI());
    }

    // Sahifa yuklanganda holatni tiklash
    loadState() {
        // Avval saqlangan mavzuni tekshirish
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            $('body').addClass('dark-mode');
            $('#themeToggleBtn i').removeClass('fa-moon').addClass('fa-sun');
        } else if (savedTheme === 'light') {
            $('body').removeClass('dark-mode');
            $('#themeToggleBtn i').removeClass('fa-sun').addClass('fa-moon');
        } else {
            // Agar saqlanmagan bo'lsa, brauzerning tizim mavzusini tekshirish
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                $('body').addClass('dark-mode');
                $('#themeToggleBtn i').removeClass('fa-moon').addClass('fa-sun');
                localStorage.setItem('theme', 'dark');
            }
        }
        this.updateUI();
    }

    // Tun/Kun rejimini almashtirish funksiyasi
    toggleTheme() {
        $('body').toggleClass('dark-mode');
        const icon = $('#themeToggleBtn i');
        if ($('body').hasClass('dark-mode')) {
            icon.removeClass('fa-moon').addClass('fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.removeClass('fa-sun').addClass('fa-moon');
            localStorage.setItem('theme', 'light');
        }
    }

    // Tablar o'rtasida o'tish funksiyasi
    switchTab(tabId) {
        $('.tab-content').removeClass('active').hide();
        $(`#${tabId}`).addClass('active').show();

        $('.tab-button').removeClass('active');
        $(`[data-tab="${tabId}"]`).addClass('active');
    }

    // Tillarni almashtirish funksiyasi
    switchLanguages() {
        const sourceLang = this.sourceLangSelect.val();
        const targetLang = this.targetLangSelect.val();

        this.sourceLangSelect.val(targetLang);
        this.targetLangSelect.val(sourceLang);
        
        this.updateUI();
    }

    // Matnni tarjima qilish funksiyasi
    async translateText(text) {
        if (!text) {
            alert("Iltimos, tarjima qilish uchun matn kiriting.");
            return;
        }
        
        const sourceLang = this.sourceLangSelect.val();
        const targetLang = this.targetLangSelect.val();
        
        try {
            const response = await $.post('https://libretranslate.de/translate', {
                q: text,
                source: sourceLang,
                target: targetLang,
                api_key: '' // Agar API kaliti talab qilinsa, shu yerga qo'shing
            });

            this.displayTranslation(response.translatedText);
            this.addToVocabulary(text, response.translatedText, targetLang);
            this.updateProgress();
        } catch (error) {
            console.error("Tarjima xizmati bilan bog'lanishda xato:", error);
            this.showDemoTranslation(text, targetLang);
            this.updateProgress();
        }
    }

    // Tarjimani sahifada ko'rsatish
    displayTranslation(translatedText) {
        $('#translatedText').text(translatedText);
    }

    // API ishlamasa, demo tarjimani ko'rsatish
    showDemoTranslation(text, targetLang) {
        let demoTranslation = `[${targetLang.toUpperCase()} tilidagi tarjimasi] ${text}`;
        $('#translatedText').text(demoTranslation);
        this.addToVocabulary(text, demoTranslation, targetLang);
    }

    // Tarjima qilingan so'zni lug'atga qo'shish va localStorage'ga saqlash
    addToVocabulary(original, translation, language) {
        if (!this.vocabulary[language]) {
            this.vocabulary[language] = [];
        }

        const isExist = this.vocabulary[language].some(word => word.original === original);
        if (!isExist) {
            this.vocabulary[language].push({
                original: original,
                translation: translation,
                dateAdded: new Date().toISOString(),
                practiced: 0
            });
            localStorage.setItem('vocabulary', JSON.stringify(this.vocabulary));
            this.displayVocabulary();
        }
    }

    // Lug'atdagi so'zlarni sahifada ko'rsatish
    displayVocabulary() {
        const vocabList = $('#vocabularyList');
        vocabList.empty();
        const currentLang = this.targetLangSelect.val();
        const words = this.vocabulary[currentLang] || [];

        if (words.length === 0) {
            vocabList.html('<p>Lug\'atingiz bo\'sh. Tarjima qilib, so\'z qo\'shing.</p>');
            return;
        }

        words.forEach(word => {
            const card = `<div class="vocabulary-card">
                <p class="original-word">${word.original}</p>
                <p class="translation-word">${word.translation}</p>
            </div>`;
            vocabList.append(card);
        });
    }

    // Quiz yaratish funksiyasi
    generateQuiz() {
        const words = this.vocabulary[this.targetLangSelect.val()] || [];
        if (words.length < 4) {
            $('#quizContainer').hide();
            alert("Quiz boshlash uchun kamida 4 ta so'z bo'lishi kerak.");
            return;
        }

        this.userProgress.quizzesTaken++;
        this.updateProgress();

        this.quizWords = words.sort(() => 0.5 - Math.random()).slice(0, 4);
        const randomWord = this.quizWords[Math.floor(Math.random() * this.quizWords.length)];
        this.correctOption = randomWord.translation;

        $('#quizQuestion').text(`${randomWord.original} so'zining tarjimasini toping:`);
        $('#quizResult').text('');
        $('#quizContainer').show();

        const optionsHtml = this.quizWords.map(word =>
            `<button class="quiz-option-btn" data-translation="${word.translation}">${word.translation}</button>`
        ).join('');

        $('#quizOptions').html(optionsHtml);
        $('.quiz-option-btn').on('click', (e) => this.checkAnswer($(e.currentTarget)));
    }

    // Javobni tekshirish funksiyasi
    checkAnswer(selectedOption) {
        const selectedTranslation = selectedOption.data('translation');
        $('.quiz-option-btn').removeClass('correct-answer wrong-answer');

        if (selectedTranslation === this.correctOption) {
            selectedOption.addClass('correct-answer');
            $('#quizResult').text("To'g'ri javob!");
            this.userProgress.correctAnswers++;
        } else {
            selectedOption.addClass('wrong-answer');
            $('#quizResult').text("Noto'g'ri javob. To'g'ri javob: " + this.correctOption);
        }

        this.updateProgress();
        $('.quiz-option-btn').off('click');
    }

    // Taraqqiyotni yangilash funksiyasi
    updateProgress() {
        const words = this.vocabulary[this.targetLangSelect.val()] || [];
        const totalWords = words.length;
        const quizzesTaken = this.userProgress.quizzesTaken;
        
        $('#totalWords').text(totalWords);
        $('#quizzesTaken').text(quizzesTaken);

        if (totalWords > 0) {
            const progressPercentage = (quizzesTaken / totalWords) * 100;
            $('#progressBar').css('width', `${Math.min(progressPercentage, 100)}%`);
        } else {
            $('#progressBar').css('width', '0%');
        }

        localStorage.setItem('progress', JSON.stringify(this.userProgress));
    }

    // Matnni ovozli talaffuz qilish funksiyasi
    pronounceText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = this.targetLangSelect.val();
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Bu brauzerda ovozli talaffuz qo'llab-quvvatlanmaydi.");
        }
    }

    // Sahifani yuklaganda barcha elementlarni yangilash
    updateUI() {
        this.displayVocabulary();
        this.updateProgress();
    }
}

$(document).ready(() => {
    new LanguageLearning();
});