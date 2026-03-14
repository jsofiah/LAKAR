function getParam(key) {
    return new URLSearchParams(window.location.search).get(key);
}

    const CAT_CONFIG = {
    tips_karier:        { label: 'Tips Karier',        cls: 'cat-tips_karier' },
    motivasi:           { label: 'Motivasi',           cls: 'cat-motivasi' },
    pengembangan_diri:  { label: 'Pengembangan Diri',  cls: 'cat-pengembangan_diri' },
};

async function init() {
    const id = getParam('id');

    if (!id) {
        showError('ID artikel tidak ditemukan.', 'Coba buka dari halaman Sekilas Info.');
        return;
    }

    let data;
    try {
        const res = await fetch('data/sekilasinfo.json');
        if (!res.ok) throw new Error('Fetch failed');
        data = await res.json();
    } catch (e) {
        showError('Gagal memuat artikel.', 'Pastikan kamu membuka halaman ini lewat Live Server, bukan file://');
        return;
    }

    const article = data.articles.find(a => a.id === id);
    if (!article) {
        showError('Artikel tidak ditemukan.', `Tidak ada artikel dengan ID "${id}".`);
        return;
    }

    renderArticle(article, data);
    initScrollProgress();
    initIntersectionObserver();
}

function renderArticle(article, data) {
    const cat     = CAT_CONFIG[article.category] || { label: article.category, icon: '📄', cls: '' };
    const content = article.content;

    document.title = `${article.title} — Lakar`;

    const sectionsHTML = (content.sections || []).map((sec, i) => `
        <div class="article-section">
        <div class="section-heading">
            <span class="section-num bi-star-fill"></span>
            <span>${sec.heading}</span>
        </div>
        <p class="section-body">${formatBody(sec.body)}</p>
        ${i < content.sections.length - 1 ? '<div class="section-divider"></div>' : ''}
        </div>
    `).join('');

    const related = data.articles
        .filter(a => a.id !== article.id && a.category === article.category)
        .slice(0, 3);

    const relatedHTML = related.length > 0 ? `
        <div class="related-wrap">
        <div class="related-label">Artikel Terkait</div>
        <div class="related-grid">
            ${related.map(r => {
            const rc = CAT_CONFIG[r.category] || { label: r.category, icon: '📄', cls: '' };
            return `
                <a href="detail-info.html?id=${r.id}" class="related-card">
                <div class="related-card-cat ${rc.cls}">${rc.label}</div>
                <div class="related-card-title">${r.title}</div>
                <div class="related-card-meta">
                    <i class="bi bi-clock"></i>
                    ${r.read_time}
                </div>
                </a>`;
            }).join('')}
        </div>
        </div>
    ` : '';

    document.getElementById('articleContent').innerHTML = `
        <div class="row g-5">

        <div class="col-lg-8">
            <div class="article-main">

                <div class="article-category ${cat.cls}">${cat.label}</div>

                <h1 class="article-title">${article.title}</h1>
                
                <div class="article-image-wrap">
                    <img src="${article.image}" alt="${article.image_alt || article.title}" class="article-image">
                </div>

                <div class="article-meta">
                    <div class="meta-item">
                        <i class="bi bi-clock"></i>
                        ${article.read_time} baca
                    </div>
                    <div class="meta-item">
                        <i class="bi bi-layout-text-sidebar"></i>
                        ${content.sections?.length || 0} bagian
                    </div>
                    <div class="tag-list">
                        ${(article.tags || []).map(t => `<span class="tag-chip">${t}</span>`).join('')}
                    </div>
                </div>

                <p class="article-intro">${content.intro}</p>

                <div class="article-sections">
                    ${sectionsHTML}
                </div>

                ${content.closing ? `
                <div class="article-closing article-section">
                    <div class="closing-label">Penutup</div>
                    <p class="closing-text">${content.closing}</p>
                </div>` : ''}

            </div>
        </div>

        <div class="col-lg-4">
            ${relatedHTML}
        </div>

        </div>
        `;

    document.getElementById('skeleton').style.display = 'none';
    document.getElementById('articleContent').style.display = 'block';
}

function formatBody(text) {
    return text
        .replace(/'([^']+)'/g, '<strong>$1</strong>')
        .replace(/(\d+%|\d+\+|\d+–\d+|\bRp[\s\d.,]+[jt rb]+)/g, '<strong>$1</strong>');
}

function truncate(str, n) {
    return str.length > n ? str.slice(0, n) + '…' : str;
}

function initScrollProgress() {
    const bar = document.getElementById('progressBar');
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
    }, { passive: true });
}

function initIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
        });
    }, { threshold: 0.1 });

    setTimeout(() => {
        document.querySelectorAll('.article-section').forEach(el => observer.observe(el));
    }, 100);
}

init();