// Main JavaScript file for the C4 Tattoo website.
// This file loads the shared navbar, controls dark mode, and shows API news.

$(document).ready(function () {
    loadNavbar();
    loadFooter();
    setThemeFromStorage();
    setupThemeButton();
    setupNewsSection();
    setupBookingPage();
});

function loadNavbar() {
    // The navbar is stored in one file so every page uses the same menu.
    $('#global-header').load('components/navbar.html', function () {
        // Run this again after the navbar loads because the icon is inside navbar.html.
        setThemeFromStorage();
    });
}
function loadFooter() {
    // Pure, simple file loader with zero text strings inside
    const footerNode = $('#global-footer');
    if (footerNode.length) {
        footerNode.load('components/footer.html');
    }
}
function setThemeFromStorage() {
    // localStorage remembers the theme even after the page is refreshed.
    const savedTheme = localStorage.getItem('c4-theme');

    if (savedTheme === 'light') {
        $('body').addClass('light-mode');
        $('#theme-toggle-icon').removeClass('fa-sun').addClass('fa-moon');
    } else {
        $('body').removeClass('light-mode');
        $('#theme-toggle-icon').removeClass('fa-moon').addClass('fa-sun');
    }
}

function setupThemeButton() {
    // Event delegation is used because the button is loaded from navbar.html.
    $(document).on('click', '#theme-toggle', function () {
        if ($('body').hasClass('light-mode')) {
            localStorage.setItem('c4-theme', 'dark');
        } else {
            localStorage.setItem('c4-theme', 'light');
        }

        setThemeFromStorage();
    });
}

function setupNewsSection() {
    const newsBox = document.querySelector('.api-news-container');

    // Only the home page has the API news section.
    if (!newsBox) {
        return;
    }

    // Show two loading cards immediately, then replace them if the API works.
    showDefaultNews(newsBox);
    getConventionNews(newsBox);
}

function showDefaultNews(newsBox) {
    // These two cards keep the section filled while the website content loads.
    const defaultNews = [
        {
            title: 'Loading convention update',
            text: 'Reading the latest information from the official website.'
        },
        {
            title: 'Loading second update',
            text: 'Reading another update from the official website.'
        }
    ];

    showNewsCards(newsBox, defaultNews);
}

function getConventionNews(newsBox) {
    const websiteUrl = 'https://athenstattooconvention.gr/';
    const apiUrl = 'https://r.jina.ai/http://r.jina.ai/http://' + websiteUrl;

    fetch(apiUrl)
        .then(function (response) {
            return response.text();
        })
        .then(function (websiteText) {
            showWebsiteNews(newsBox, websiteText);
        })
        .catch(function () {
            // If the API fails, the loading cards stay visible instead of fake news.
            console.log('News API is not available right now.');
        });
}

function showWebsiteNews(newsBox, htmlText) {
    const newsItems = findNewsItems(htmlText);

    if (newsItems.length === 2) {
        showNewsCards(newsBox, newsItems);
    }
}

function findNewsItems(htmlText) {
    if (htmlText.includes('Markdown Content:')) {
        return findNewsItemsFromText(htmlText);
    }

    const parser = new DOMParser();
    const htmlDocument = parser.parseFromString(htmlText, 'text/html');
    const headings = htmlDocument.querySelectorAll('h1, h2, h3');
    const newsItems = [];

    headings.forEach(function (heading) {
        const title = cleanText(heading.textContent);
        const excerpt = findExcerptAfterHeading(heading);

        if (isGoodTitle(title) && excerpt.length > 5 && newsItems.length < 2) {
            newsItems.push({
                title: title,
                text: excerpt
            });
        }
    });

    return newsItems;
}

function findNewsItemsFromText(websiteText) {
    const lines = websiteText.split('\n');
    const newsItems = [];

    lines.forEach(function (line, index) {
        const title = cleanMarkdownText(line);

        if (line.trim().startsWith('#') && isGoodTitle(title) && newsItems.length < 2) {
            const excerpt = findTextAfterLine(lines, index);

            if (excerpt.length > 5) {
                newsItems.push({
                    title: title,
                    text: excerpt
                });
            }
        }
    });

    return newsItems;
}

function findTextAfterLine(lines, startIndex) {
    // Look below the heading for the next useful line from the website.
    for (let i = startIndex + 1; i < lines.length; i++) {
        const text = cleanMarkdownText(lines[i]);

        if (isGoodExcerpt(text)) {
            return text;
        }
    }

    return '';
}

function cleanMarkdownText(text) {
    // This removes Markdown symbols from the public text version of the website.
    return text.replace(/[#*_`[\]()]/g, '').trim().replace(/\s+/g, ' ');
}

function findExcerptAfterHeading(heading) {
    // Start from the next HTML element and look for real text from the website.
    let nextElement = heading.nextElementSibling;

    while (nextElement) {
        const text = cleanText(nextElement.textContent);

        if (isGoodExcerpt(text)) {
            return text;
        }

        nextElement = nextElement.nextElementSibling;
    }

    return '';
}

function cleanText(text) {
    // This removes extra spaces and line breaks from website text.
    return text.trim().replace(/\s+/g, ' ');
}

function isGoodTitle(text) {
    // Skip repeated logo/menu text and use only useful content headings.
    if (text.length < 6) {
        return false;
    }

    if (text === 'Athens Tattoo Convention') {
        return false;
    }

    if (text === 'Athens Tattoo Convention – Athens Tattoo Convention') {
        return false;
    }

    if (text.toLowerCase().includes('presales')) {
        return false;
    }

    return true;
}

function isGoodExcerpt(text) {
    // This avoids short menu labels and buttons such as "BOOK NOW".
    if (text.length < 20) {
        return false;
    }

    if (text.toLowerCase() === 'book now') {
        return false;
    }

    if (text.toLowerCase().includes('skip to content')) {
        return false;
    }

    if (text.includes('https://')) {
        return false;
    }

    return true;
}

function showNewsCards(newsBox, newsItems) {
    // Clear the loading message before adding the news cards.
    newsBox.innerHTML = '';
    newsBox.classList.add('api-news-container-active');

    newsItems.forEach(function (item) {
        const card = document.createElement('div');
        const title = document.createElement('h5');
        const text = document.createElement('p');

        card.className = 'api-news-card';
        title.textContent = item.title;
        text.textContent = item.text;
        text.className = 'text-muted mb-0';
        text.style.fontSize = '0.85rem';

        card.appendChild(title);
        card.appendChild(text);
        newsBox.appendChild(card);
    });
}
// ==========================================================================
// DYNAMIC WORKFLOW BOOKING ENGINE (PURE CONTROLLER)
// ==========================================================================

$(document).ready(function() {
    if ($('.booking-progress').length === 0) return;

    let state = {
        currentStep: 0,
        category: '',
        service: '',
        artist: '',
        time: ''
    };

    const headings = [
        { title: "Select a Service", sub: "Book a tattoo session, piercing, or checkup appointment." },
        { title: "Select Option", sub: "Choose a specific option for your service." },
        { title: "Select an Artist", sub: "Choose a resident studio artist." },
        { title: "Select Date and Time", sub: "Choose an available date and time slot below." },
        { title: "Verify Booking", sub: "Review your choices before final booking confirmation." }
    ];

    // --- EVENT TRIGGERS ---

    // Step 0 -> Step 1
    $(document).on('click', '.category-select-btn', function() {
        state.category = $(this).data('category');
        
        $('.service-filterable-card').addClass('d-none');
        $(`.service-filterable-card[data-cat="${state.category}"]`).removeClass('d-none');
        
        renderStep(1);
    });

    // Step 1 -> Step 2
    $(document).on('click', '.service-select-btn', function() {
        state.service = $(this).data('srv');
        renderStep(2);
    });

    // Step 2 -> Step 3
    $(document).on('click', '.artist-select-btn', function() {
        state.artist = $(this).data('art');
        renderStep(3);
    });

    // Step 3 -> Step 4
    $(document).on('click', '.time-select-btn', function() {
        state.time = $(this).data('time');
        
        $('#summary-cat-node').text(state.category);
        $('#summary-srv-node').text(state.service);
        $('#summary-art-node').text(state.artist);
        $('#summary-time-node').text(state.time);
        
        renderStep(4);
    });

    // Step 4 -> Complete Submission
    $(document).on('click', '#final-confirm-btn', function() {
        alert(`BOOKING SUCCESSFUL!\nYour appointment for a ${state.service} with ${state.artist} on ${state.time} is locked in.`);
        window.location.href = 'index.html';
    });

    // Back Link Step Regression Handling
    $(document).on('click', '#booking-back-btn', function(e) {
        if (state.currentStep > 0) {
            e.preventDefault();
            renderStep(state.currentStep - 1);
        }
    });

    // --- STATE RENDERING ENGINE ---

    function renderStep(stepNumber) {
        state.currentStep = stepNumber;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        $('.booking-progress-step').removeClass('is-active');
        $('.booking-progress-step').eq(stepNumber).addClass('is-active');

        $('.booking-step-group').addClass('d-none');
        $(`#step-view-${stepNumber}`).removeClass('d-none');

        $('#booking-heading').text(headings[stepNumber].title);
        $('#booking-subtext').text(headings[stepNumber].sub);
    }
});
// ==========================================================================
// DYNAMIC REVIEW SUBMISSION LOGIC LAYER
// ==========================================================================
$(document).ready(function() {
    if ($('#client-review-form').length === 0) return;

    // 1. Toggle review entry form panel visibility
    $(document).on('click', '#toggle-review-form-btn', function() {
        const formPanel = $('#review-form-panel');
        formPanel.toggleClass('d-none');
        
        // Dynamic helper wording update
        if (formPanel.hasClass('d-none')) {
            $(this).text('Write A Review');
        } else {
            $(this).text('Close Form Panel');
        }
    });

    // 2. Intercept submit action to generate dynamic feed item
    $('#client-review-form').on('submit', function(e) {
        e.preventDefault();

        // Collect raw string form input properties
        const author = $('#review-author').val().trim();
        const tag = $('#review-tag').val().trim();
        const score = parseInt($('#review-rating').val());
        const content = $('#review-text').val().trim();

        // Programmatically assemble star element layout arrays
        let starsHTML = '';
        for (let i = 0; i < 5; i++) {
            if (i < score) {
                starsHTML += '<i class="fa-solid fa-star"></i> ';
            } else {
                starsHTML += '<i class="fa-regular fa-star"></i> ';
            }
        }

        // Build structural element matrix explicitly to obey custom framework styles
        const reviewColumn = document.createElement('div');
        reviewColumn.className = 'col-md-4';
        
        reviewColumn.innerHTML = `
            <div class="studio-card">
                <div class="studio-card-media flex-column">
                    <div class="mb-2" style="color: #b30000;">${starsHTML}</div>
                    <span class="fw-bold text-black text-uppercase user-review-author-name" style="font-size: 1.2rem; font-family: 'Impact', sans-serif;">${author}</span>
                </div>
                <div class="studio-card-content">
                    <span class="text-red-accent d-block mb-2 text-uppercase" style="font-size: 0.85rem;">// ${tag}</span>
                    <p style="height: auto; margin-bottom: 0; min-height: 110px;">"${content}"</p>
                </div>
            </div>
        `;

        // Smoothly insert new card at the top of the feed grid list
        $('#reviews-feed-grid').prepend(reviewColumn);

        // Reset inputs and close panel window
        $('#client-review-form')[0].reset();
        $('#review-form-panel').addClass('d-none');
        $('#toggle-review-form-btn').text('Write A Review');

        // Success notification feedback confirmation transmission alert
        alert('REVIEW POSTED LIVE NATIVELY!');
    });
});
function setupThemeButton() {
    // Event delegation is used because the button is loaded from navbar.html.
    $(document).on('click', '#theme-toggle', function () {
        if ($('body').hasClass('light-mode')) {
            localStorage.setItem('c4-theme', 'dark');
        } else {
            localStorage.setItem('c4-theme', 'light');
        }

        setThemeFromStorage();
        syncFooterTheme(); // 
    });
}

// Simple fallback helper function to handle active class rendering
function syncFooterTheme() {
    // CSS classes handle the rest of the styling inversions smoothly
    if ($('body').hasClass('light-mode')) {
        $('.studio-footer').addClass('light-mode-active');
    } else {
        $('.studio-footer').removeClass('light-mode-active');
    }
}