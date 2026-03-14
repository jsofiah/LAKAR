const CAT_LABEL = {
    tips_karier:       'Tips Karier',
    motivasi:          'Motivasi',
    pengembangan_diri: 'Pengembangan Diri'
};

const CAT_CLS = {
    tips_karier:       'cat-tips',
    motivasi:          'cat-motivasi',
    pengembangan_diri: 'cat-pengembangan'
};

let allArticles  = [];
let activeFilter = 'all';
let searchQuery  = '';

async function loadData() {
    const res  = await fetch('data/sekilasinfo.json');
    const data = await res.json();
    allArticles = data.articles;
    updateCounts();
    updateStats();
    renderGrid();
}

function updateCounts() {
    const counts = { all: allArticles.length };
    allArticles.forEach(a => {
        counts[a.category] = (counts[a.category] || 0) + 1;
    });
    Object.entries(counts).forEach(([key, val]) => {
        const el = document.getElementById('count-' + key);
        if (el) el.textContent = val;
    });
}

function updateStats() {
    document.getElementById('statTotal').textContent = allArticles.length;
    const totalMenit = allArticles.reduce((sum, a) => {
        return sum + parseInt(a.read_time);
    }, 0);
    document.getElementById('statReadtime').textContent = totalMenit;
}

function filterBy(cat) {
    activeFilter = cat;
    document.querySelectorAll('.filter-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === cat);
    });
    renderGrid();
}

function handleSearch() {
    searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    renderGrid();
}

function getFiltered() {
    return allArticles.filter(a => {
        const matchCat    = activeFilter === 'all' || a.category === activeFilter;
        const matchSearch = !searchQuery ||
            a.title.toLowerCase().includes(searchQuery) ||
            a.summary.toLowerCase().includes(searchQuery) ||
            a.tags.some(t => t.toLowerCase().includes(searchQuery));
        return matchCat && matchSearch;
    });
}

function renderGrid() {
    const grid     = document.getElementById('articlesGrid');
    const empty    = document.getElementById('emptyState');
    const filtered = getFiltered();

    if (filtered.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('d-none');
        return;
    }

    empty.classList.add('d-none');
    grid.innerHTML = filtered.map((a, i) => `
        <a class="article-card" href="detail-info.html?id=${a.id}" style="animation-delay:${i * 0.05}s">
            <div class="article-card-img">
                <img src="${a.image}" alt="${a.image_alt}" loading="lazy"
                    onerror="this.parentElement.innerHTML='<div class=\'img-fallback\'><i class=\'bi bi-image\'></i></div>'">
            </div>
            <div class="article-card-body">
                <span class="article-cat-badge ${CAT_CLS[a.category]}">${CAT_LABEL[a.category]}</span>
                <h2 class="article-card-title">${a.title}</h2>
                <p class="article-card-summary">${a.summary}</p>
                <div class="article-card-footer">
                    <span class="article-readtime">
                        <i class="bi bi-clock"></i> ${a.read_time}
                    </span>
                    <div class="article-tags">
                        ${a.tags.slice(0, 2).map(t => `<span class="article-tag">${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        </a>
    `).join('');
}

loadData();