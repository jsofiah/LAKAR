'use strict';

const CIRCUMFERENCE = 2 * Math.PI * 54;

const COMPANY_LABELS = {
    tech_startup:   'Tech Startup',
    big_tech:       'Big Tech',
    corporate:      'Korporat',
    finance:        'Keuangan',
    healthcare:     'Kesehatan',
    retail:         'Retail',
    government:     'Pemerintah',
    ngo:            'NGO',
    consulting:     'Konsultan',
    education_inst: 'Institusi Pendidikan',
    media:          'Media',
    green_corp:     'Perusahaan Hijau',
};

const DEMAND_LABELS = {
    very_high: 'Permintaan Sangat Tinggi',
    high:      'Permintaan Tinggi',
    medium:    'Permintaan Sedang',
    low:       'Permintaan Rendah',
};

const PRIORITY_LABELS = {
    high:   'Prioritas Tinggi',
    medium: 'Prioritas Sedang',
    low:    'Prioritas Rendah',
};

const PENDIDIKAN_LABELS = {
    sd:      'SD',
    smp:     'SMP',
    sma_smk: 'SMA/SMK',
    d3:      'D3/Diploma',
    s1:      'S1/Sarjana',
    s2:      'S2/Magister',
    s3:      'S3/Doktor',
};

const LEVEL_LABELS = { beginner: 'Pemula', intermediate: 'Menengah', advanced: 'Jago' };

document.addEventListener('DOMContentLoaded', () => {
    const raw = sessionStorage.getItem('lakar_result');

    if (!raw) {
        document.getElementById('loadingMsg').innerHTML = `
            <i class="bi bi-exclamation-circle"></i>
            <p>Data hasil kuis tidak ditemukan.<br>
            Silakan <a href="index.html">kembali ke kuis</a> dan selesaikan terlebih dahulu.</p>`;
        return;
    }

    let result;
    try { result = JSON.parse(raw); }
    catch {
        document.getElementById('loadingMsg').innerHTML =
            `<i class="bi bi-x-circle"></i><p>Data rusak. Silakan ulangi kuis.</p>`;
        return;
    }

    renderPage(result);
});

function renderPage(r) {
    const profile    = r.profile    || {};
    const top3       = r.top3       || [];
    const roadmap    = r.roadmap    || [];
    const userSkills = r.userSkills || {};

    document.getElementById('loadingMsg').style.display = 'none';
    document.getElementById('secHero').style.display    = 'block';
    document.getElementById('sec01').style.display      = 'block';
    document.getElementById('sec02').style.display      = 'block';
    document.getElementById('sec03').style.display      = 'block';
    document.getElementById('secCta').style.display     = 'flex';
    document.getElementById('secKeluar').style.display  = 'block';

    document.getElementById('resNama').textContent = profile.nama || 'Pengguna';
    document.getElementById('resPendidikan').textContent =
        PENDIDIKAN_LABELS[profile.pendidikan] || profile.pendidikan || '–';
    document.getElementById('resStatus').textContent     = profile.status || '–';
    document.getElementById('resSkillCount').textContent = Object.keys(userSkills).length;

    if (profile.kota) {
        document.getElementById('resKota').textContent       = profile.kota;
        document.getElementById('resKotaCell').style.display = '';
    }

    renderSkillTags(userSkills, r.skillsData);

    document.getElementById('resJobCount').textContent = top3.length;
    renderJobCards(top3);

    document.getElementById('resTotalWeeks').textContent = calcTotalWeeks(roadmap);
    document.getElementById('resHighCount').textContent  = roadmap.filter(s => s.priority === 'high').length;
    document.getElementById('resMedCount').textContent   = roadmap.filter(s => s.priority === 'medium').length;
    renderRoadmap(roadmap);

    document.getElementById('btnUnduh').addEventListener('click', () => window.print());
    document.getElementById('btnKeluar').addEventListener('click', () => window.location.href = 'index.html');

    requestAnimationFrame(() => {
        animateDonut(r.overallSkillScore || 0);
        animateBars();
    });
}

function renderSkillTags(userSkills, skillsData) {
    const ICONS = { hard: 'bi-braces', soft: 'bi-person-check', both: 'bi-stars' };

    const lookup = {};
    if (skillsData) {
        skillsData.categories.forEach(cat =>
            cat.skills.forEach(sk => { lookup[sk.id] = sk; })
        );
    }

    const container = document.getElementById('skillTags');
    Object.entries(userSkills).forEach(([id, level]) => {
        const sk    = lookup[id];
        const label = sk ? sk.label : id;
        const icon  = ICONS[sk?.type] || 'bi-check-circle';
        const lvl   = LEVEL_LABELS[level] || level;

        const span = document.createElement('span');
        span.className = 'skill-tag';
        span.innerHTML = `<i class="bi ${icon}"></i> ${esc(label)} <span class="skill-tag-level">· ${lvl}</span>`;
        container.appendChild(span);
    });
}

function renderJobCards(top3) {
    const list = document.getElementById('jobList');

    top3.forEach((job, i) => {
        const rank          = i + 1;
        const pct           = job.matchPercent || 0;
        const pctClass      = pct >= 60 ? 'high' : pct >= 40 ? 'mid' : 'low';
        const demand        = job.demandLevel || 'medium';
        const sal           = job.salaryRange;
        const companyLabels = (job.companyTypes || []).map(c => COMPANY_LABELS[c] || c);

        const card = document.createElement('div');
        card.className = 'job-card';
        card.id = `card-${rank}`;

        const header = document.createElement('div');
        header.className = 'job-card-header';
        header.addEventListener('click', () => toggleJobDetail(rank));

        const numEl = document.createElement('div');
        numEl.className = 'job-num';
        numEl.textContent = rank;

        const inner = document.createElement('div');
        inner.className = 'job-inner-head';

        const demandBadge = document.createElement('span');
        demandBadge.className = `demand-badge demand-${demand}`;
        demandBadge.innerHTML = `<i class="bi bi-graph-up-arrow"></i> ${DEMAND_LABELS[demand] || demand}`;

        const category = document.createElement('div');
        category.className = 'job-category';
        category.textContent = job.fieldLabel || '';

        const title = document.createElement('div');
        title.className = 'job-title';
        title.textContent = job.jobTitle;

        const desc = document.createElement('p');
        desc.className = 'job-desc';
        desc.textContent = job.jobDesc || '';

        const tagsWrap   = document.createElement('div');
        tagsWrap.className = 'job-tags';
        const ownedIds   = (job.ownedSkills || []).map(s => s.id);
        const missingIds = job.missingRequired || [];
        [...ownedIds, ...missingIds].slice(0, 6).forEach((id, idx) => {
            const isMissing = idx >= ownedIds.length;
            const tag = document.createElement('span');
            tag.className = isMissing ? 'job-tag missing' : 'job-tag';
            if (isMissing) {
                const ico = document.createElement('i');
                ico.className = 'bi bi-exclamation-circle';
                tag.appendChild(ico);
                tag.append(' ' + id.replace(/_/g, ' '));
            } else {
                tag.textContent = id.replace(/_/g, ' ');
            }
            tagsWrap.appendChild(tag);
        });

        inner.append(demandBadge, category, title, desc, tagsWrap);

        const matchBadge = document.createElement('div');
        matchBadge.className = 'match-badge';

        const matchPct = document.createElement('div');
        matchPct.className = `match-pct ${pctClass}`;
        matchPct.textContent = pct + '%';

        const matchLabel = document.createElement('div');
        matchLabel.className = 'match-label';
        matchLabel.textContent = 'Match';

        const matchBar = document.createElement('div');
        matchBar.className = 'match-bar';
        const matchFill = document.createElement('div');
        matchFill.className = 'match-bar-fill';
        matchFill.dataset.pct = pct;
        matchBar.appendChild(matchFill);

        const toggle = document.createElement('span');
        toggle.className = 'detail-toggle';
        toggle.id = `toggle-${rank}`;
        toggle.innerHTML = 'Detail <i class="bi bi-chevron-down"></i>';

        matchBadge.append(matchPct, matchLabel, matchBar, toggle);
        header.append(numEl, inner, matchBadge);

        const panel = document.createElement('div');
        panel.className = 'job-detail-panel';
        panel.id = `job-detail-${rank}`;

        const panelInner = document.createElement('div');
        panelInner.className = 'job-detail-inner';

        const meta = document.createElement('div');
        meta.className = 'job-meta';

        if (companyLabels.length) {
            const g = mkMetaGroup('Cocok di Perusahaan');
            const tags = document.createElement('div');
            tags.className = 'job-company-tags';
            companyLabels.forEach(c => {
                const t = document.createElement('span');
                t.className = 'company-tag';
                t.textContent = c;
                tags.appendChild(t);
            });
            g.appendChild(tags);
            meta.appendChild(g);
        }

        if (sal) {
            const g = mkMetaGroup('Estimasi Gaji');
            const salEl = document.createElement('div');
            salEl.className = 'job-salary';
            salEl.innerHTML = `Rp ${fmtMil(sal.min)}–${fmtMil(sal.max)} JT <span class="job-salary-sub">/ bulan</span>`;
            g.appendChild(salEl);
            meta.appendChild(g);
        }

        if (job.workTypes?.length) {
            const g = mkMetaGroup('Tipe Kerja');
            const tags = document.createElement('div');
            tags.className = 'job-company-tags';
            job.workTypes.forEach(w => {
                const t = document.createElement('span');
                t.className = 'company-tag';
                t.textContent = w;
                tags.appendChild(t);
            });
            g.appendChild(tags);
            meta.appendChild(g);
        }

        if (job.growthRate) {
            const g = mkMetaGroup('Pertumbuhan Karir');
            const growEl = document.createElement('div');
            growEl.className = 'job-salary';
            growEl.style.color = 'var(--gold)';
            growEl.textContent = '↑ ' + job.growthRate;
            g.appendChild(growEl);
            meta.appendChild(g);
        }

        panelInner.appendChild(meta);
        panel.appendChild(panelInner);
        card.append(header, panel);
        list.appendChild(card);
    });
}

function mkMetaGroup(labelText) {
    const g = document.createElement('div');
    g.className = 'job-meta-group';
    const lbl = document.createElement('div');
    lbl.className = 'job-meta-label';
    lbl.textContent = labelText;
    g.appendChild(lbl);
    return g;
}

function toggleJobDetail(rank) {
    const panel  = document.getElementById(`job-detail-${rank}`);
    const toggle = document.getElementById(`toggle-${rank}`);
    const card   = document.getElementById(`card-${rank}`);
    if (!panel) return;

    const isOpen = panel.classList.contains('open');
    if (isOpen) {
        panel.style.maxHeight = panel.scrollHeight + 'px';
        requestAnimationFrame(() => { panel.style.maxHeight = '0'; });
        panel.classList.remove('open');
        card.classList.remove('expanded');
        if (toggle) toggle.innerHTML = 'Detail <i class="bi bi-chevron-down"></i>';
    } else {
        panel.style.maxHeight = '0';
        panel.classList.add('open');
        card.classList.add('expanded');
        requestAnimationFrame(() => { panel.style.maxHeight = panel.scrollHeight + 'px'; });
        if (toggle) toggle.innerHTML = 'Tutup <i class="bi bi-chevron-up"></i>';
    }
}

function renderRoadmap(roadmap) {
    const list      = document.getElementById('roadmapList');
    const LEVEL_POS = { beginner: 0, intermediate: 50, advanced: 100 };
    const TARGET_IDX = { beginner: 0, intermediate: 1, advanced: 2 };

    roadmap.forEach((item, idx) => {
        const isLast   = idx === roadmap.length - 1;
        const priority = item.priority || 'medium';
        const tools    = item.tools    || [];
        const sources  = item.learnFrom || [];
        const weeks    = parseDurationToWeeks(item.duration);
        const fillPct  = LEVEL_POS[item.targetLevel] ?? 50;
        const targetLvl = LEVEL_LABELS[item.targetLevel] || 'Menengah';

        const row = document.createElement('div');
        row.className = 'road-row';

        const dotCol = document.createElement('div');
        dotCol.className = 'dot-col';
        const dotCircle = document.createElement('div');
        dotCircle.className = 'dot-circle';
        dotCol.appendChild(dotCircle);
        if (!isLast) {
            const line = document.createElement('div');
            line.className = 'dot-line';
            dotCol.appendChild(line);
        }

        const cardWrap = document.createElement('div');
        cardWrap.className = 'road-card-wrap';

        const card = document.createElement('div');
        card.className = 'skill-road-card';

        const badge = document.createElement('span');
        badge.className = `priority-badge priority-${priority}`;
        badge.textContent = PRIORITY_LABELS[priority] || priority;

        const meta = document.createElement('div');
        meta.className = 'skill-road-meta';
        meta.textContent = `Skill · Untuk ${item.forJob || ''}`;

        const head = document.createElement('div');
        head.className = 'skill-road-header';

        const titleEl = document.createElement('div');
        titleEl.className = 'skill-road-title';
        titleEl.textContent = item.skillLabel;

        const timeEl = document.createElement('div');
        timeEl.className = 'skill-road-time';
        timeEl.innerHTML = `<strong>${weeks}</strong> Minggu`;

        head.append(titleEl, timeEl);

        const levelSlider = document.createElement('div');
        levelSlider.className = 'level-slider-wrap';

        const track = document.createElement('div');
        track.className = 'level-track';

        const fill = document.createElement('div');
        fill.className = 'level-fill';
        fill.style.width = fillPct + '%';

        const levelDot = document.createElement('div');
        levelDot.className = 'level-dot';
        levelDot.style.left = fillPct + '%';

        track.append(fill, levelDot);

        const levelLabels = document.createElement('div');
        levelLabels.className = 'level-labels';
        ['Pemula', 'Menengah', 'Jago'].forEach((lbl, i) => {
            const span = document.createElement('span');
            span.textContent = lbl;
            if (TARGET_IDX[item.targetLevel] === i) span.classList.add('active');
            levelLabels.appendChild(span);
        });

        levelSlider.append(track, levelLabels);

        const bottom = document.createElement('div');
        bottom.className = 'skill-road-bottom';

        if (tools.length) {
            const col = document.createElement('div');
            col.className = 'road-col';
            const colLbl = document.createElement('div');
            colLbl.className = 'road-col-label';
            colLbl.textContent = 'Tools';
            const tagWrap = document.createElement('div');
            tagWrap.className = 'road-tool-tags';
            tools.forEach(t => {
                const tag = document.createElement('span');
                tag.className = 'road-tool-tag';
                tag.textContent = t;
                tagWrap.appendChild(tag);
            });
            col.append(colLbl, tagWrap);
            bottom.appendChild(col);
        }

        if (sources.length) {
            const col = document.createElement('div');
            col.className = 'road-col';
            const colLbl = document.createElement('div');
            colLbl.className = 'road-col-label';
            colLbl.textContent = 'Belajar Dari';
            const ul = document.createElement('ul');
            ul.className = 'road-sources';
            sources.forEach(s => {
                const li = document.createElement('li');
                li.textContent = s;
                ul.appendChild(li);
            });
            col.append(colLbl, ul);
            bottom.appendChild(col);
        }

        card.append(badge, meta, head, levelSlider, bottom);
        cardWrap.appendChild(card);
        row.append(dotCol, cardWrap);
        list.appendChild(row);
    });
}

function animateDonut(score) {
    const fill  = document.getElementById('donutFill');
    const label = document.getElementById('donutPct');
    if (!fill) return;

    fill.style.strokeDasharray  = CIRCUMFERENCE;
    fill.style.strokeDashoffset = CIRCUMFERENCE;

    const offset = CIRCUMFERENCE - (Math.min(score, 100) / 100) * CIRCUMFERENCE;
    setTimeout(() => { fill.style.strokeDashoffset = offset; }, 200);

    let n = 0;
    const tick = () => {
        n = Math.min(n + 2, score);
        label.textContent = n + '%';
        if (n < score) requestAnimationFrame(tick);
    };
    setTimeout(() => requestAnimationFrame(tick), 200);
}

function animateBars() {
    document.querySelectorAll('.match-bar-fill').forEach(el => {
        const pct = parseFloat(el.dataset.pct);
        setTimeout(() => { el.style.width = pct + '%'; }, 300);
    });
}

function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function fmtMil(num) {
    return Math.round(num / 1_000_000);
}

function parseDurationToWeeks(dur) {
    if (!dur) return '?';
    const s    = String(dur).toLowerCase();
    const nums = s.match(/(\d+)/g);
    if (!nums) return '?';
    const avg  = nums.length > 1
        ? (parseInt(nums[0]) + parseInt(nums[1])) / 2
        : parseInt(nums[0]);
    return Math.round(s.includes('bulan') ? avg * 4 : avg);
}

function calcTotalWeeks(roadmap) {
    return roadmap.reduce((sum, item) => sum + parseDurationToWeeks(item.duration), 0);
}