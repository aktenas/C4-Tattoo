$(document).ready(function () {
    loadNavbar();
    loadFooter();
    setThemeFromStorage();
    setupThemeButton();
    setupNewsSection();
    setupBookingPage();
});

function loadNavbar() {
    // loads navbar and sets the theme
    $('#global-header').load('components/navbar.html', function () {
        setThemeFromStorage();
    });
}

function loadFooter() {
    // loads footer
    $('#global-footer').load('components/footer.html');
}

function setThemeFromStorage() {
    // stores the theme selected by the user
    const savedTheme = localStorage.getItem('c4-theme');

    if (savedTheme === 'light') {
        $('body').addClass('light-mode'); //adds css class light mode to html body element
        $('#theme-toggle-icon').removeClass('fa-sun').addClass('fa-moon');
    } else {
        $('body').removeClass('light-mode');
        $('#theme-toggle-icon').removeClass('fa-moon').addClass('fa-sun');
    }
}
// event listener for theme toggle button
function setupThemeButton() {
    // the button that changes the theme
    $(document).on('click', '#theme-toggle', function () {
        if ($('body').hasClass('light-mode')) {
            localStorage.setItem('c4-theme', 'dark');
        } else {
            localStorage.setItem('c4-theme', 'light');
        }

        setThemeFromStorage();
    });
}

// sets up placeholder for API news
function setupNewsSection() {
    // with the $ it crashed
    const newsBox = document.querySelector('.api-news-container');

    // As the code is executed in all pages, only the index.html that contains the api news container will run this function
    if (!newsBox) {
        return;
    }

    // Show the loading screen until the news fetch
    showDefaultNews(newsBox);
    getConventionNews(newsBox);
}

// Placeholder until the news load
function showDefaultNews(newsBox) {
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

// fetch the news
function getConventionNews(newsBox) {
    const websiteUrl = 'https://athenstattooconvention.gr/';
    // construct api url
    const apiUrl = 'https://r.jina.ai/' + websiteUrl;
    
    fetch(apiUrl)
        // saves the raw markdown string text content
        .then(function (response) {
            return response.text();
        })
        // processes the markdown string directly
        .then(function (markdownText) {
            showWebsiteNews(newsBox, markdownText);
            console.log(markdownText)
        })
        .catch(function () {
            // If the API fails the loading cards stay visible instead of fake news
            console.log('News API is not available right now.');
        });
}

// keeps only 2 cards to show
function showWebsiteNews(newsBox, markdownText) {
    const newsItems = findNewsItemsFromText(markdownText);

    if (newsItems.length === 2) {
        showNewsCards(newsBox, newsItems);
    }
}

// Parses raw markdown files line by line
function findNewsItemsFromText(websiteText) {
    // separates the markdown file into lines
    const lines = websiteText.split('\n');

    const newsItems = [];

    lines.forEach(function (line, row) {
        //  removes markdown symbols from the title
        const title = cleanMarkdownText(line);

        // a heading has to start with # in markdown
        if (line.trim().startsWith('#') && isGoodTitle(title) && newsItems.length < 2) {
            // after the title, the next lines are defined as the excerpt of the announcement
            const excerpt = findTextAfterLine(lines, row);
            
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
// Cleans text lines from markdown symbols
function cleanMarkdownText(text) {
    // replace part: scan the entire line (g) and replace the symbols in the brakets with an aempty space ' '
    //trim: removes the spaces at the start and end of line
    //replace: shrinks multiple space characters to one 
    return text.replace(/[#*_`[\]()]/g, '').trim().replace(/\s+/g, ' ');
}


// Looks down the line array to grab the next available body text section block
function findTextAfterLine(lines, startIndex) {
    for (let i = startIndex + 1; i < lines.length; i++) {
        const text = cleanMarkdownText(lines[i]);

        if (isGoodExcerpt(text)) {
            return text;
        }
    }
    return '';
}

function isGoodTitle(text) {
    // Skip repeated logo/menu text and use only useful content headings.
    if (text.length < 6) {
        return false;
    }

    if (text === 'Athens Tattoo Convention' || text === 'Athens Tattoo Convention – Athens Tattoo Convention') {
        return false;
    }

    if (text.toLowerCase().includes('presales')) {
        return false;
    }

    return true;
}

function isGoodExcerpt(text) {
    // avoids short menu labels and buttons
    if (text.length < 20) {
        return false;
    }

    if (text.toLowerCase() === 'book now' || text.toLowerCase().includes('skip to content')) {
        return false;
    }

    if (text.includes('https://')) {
        return false;
    }

    return true;
}

function showNewsCards(newsBox, newsItems) {
    // clear the loading message before adding the news cards.
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

// --- BOOKING SYSTEM ---

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

    // Step 4 
    $(document).on('click', '#final-confirm-btn', function() {
        alert(`BOOKING SUCCESSFUL!\nYour appointment for a ${state.service} with ${state.artist} on ${state.time} is saved.`);
        window.location.href = 'index.html';
    });

    // pressing back gets the user a step back
    $(document).on('click', '#booking-back-btn', function(e) {
        if (state.currentStep > 0) {
            e.preventDefault();
            renderStep(state.currentStep - 1);
        }
    });

    // renders each step state 
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

// --- REVIEW SYSTEM ---

$(document).ready(function() {
    if ($('#client-review-form').length === 0) return;

    // pops up the review panel
    $(document).on('click', '#toggle-review-form-btn', function() {
        const formPanel = $('#review-form-panel');
        formPanel.toggleClass('d-none');
        
        if (formPanel.hasClass('d-none')) {
            $(this).text('Write A Review');
        } else {
            $(this).text('Close Form Panel');
        }
    });

    // before submission the data is collected
    $('#client-review-form').on('submit', function(e) {
        e.preventDefault();

        // collect raw string form input 
        const author = $('#review-author').val().trim();
        const tag = $('#review-tag').val().trim();
        const score = parseInt($('#review-rating').val());
        const content = $('#review-text').val().trim();

        // star element layout arrays
        let starsHTML = '';
        for (let i = 0; i < 5; i++) {
            if (i < score) {
                starsHTML += '<i class="fa-solid fa-star"></i> ';
            } else {
                starsHTML += '<i class="fa-regular fa-star"></i> ';
            }
        }
        // targets the review card template
        const templateNode = document.querySelector('#review-card-template');
        
        // clones the template so its not edited directly
        const cardClone = templateNode.content.cloneNode(true);

        // adds the collected review data to the card
        $(cardClone).find('.review-stars').html(starsHTML);
        $(cardClone).find('.review-author').text(author);
        $(cardClone).find('.review-tag').text(`// ${tag}`);
        $(cardClone).find('.review-body').text(`"${content}"`);

        // injects the card into the review grid, prepend puts it first
        $('#reviews-feed-grid').prepend(cardClone);

        // closes window
        $('#client-review-form')[0].reset();
        $('#review-form-panel').addClass('d-none');
        $('#toggle-review-form-btn').text('Write A Review');

        alert('Your review has been posted.');
    });
});