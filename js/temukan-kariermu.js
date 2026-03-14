'use strict';

const state = {
    currentScreen:      1,
    profile:            {},
    selectedFields:     [],
    selectedSkills:     {},
    preferredCompanies: [],
    jobsData:           null,
    skillsData:         null,
};

const fieldToCatMap = {
    data_ai:          ['programming', 'data_tools', 'infrastructure', 'ai_emerging'],
    it_software:      ['programming', 'web_dev', 'infrastructure'],
    design_creative:  ['design_tools'],
    healthcare:       ['healthcare_skills'],
    business_finance: ['business_skills'],
    education:        ['education_skills','business_skills', 'soft_skills'],
    art_media:        ['design_tools', 'ai_emerging'],
    green_sustainability: ['green_skills','business_skills'],
    teknik_manufaktur: ['manufacturing_skills']
};

const fieldDescMap = {
    data_ai:              'ML, AI, Data Science, Analytics',
    it_software:          'Web, Mobile, DevOps, Cybersecurity',
    design_creative:      'UI/UX, Grafis, Motion, 3D',
    healthcare:           'Medis, Keperawatan, Farmasi',
    business_finance:     'Product, Marketing, Finance, Ops',
    education:            'Mengajar, E-Learning, Riset',
    art_media:            'Game, Film, Jurnalisme, Seni',
    green_sustainability: 'Lingkungan, ESG, Energi Terbarukan',
    teknik_manufaktur:    'Mesin, Elektro, Otomasi, Manufaktur',
    engineering_manufacturing: 'Mesin, Elektronik, Manufaktur, Otomasi',
};


document.addEventListener('DOMContentLoaded', async () => {
    if (!document.getElementById('stepBar')) return;
    await loadData();
    renderFields();
    renderCompanies();
});

async function loadData() {
    try {
        const [jobsRes, skillsRes] = await Promise.all([
            fetch('data/jobs.json'),
            fetch('data/skills.json'),
        ]);
        state.jobsData   = await jobsRes.json();
        state.skillsData = await skillsRes.json();
    } catch (e) {
        console.error('Gagal load data:', e);
        alert('Gagal memuat data. Pastikan menjalankan melalui server lokal (Live Server / http-server).');
    }
}


function showStep(n) {
    document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('quiz-active'));
    const el = n === 'hasil'
        ? document.getElementById('stepHasil')
        : document.getElementById('step' + n);
    if (el) el.classList.add('quiz-active');
    state.currentScreen = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderStepBar(n);
}

function renderStepBar(n) {
    const bar = document.getElementById('stepBar');
    if (!bar) return;
    bar.style.display = n === 'hasil' ? 'none' : 'flex';
    if (n === 'hasil') return;
    [1, 2, 3, 4].forEach(i => {
        const item   = document.getElementById('sbi-' + i);
        const circle = item.querySelector('.step-circle');
        item.classList.remove('s-active', 's-done');
        if (i < n) {
            item.classList.add('s-done');
            circle.innerHTML = '<i class="bi bi-check"></i>';
        } else if (i === n) {
            item.classList.add('s-active');
            circle.textContent = i;
        } else {
            circle.textContent = i;
        }
    });
}

function goNext(from) {
    if (from === 1) {
        const v = id => document.getElementById(id)?.value.trim();
        if (!v('nama') || !v('usia') || !v('gender') || !v('pendidikan') || !v('status')) {
            alert('Harap lengkapi semua field yang wajib diisi (*).');
            return;
        }
        state.profile = {
            nama:       document.getElementById('nama').value.trim(),
            usia:       document.getElementById('usia').value,
            gender:     document.getElementById('gender').value,
            pendidikan: document.getElementById('pendidikan').value,
            status:     document.getElementById('status').value,
            jurusan:    document.getElementById('jurusan')?.value.trim() || '',
        };
    }

    if (from === 2) {
        const selected = document.querySelectorAll('#fieldGrid input:checked');
        if (selected.length === 0) {
            alert('Pilih minimal satu bidang minat.');
            return;
        }
        state.selectedFields = [...new Set([...selected].map(cb => cb.value))];
        renderSkills();
    }

    if (from === 4) {
        if (!document.querySelector('#step4 .pref-card.sel')) {
            alert('Pilih minimal satu preferensi lingkungan kerja.');
            return;
        }
        submitQuiz();
        return;
    }

    showStep(from + 1);
}

function goBack(from) {
    showStep(from - 1);
}

function toggleCard(card) {
    card.classList.toggle('sel');
}


function renderFields() {
    const grid = document.getElementById('fieldGrid');
    if (!grid || !state.jobsData || grid.children.length > 0) return;

    state.jobsData.fields.forEach(field => {
        const col = document.createElement('div');
        col.className = 'col-md-4';
        col.innerHTML = `
            <label class="minat-card">
                <input type="checkbox" value="${field.id}" onchange="onFieldChange(this)">
                <div class="check-dot"><i class="bi bi-check"></i></div>
                <div class="minat-ico"><i class="${field.icon}"></i></div>
                <div class="minat-name">${field.label}</div>
                <div class="minat-desc">${fieldDescMap[field.id] || ''}</div>
            </label>`;
        grid.appendChild(col);
    });

}

function onFieldChange(cb) {
    const card = cb.closest('.minat-card');
    card.classList.toggle('sel', cb.checked);
}



function renderCompanies() {
    const grid = document.getElementById('companyGrid');
    if (!grid || !state.jobsData || grid.children.length > 0) return;

    Object.entries(state.jobsData.company_types).forEach(([id, data]) => {
        const col = document.createElement('div');
        col.className = 'col-md-4';
        col.innerHTML = `
            <div class="pref-card" onclick="toggleCard(this)" data-pref-id="${id}">
                <div class="check-dot"><i class="bi bi-check"></i></div>
                <div class="pref-name">${data.label}</div>
                <div class="pref-desc">${data.culture}</div>
            </div>`;
        grid.appendChild(col);
    });
}

function renderSkills() {
    const area = document.getElementById('skillsArea');
    if (!area || !state.skillsData) return;

    const relevantCatIds = new Set(['soft_skills']);
    state.selectedFields.forEach(f => {
        (fieldToCatMap[f] || []).forEach(c => relevantCatIds.add(c));
    });

    const relevantCats = state.skillsData.categories.filter(c => relevantCatIds.has(c.id));

    area.innerHTML = '';

    relevantCats.forEach(cat => {
        const sec = document.createElement('div');
        sec.className = 'skill-sec';
        sec.dataset.catId = cat.id;

        const heading = document.createElement('div');
        heading.className = 'skill-heading';
        heading.textContent = cat.label;
        sec.appendChild(heading);

        const wrap = document.createElement('div');
        wrap.className = 'skill-wrap';
        sec.appendChild(wrap);

        cat.skills.forEach(skill => {
            wrap.appendChild(buildSkillItem(skill, cat));
        });

        area.appendChild(sec);
    });

    updateSkillCounter();
}

function buildSkillItem(skill, cat) {
    const typeLabel = skill.type === 'hard' ? 'Hard skill'
                    : skill.type === 'soft' ? 'Soft skill'
                    : 'Hard & Soft skill';

    const div = document.createElement('div');
    div.className       = 'skill-item';
    div.dataset.name    = skill.label.toLowerCase();
    div.dataset.skillId = skill.id;

    div.innerHTML = `
        <div class="skill-row" onclick="toggleSkillItem(this)">
            <div class="skill-left">
                <div class="skill-ico"><i class="${cat.icon}"></i></div>
                <div class="skill-info">
                    <div class="skill-name">${skill.label}</div>
                    <div class="skill-cat">${typeLabel} · ${cat.label}</div>
                </div>
            </div>
            <div class="skill-right">
                <span class="skill-badge skill-badge-none">Pilih Level</span>
                <div class="skill-arrow"><i class="bi bi-chevron-down"></i></div>
            </div>
        </div>
        <div class="level-panel">
            <div class="level-inner">
                <p class="level-lbl">Pilih Level</p>
                <div class="level-track">
                    <div class="level-fill" style="width:0%"></div>
                    <div class="level-dots">
                        <span class="level-dot level-dot-active" data-val="0"></span>
                        <span class="level-dot" data-val="1"></span>
                        <span class="level-dot" data-val="2"></span>
                    </div>
                </div>
                <div class="level-names">
                    <span class="on">Pemula</span>
                    <span>Menengah</span>
                    <span>Mahir</span>
                </div>
            </div>
        </div>`;

    div.querySelectorAll('.level-dot').forEach(dot => {
        dot.onclick = e => {
            e.stopPropagation();
            setSkillLevel(div, parseInt(dot.dataset.val));
        };
    });

    return div;
}

function toggleSkillItem(row) {
    const item   = row.closest('.skill-item');
    const panel  = item.querySelector('.level-panel');
    const isOpen = row.classList.contains('open');

    document.querySelectorAll('.skill-row.open').forEach(r => {
        r.classList.remove('open');
        r.closest('.skill-item').querySelector('.level-panel').classList.remove('open');
    });

    if (!isOpen) {
        row.classList.add('open');
        panel.classList.add('open');
        const skillId = item.dataset.skillId;
        if (!state.selectedSkills[skillId]) {
            setSkillLevel(item, 0);
        }
    } else {
        const skillId = item.dataset.skillId;
        delete state.selectedSkills[skillId];
        const badge = item.querySelector('.skill-badge');
        badge.className   = 'skill-badge skill-badge-none';
        badge.textContent = 'Pilih Level';
        item.querySelector('.level-fill').style.width = '0%';
        item.querySelectorAll('.level-dot').forEach((d, i) => {
            d.classList.remove('level-dot-active', 'passed');
            if (i === 0) d.classList.add('level-dot-active');
        });
        item.querySelectorAll('.level-names span').forEach((s, i) => s.classList.toggle('on', i === 0));
    }

    updateSkillCounter();
}

function setSkillLevel(item, val) {
    const LEVELS = {
        0: { label: 'Pemula',   cls: 'skill-badge-pemula',   fill: '0%'   },
        1: { label: 'Menengah', cls: 'skill-badge-menengah', fill: '50%'  },
        2: { label: 'Mahir',    cls: 'skill-badge-mahir',    fill: '100%' },
    };
    const cfg     = LEVELS[val];
    const skillId = item.dataset.skillId;

    state.selectedSkills[skillId] = ['beginner', 'intermediate', 'advanced'][val];

    item.querySelector('.level-fill').style.width = cfg.fill;
    item.querySelectorAll('.level-dot').forEach((d, i) => {
        d.classList.remove('level-dot-active', 'passed');
        if (i < val)        d.classList.add('passed');
        else if (i === val) d.classList.add('level-dot-active');
    });
    item.querySelectorAll('.level-names span').forEach((s, i) => s.classList.toggle('on', i === val));

    const badge = item.querySelector('.skill-badge');
    badge.className   = 'skill-badge ' + cfg.cls;
    badge.textContent = cfg.label;

    updateSkillCounter();
}

function updateSkillCounter() {
    const el = document.getElementById('selectedCount');
    if (el) el.textContent = Object.keys(state.selectedSkills).length;
}

function filterSkills(query) {
    const q = (query || '').toLowerCase().trim();
    document.querySelectorAll('#skillsArea .skill-item').forEach(item => {
        item.style.display = !q || item.dataset.name.includes(q) ? '' : 'none';
    });
    document.querySelectorAll('#skillsArea .skill-sec').forEach(sec => {
        const visible = [...sec.querySelectorAll('.skill-item')].some(i => i.style.display !== 'none');
        sec.style.display = visible ? '' : 'none';
    });
}


function submitQuiz() {
    state.preferredCompanies = [...document.querySelectorAll('#step4 .pref-card.sel')]
        .map(c => c.dataset.prefId || '').filter(Boolean);

    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('show');

    setTimeout(() => {
        const result = computeResults();
        sessionStorage.setItem('lakar_result', JSON.stringify(result));
        if (overlay) overlay.classList.remove('show');
        window.location.href = 'hasil.html';
    }, 1800);
}

function computeResults() {
    const userSkills    = state.selectedSkills;
    const userFields    = state.selectedFields;
    const userCompanies = state.preferredCompanies;
    const levelScore    = { beginner: 1, intermediate: 2, advanced: 3 };
    const scoredJobs    = [];

    state.jobsData.fields.forEach(field => {
        field.jobs.forEach(job => {
            const fieldMatch = userFields.includes(field.id) ? 1 : 0.3;

            const reqSkills = job.required_skills || [];
            let reqScore = 0;
            reqSkills.forEach(sk => { if (userSkills[sk]) reqScore += levelScore[userSkills[sk]]; });
            const reqRatio = reqSkills.length > 0 ? reqScore / (reqSkills.length * 3) : 0;

            const niceSkills = job.nice_to_have_skills || [];
            let niceScore = 0;
            niceSkills.forEach(sk => { if (userSkills[sk]) niceScore += levelScore[userSkills[sk]]; });
            const niceRatio = niceSkills.length > 0 ? niceScore / (niceSkills.length * 3) : 0;

            const companyMatch = job.company_types.some(c => userCompanies.includes(c)) ? 1 : 0.4;
            const demandBonus  = { very_high: 0.15, high: 0.08, medium: 0, low: -0.05 }[job.demand_level] || 0;

            const totalScore = (
                (reqRatio    * 0.45) +
                (niceRatio   * 0.15) +
                (fieldMatch  * 0.25) +
                (companyMatch * 0.15) +
                demandBonus
            );

            const missingRequired = reqSkills.filter(sk => !userSkills[sk]);
            const missingNice     = niceSkills.filter(sk => !userSkills[sk]);
            const ownedSkills     = reqSkills.filter(sk => userSkills[sk]).map(sk => ({ id: sk, level: userSkills[sk] }));

            scoredJobs.push({
                jobId: job.id, jobTitle: job.title, jobDesc: job.description,
                fieldId: field.id, fieldLabel: field.label, fieldIcon: field.icon,
                score: Math.min(totalScore, 1),
                matchPercent: Math.round(Math.min(totalScore, 1) * 100),
                demandLevel: job.demand_level, growthRate: job.growth_rate,
                companyTypes: job.company_types, workTypes: job.work_type || [],
                salaryRange: job.salary_range,
                missingRequired, missingNice, ownedSkills,
                educationLevel: job.education_level,
            });
        });
    });

    scoredJobs.sort((a, b) => b.score - a.score);
    const top3 = scoredJobs.slice(0, 3);
    const roadmap = buildRoadmap(top3);

    const allJobSkills = new Set();
    state.jobsData.fields.forEach(f =>
        f.jobs.forEach(j => {
            (j.required_skills || []).forEach(s => allJobSkills.add(s));
        })
    );
    const userSkillCount = Object.keys(userSkills).length;
    const overallSkillScore = userSkillCount > 0
        ? Math.round((userSkillCount / Math.max(allJobSkills.size, 1)) * 100)
        : 0;

    return {
        profile:            state.profile,
        selectedFields:     state.selectedFields,
        userSkills,
        preferredCompanies: state.preferredCompanies,
        top3,
        allJobsScored:      scoredJobs,
        overallSkillScore,
        roadmap,
        generatedAt:        new Date().toISOString(),
        jobsData:           state.jobsData,
        skillsData:         state.skillsData,
    };
}

function buildRoadmap(top3) {
    const roadmap = [], seen = new Set();
    top3.forEach((job, rank) => {
        job.missingRequired.forEach(skillId => {
            if (seen.has(skillId)) return;
            seen.add(skillId);
            const info = findSkillInfo(skillId);
            roadmap.push({
                skillId, skillLabel: info ? info.label : skillId,
                priority: rank === 0 ? 'high' : 'medium', type: 'required',
                forJob: job.jobTitle,
                learnFrom: info?.levels?.beginner?.learn_from || [],
                duration:  info?.levels?.beginner?.duration_estimate || '1-3 bulan',
                tools:     info?.tools || [],
            });
        });
    });
    const order = { high: 0, medium: 1, low: 2 };
    roadmap.sort((a, b) => order[a.priority] - order[b.priority]);
    return roadmap.slice(0, 12);
}

function findSkillInfo(skillId) {
    if (!state.skillsData) return null;
    for (const cat of state.skillsData.categories)
        for (const skill of cat.skills)
            if (skill.id === skillId) return skill;
    return null;
}