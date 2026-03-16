'use strict';

const CIRCUMFERENCE = 2 * Math.PI * 54;

const COMPANY_LABELS = {
    tech_startup:   'Tech Startup',
    tech_startup:   'Tech Startup',
    big_tech:       'Big Tech / Perusahaan Teknologi Besar',
    agency:         'Agensi Kreatif / Digital',
    corporate:      'Perusahaan Korporat / BUMN',
    finance:        'Perbankan & Keuangan',
    government:     'Instansi Pemerintah',
    hospital:       'Rumah Sakit & Klinik',
    ngo:            'NGO / Nirlaba',
    freelance:      'Freelance / Self-Employed',
    consultancy:    'Perusahaan Konsultan',
    edtech:         'Perusahaan Edukasi / EdTech',
    gaming:         'Industri Game',
    media:          'Media & Entertainment',
    energy:         'Perusahaan Energi',
    manufacturing:  'Industri Manufaktur'
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

const LEVEL_LABELS = { beginner: 'Pemula', intermediate: 'Menengah', advanced: 'Mahir' };

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
    loadEmailJS();
    buildShareModal(result);
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

    document.getElementById('btnUnduh').addEventListener('click', () => openModal('pdf'));
    document.getElementById('btnKirimEmail').addEventListener('click', () => openModal('email'));

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
        ['Pemula', 'Menengah', 'Mahir'].forEach((lbl, i) => {
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

function buildShareModal(r) {
    const modal = document.createElement('div');
    modal.id    = 'shareModal';
    modal.className = 'sp-overlay';
    modal.innerHTML = `
      <div class="sp-box">
 
        <div class="sp-header">
          <div>
            <div class="sp-header-label">Simpan Hasil</div>
            <div class="sp-header-title">Unduh atau Kirim ke Email</div>
          </div>
          <button class="sp-close" onclick="closeModal()">&#10005;</button>
        </div>
 
        <div class="sp-tabs">
          <button class="sp-tab active" id="spTabPdf" onclick="switchTab('pdf')">
            <i class="bi bi-file-earmark-pdf"></i> Unduh PDF
          </button>
          <button class="sp-tab" id="spTabEmail" onclick="switchTab('email')">
            <i class="bi bi-envelope"></i> Kirim Email
          </button>
        </div>
 
        <div class="sp-panel" id="spPanelPdf">
 
          <!-- Preview kartu -->
          <div class="sp-preview-card">
            <div class="sp-preview-badge">PREVIEW</div>
            <div class="sp-preview-name" id="spPrevName">–</div>
            <div class="sp-preview-sub">Hasil Analisis Karir · Lakar</div>
            <div class="sp-preview-stats">
              <div class="sp-preview-stat">
                <span class="sp-stat-num" id="spPrevScore">–</span>
                <span class="sp-stat-lbl">Skill Score</span>
              </div>
              <div class="sp-preview-stat">
                <span class="sp-stat-num" id="spPrevSkills">–</span>
                <span class="sp-stat-lbl">Skill Dipilih</span>
              </div>
              <div class="sp-preview-stat">
                <span class="sp-stat-num" id="spPrevGap">–</span>
                <span class="sp-stat-lbl">Skill Gap</span>
              </div>
            </div>
            <div class="sp-preview-jobs" id="spPrevJobs"></div>
          </div>
 
          <p class="sp-hint">
            <i class="bi bi-info-circle"></i>
            PDF berisi seluruh hasil: skor, top rekomendasi pekerjaan, skill gap, dan roadmap belajar.
          </p>
 
          <button class="sp-btn-primary" id="spBtnPdf" onclick="doDownloadPDF()">
            <i class="bi bi-download"></i> Unduh PDF Sekarang
          </button>
          <div class="sp-status sp-status-loading" id="spPdfLoading">
            <div class="sp-spin"></div> Sedang membuat PDF...
          </div>
          <div class="sp-status sp-status-success" id="spPdfSuccess">
            <i class="bi bi-check-circle-fill"></i> PDF berhasil diunduh!
          </div>
          <div class="sp-status sp-status-error" id="spPdfError">
            <i class="bi bi-x-circle-fill"></i> Gagal membuat PDF. Coba lagi.
          </div>
        </div>
 
        <div class="sp-panel" id="spPanelEmail" style="display:none">
 
          <div class="sp-guide" id="spGuide">
            <div class="sp-guide-title"><i class="bi bi-gear-fill"></i> Setup EmailJS (sekali saja)</div>
            <div class="sp-guide-steps">
              <div class="sp-guide-step"><span class="sp-step-num">1</span> Daftar gratis di <strong>emailjs.com</strong></div>
              <div class="sp-guide-step"><span class="sp-step-num">2</span> Buat <strong>Email Service</strong> (Gmail/Outlook) → salin Service ID</div>
              <div class="sp-guide-step"><span class="sp-step-num">3</span> Buat <strong>Email Template</strong> → salin Template ID</div>
              <div class="sp-guide-step"><span class="sp-step-num">4</span> Salin <strong>Public Key</strong> dari halaman Account</div>
            </div>
          </div>
 
          <div id="spConfigSection">
            <div class="sp-field-group">
              <label class="sp-label">Public Key</label>
              <input class="sp-input" type="text" id="spPublicKey" placeholder="Contoh: aBcDeFgHiJkLmNoP" />
            </div>
            <div class="sp-field-group">
              <label class="sp-label">Service ID</label>
              <input class="sp-input" type="text" id="spServiceId" placeholder="Contoh: service_abc123" />
            </div>
            <div class="sp-field-group">
              <label class="sp-label">Template ID</label>
              <input class="sp-input" type="text" id="spTemplateId" placeholder="Contoh: template_xyz789" />
            </div>
            <button class="sp-btn-secondary" onclick="saveConfig()">
              <i class="bi bi-floppy"></i> Simpan Konfigurasi
            </button>
            <div class="sp-status sp-status-success" id="spConfigSaved">
              <i class="bi bi-check-circle-fill"></i> Konfigurasi tersimpan!
            </div>
            <div class="sp-divider"></div>
          </div>
 
          <div class="sp-email-preview" id="spEmailPreview"></div>
 
          <div class="sp-field-group">
            <label class="sp-label">Kirim ke Email</label>
            <input class="sp-input" type="email" id="spToEmail" placeholder="contoh@gmail.com" />
          </div>
 
          <button class="sp-btn-primary sp-btn-gold" id="spBtnEmail" onclick="doSendEmail()">
            <i class="bi bi-send"></i> Kirim Hasil ke Email
          </button>
          <div class="sp-status sp-status-loading" id="spEmailLoading">
            <div class="sp-spin"></div> Mengirim email...
          </div>
          <div class="sp-status sp-status-success" id="spEmailSuccess">
            <i class="bi bi-check-circle-fill"></i> Email berhasil dikirim! Cek inbox kamu.
          </div>
          <div class="sp-status sp-status-error" id="spEmailError">
            <i class="bi bi-x-circle-fill"></i> Gagal kirim. Pastikan konfigurasi EmailJS sudah benar.
          </div>
        </div>
 
      </div><!-- /sp-box -->
 
      <div style="text-align:center;margin-top:10px;">
        <button onclick="resetConfig()" style="background:none;border:none;color:rgba(255,255,255,0.4);font-size:11px;cursor:pointer;text-decoration:underline;">
          Reset Konfigurasi EmailJS
        </button>
      </div>
    `;
 
    document.body.appendChild(modal);
 
    modal.addEventListener('click', e => {
        if (e.target === modal) closeModal();
    });
 
    fillPreview(r);
 
    const savedKey = localStorage.getItem('lakar_emailjs_key');
    if (savedKey) {
        document.getElementById('spConfigSection').style.display = 'none';
        document.getElementById('spGuide').style.display         = 'none';
        emailjs.init(savedKey);
    }
}
 
function fillPreview(r) {
    const top3 = r.top3 || [];
    document.getElementById('spPrevName').textContent   = r.profile?.nama || '–';
    document.getElementById('spPrevScore').textContent  = (r.overallSkillScore || 0) + '%';
    document.getElementById('spPrevSkills').textContent = Object.keys(r.userSkills || {}).length;
    document.getElementById('spPrevGap').textContent    =
        (r.roadmap || []).filter(x => x.priority === 'high').length;
 
    const jobsEl = document.getElementById('spPrevJobs');
    top3.forEach((job, i) => {
        const row = document.createElement('div');
        row.className = 'sp-prev-job-row';
        row.innerHTML = `<span class="sp-prev-job-name">#${i+1} ${esc(job.jobTitle)}</span>
                         <span class="sp-prev-job-pct">${job.matchPercent}%</span>`;
        jobsEl.appendChild(row);
    });
 
    const gap   = (r.roadmap || []).filter(x => x.priority === 'high').map(x => x.skillLabel).slice(0,3).join(', ') || '–';
    const owned = Object.entries(r.userSkills || {}).slice(0,3)
        .map(([id, lvl]) => `${id.replace(/_/g,' ')} (${LEVEL_LABELS[lvl]||lvl})`).join(', ');
 
    document.getElementById('spEmailPreview').innerHTML = `
        <div class="sp-email-preview-label">Preview isi email</div>
        <div class="sp-email-preview-body">
          <strong>Kepada:</strong> [email kamu]<br>
          <strong>Subjek:</strong> Hasil Lakar — ${esc(r.profile?.nama || 'Kamu')} 🎯<br><br>
          Halo <strong>${esc(r.profile?.nama || 'Kamu')}</strong>!
          Skor kamu: <strong>${r.overallSkillScore || 0}%</strong>.
          Rekomendasi #1: <strong>${esc(top3[0]?.jobTitle || '–')}</strong> (${top3[0]?.matchPercent || 0}% match).<br>
          Skill gap prioritas: ${esc(gap)}.<br>
          Skill dimiliki: ${esc(owned)}.
        </div>`;
}
 
function openModal(tab) {
    document.getElementById('shareModal').classList.add('open');
    switchTab(tab);
}
function closeModal() {
    document.getElementById('shareModal').classList.remove('open');
    ['spPdfLoading','spPdfSuccess','spPdfError',
     'spEmailLoading','spEmailSuccess','spEmailError',
     'spConfigSaved'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}
function switchTab(tab) {
    document.getElementById('spTabPdf').classList.toggle('active', tab === 'pdf');
    document.getElementById('spTabEmail').classList.toggle('active', tab === 'email');
    document.getElementById('spPanelPdf').style.display   = tab === 'pdf'   ? '' : 'none';
    document.getElementById('spPanelEmail').style.display = tab === 'email' ? '' : 'none';
}

function loadEmailJS() {
    if (window.emailjs) return;
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.onload = () => {
        const savedKey = localStorage.getItem('lakar_emailjs_key');
        if (savedKey) emailjs.init(savedKey);
    };
    document.head.appendChild(s);
}

function saveConfig() {
    const key = document.getElementById('spPublicKey').value.trim();
    const sid = document.getElementById('spServiceId').value.trim();
    const tid = document.getElementById('spTemplateId').value.trim();
    if (!key || !sid || !tid) {
        alert('Harap isi semua kolom konfigurasi (Public Key, Service ID, Template ID).');
        return;
    }
    localStorage.setItem('lakar_emailjs_key',        key);
    localStorage.setItem('lakar_emailjs_service_id', sid);
    localStorage.setItem('lakar_emailjs_template_id',tid);
    emailjs.init(key);
 
    showStatus('spConfigSaved');
    setTimeout(() => {
        document.getElementById('spConfigSection').style.display = 'none';
        document.getElementById('spGuide').style.display         = 'none';
    }, 900);
}
 
function resetConfig() {
    if (!confirm('Hapus konfigurasi EmailJS? Kamu perlu isi ulang setelah ini.')) return;
    localStorage.removeItem('lakar_emailjs_key');
    localStorage.removeItem('lakar_emailjs_service_id');
    localStorage.removeItem('lakar_emailjs_template_id');
    document.getElementById('spConfigSection').style.display = '';
    document.getElementById('spGuide').style.display         = '';
    document.getElementById('spPublicKey').value  = '';
    document.getElementById('spServiceId').value  = '';
    document.getElementById('spTemplateId').value = '';
    alert('Konfigurasi berhasil direset.');
}

function doDownloadPDF() {
    const btn = document.getElementById('spBtnPdf');
    btn.disabled = true;
    showStatus('spPdfLoading');
 
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', () => {
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', async () => {
            try {
                await generatePDF();
                showStatus('spPdfSuccess');
            } catch(e) {
                console.error(e);
                showStatus('spPdfError');
            } finally {
                btn.disabled = false;
            }
        });
    });
}
 
async function generatePDF() {
    const raw    = sessionStorage.getItem('lakar_result');
    const r      = JSON.parse(raw);
    const top3   = r.top3    || [];
    const roadmap = r.roadmap || [];
 
    let el = document.getElementById('_pdfCapture');
    if (!el) {
        el = document.createElement('div');
        el.id = '_pdfCapture';
        el.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;font-family:Sora,sans-serif;background:#ffffff;padding:40px;';
        document.body.appendChild(el);
    }
 
    el.innerHTML = buildPDFHTML(r);
    await new Promise(res => setTimeout(res, 400));
 
    const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
    });
 
    const { jsPDF } = window.jspdf;
    const pdf  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW  = pageW;
    const imgH  = (canvas.height * imgW) / canvas.width;
 
    let y = 0;
    while (y < imgH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -y, imgW, imgH);
        y += pageH;
    }
 
    const nama = (r.profile?.nama || 'hasil').toLowerCase().replace(/\s+/g, '-');
    pdf.save(`lakar-${nama}.pdf`);
    el.innerHTML = '';
}
 
function buildPDFHTML(r) {
    const top3    = r.top3    || [];
    const roadmap = r.roadmap || [];
    const profile = r.profile || {};
 
    const PEND = { sd:'SD', smp:'SMP', sma_smk:'SMA/SMK', d3:'D3/Diploma', s1:'S1/Sarjana', s2:'S2/Magister', s3:'S3/Doktor' };
 
    const jobRows = top3.map((job, i) => `
      <table style="width:100%;margin-bottom:12px;border-collapse:collapse;">
        <tr>
          <td style="width:36px;height:36px;background:${i===0?'#f5a623':'#e0e3ee'};border-radius:50%;text-align:center;
              vertical-align:middle;font-weight:900;font-size:15px;color:${i===0?'#094074':'#6b7280'};">#${i+1}</td>
          <td style="padding-left:14px;vertical-align:middle;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;">${esc(job.fieldLabel||'')}</div>
            <div style="font-size:18px;font-weight:900;color:#1a1a2e;">${esc(job.jobTitle)}</div>
          </td>
          <td style="text-align:right;vertical-align:middle;font-size:22px;font-weight:900;
              color:${job.matchPercent>=60?'#16a34a':job.matchPercent>=40?'#f5a623':'#6b7280'};">
            ${job.matchPercent}%
          </td>
        </tr>
        ${job.missingRequired?.length ? `
        <tr>
          <td colspan="3" style="padding:8px 0 0 50px;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">Skill Kurang</div>
            ${(job.missingRequired||[]).slice(0,4).map(s =>
              `<span style="display:inline-block;padding:2px 8px;background:#fff3e0;color:#c2410c;border-radius:50px;font-size:11px;font-weight:700;margin:2px;">${s.replace(/_/g,' ')}</span>`
            ).join('')}
          </td>
        </tr>` : ''}
        ${job.salaryRange ? `
        <tr>
          <td colspan="3" style="padding:4px 0 0 50px;font-size:12px;color:#6b7280;">
            Estimasi Gaji: <strong style="color:#1a1a2e;">Rp ${fmtMil(job.salaryRange.min)}–${fmtMil(job.salaryRange.max)} JT/bulan</strong>
          </td>
        </tr>` : ''}
      </table>`).join('');
 
    const roadRows = roadmap.slice(0, 8).map(item => `
      <div style="display:flex;gap:14px;margin-bottom:12px;">
        <div style="width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:5px;
            background:${{high:'#c2410c',medium:'#a16207',low:'#16a34a'}[item.priority]||'#a16207'};"></div>
        <div style="background:#fff;border:1px solid #ebedf5;border-radius:10px;padding:14px;flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
            <div>
              <div style="font-size:14px;font-weight:900;color:#1a1a2e;">${esc(item.skillLabel)}</div>
              <div style="font-size:11px;color:#6b7280;">untuk ${esc(item.forJob||'')}</div>
            </div>
            <span style="padding:3px 10px;border-radius:50px;font-size:10px;font-weight:700;white-space:nowrap;
                background:${{high:'#fff3e0',medium:'#fefce8',low:'#f0fdf4'}[item.priority]};
                color:${{high:'#c2410c',medium:'#a16207',low:'#16a34a'}[item.priority]};">
              ${{high:'Prioritas Tinggi',medium:'Prioritas Sedang',low:'Prioritas Rendah'}[item.priority]}
            </span>
          </div>
          <div style="margin-top:6px;font-size:11px;color:#6b7280;">
            ⏱ ${parseDurationToWeeks(item.duration)} minggu
            ${item.tools?.length ? '· 🛠 ' + item.tools.slice(0,2).join(', ') : ''}
          </div>
        </div>
      </div>`).join('');
 
    return `
    <div style="font-family:Arial,sans-serif;color:#1a1a2e;max-width:720px;margin:0 auto;">
 
      <div style="background:#094074;border-radius:16px;padding:32px;margin-bottom:24px;position:relative;overflow:hidden;">
        
        <div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
            color:#f5a623;margin-bottom:8px;">Lakar · Hasil Analisis Karir</div>
        <div style="font-size:28px;font-weight:900;color:#fff;margin-bottom:4px;">${esc(profile.nama||'Kamu')}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.5);">${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
        <div style="margin-top:18px;display:inline-block;background:rgba(245,166,35,.15);
            border:1.5px solid #f5a623;border-radius:50px;padding:8px 20px;">
          <span style="font-size:26px;font-weight:900;color:#f5c45e;">${r.overallSkillScore||0}%</span>
          <span style="font-size:11px;color:rgba(255,255,255,.5);margin-left:6px;">Skill Score</span>
        </div>
      </div>
 
      <table style="width:100%;border-spacing:12px;margin-bottom:24px;">
        <tr>
          ${[
            ['Pendidikan', PEND[profile.pendidikan]||profile.pendidikan||'–'],
            ['Status',     profile.status||'–'],
            ['Total Skill',Object.keys(r.userSkills||{}).length + ' skill'],
          ].map(([lbl,val]) => `
            <td style="background:#fff;border:1px solid #ebedf5;border-radius:10px;padding:14px;">
              <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
                  color:#6b7280;margin-bottom:5px;">${lbl}</div>
              <div style="font-size:13px;font-weight:700;color:#1a1a2e;">${val}</div>
            </td>`).join('')}
        </tr>
      </table>
 
      <div style="margin-bottom:24px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;
            color:#f5a623;margin-bottom:6px;">— Rekomendasi Karir</div>
        <div style="font-size:20px;font-weight:900;margin-bottom:16px;">Top ${top3.length} Pekerjaan Untukmu</div>
        <div style="background:#fff;border:1px solid #ebedf5;border-radius:14px;padding:20px;">
          ${jobRows}
        </div>
      </div>
 
      ${roadmap.length ? `
      <div style="margin-bottom:24px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;
            color:#f5a623;margin-bottom:6px;">— Skill Gap & Roadmap</div>
        <div style="font-size:20px;font-weight:900;margin-bottom:16px;">Yang Perlu Kamu Pelajari</div>
        ${roadRows}
      </div>` : ''}
 
      <div style="text-align:center;padding:16px;border-top:1px solid #ebedf5;margin-top:8px;">
        <div style="font-size:12px;font-weight:700;color:#1a1a2e;">Lakar</div>
      </div>
    </div>`;
}
 
async function doSendEmail() {
    const toEmail = document.getElementById('spToEmail').value.trim();
    if (!toEmail || !toEmail.includes('@')) {
        document.getElementById('spToEmail').focus();
        document.getElementById('spToEmail').style.borderColor = '#c2410c';
        return;
    }
    document.getElementById('spToEmail').style.borderColor = '';
 
    const serviceId  = localStorage.getItem('lakar_emailjs_service_id');
    const templateId = localStorage.getItem('lakar_emailjs_template_id');
    const publicKey  = localStorage.getItem('lakar_emailjs_key');
 
    if (!serviceId || !templateId || !publicKey) {
        alert('Konfigurasi EmailJS belum lengkap. Isi dulu di bagian setup.');
        return;
    }
 
    const btn = document.getElementById('spBtnEmail');
    btn.disabled = true;
    showStatus('spEmailLoading');
 
    const raw = sessionStorage.getItem('lakar_result');
    const r   = JSON.parse(raw);
    const top3    = r.top3    || [];
    const roadmap = r.roadmap || [];
 
    const gap = roadmap.filter(x => x.priority === 'high').map(x => x.skillLabel).join(', ') || 'Tidak ada';
    const ownedList = Object.entries(r.userSkills || {}).map(([id, lvl]) =>
        `${id.replace(/_/g,' ')} (${LEVEL_LABELS[lvl]||lvl})`
    ).join(', ');
 
    try {
        emailjs.init(publicKey);
        await emailjs.send(serviceId, templateId, {
            to_email:     toEmail,
            nama:         r.profile?.nama         || 'Pengguna Lakar',
            score:        (r.overallSkillScore || 0) + '%',
            job1_title:   top3[0]?.jobTitle        || '–',
            job1_match:   (top3[0]?.matchPercent   || 0) + '%',
            job1_salary:  top3[0]?.salaryRange
                            ? `Rp ${fmtMil(top3[0].salaryRange.min)}–${fmtMil(top3[0].salaryRange.max)} JT`
                            : '–',
            job2_title:   top3[1]?.jobTitle        || '–',
            job2_match:   (top3[1]?.matchPercent   || 0) + '%',
            job3_title:   top3[2]?.jobTitle        || '–',
            job3_match:   (top3[2]?.matchPercent   || 0) + '%',
            skill_gap:    gap,
            owned_skills: ownedList,
            total_skills: Object.keys(r.userSkills || {}).length,
            tanggal:      new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' }),
        });
        showStatus('spEmailSuccess');
    } catch(e) {
        console.error(e);
        showStatus('spEmailError');
    } finally {
        btn.disabled = false;
    }
}

function showStatus(id) {
    ['spPdfLoading','spPdfSuccess','spPdfError',
     'spEmailLoading','spEmailSuccess','spEmailError','spConfigSaved'].forEach(i => {
        const el = document.getElementById(i);
        if (el) el.style.display = i === id ? 'flex' : 'none';
    });
}
 
function loadScript(src, cb) {
    if (document.querySelector(`script[src="${src}"]`)) { cb(); return; }
    const s = document.createElement('script');
    s.src   = src;
    s.onload = cb;
    document.head.appendChild(s);
}
 
function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtMil(num) { return Math.round(num / 1_000_000); }
 
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
 
window.openModal   = openModal;
window.closeModal  = closeModal;
window.switchTab   = switchTab;
window.saveConfig  = saveConfig;
window.resetConfig = resetConfig;
window.doDownloadPDF = doDownloadPDF;
window.doSendEmail   = doSendEmail;