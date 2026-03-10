'use strict';

const state = {
  currentScreen: 0,
  profile: {
    nama: '', usia: '', pendidikan: '', pengalaman: '', kota: ''
  },
  selectedFields: [],
  selectedSkills: {},
  preferredCompanies: [],
  preferredWorktype: '',

  jobsData: null,
  skillsData: null,
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});

async function loadData() {
  try {
    const [jobsRes, skillsRes] = await Promise.all([
      fetch('data/jobs.json'),
      fetch('data/skills.json'),
    ]);
    state.jobsData  = await jobsRes.json();
    state.skillsData = await skillsRes.json();
  } catch (e) {
    console.error('Gagal load data:', e);
    alert('Gagal memuat data. Pastikan menjalankan melalui server lokal (Live Server / http-server).');
  }
}

function startQuiz() {
  document.getElementById('progressWrap').style.display = 'block';
  goToScreen(1);
}

function goToStep(step) {
  const current = state.currentScreen;
  if (step > current) {
    if (!validateScreen(current)) return;
    saveScreenData(current);
  }

  if (step === 3) renderSkills();
  if (step === 4) renderCompanies();

  goToScreen(step);
}

function goToScreen(n) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${n}`).classList.add('active');
  state.currentScreen = n;
  updateProgress(n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress(step) {
  for (let i = 1; i <= 4; i++) {
    const dot  = document.getElementById(`step${i}Dot`);
    const line = document.getElementById(`line${i}`);
    dot.classList.remove('active', 'done');
    if (line) line.classList.remove('done');

    if (i < step)  { dot.classList.add('done'); if (line) line.classList.add('done'); }
    if (i === step) dot.classList.add('active');
  }
}

function validateScreen(step) {
  let valid = true;

  if (step === 1) {
    const nama = document.getElementById('inputNama').value.trim();
    const usia = document.getElementById('inputUsia').value;
    const pend = document.getElementById('inputPendidikan').value;
    const peng = document.getElementById('inputPengalaman').value;

    toggleError('errNama',       !nama);
    toggleError('errUsia',       !usia || usia < 15 || usia > 60);
    toggleError('errPendidikan', !pend);
    toggleError('errPengalaman', !peng);

    valid = !!(nama && usia && usia >= 15 && usia <= 60 && pend && peng);
  }

  if (step === 2) {
    const selected = document.querySelectorAll('#fieldGrid input:checked');
    toggleError('errField', selected.length === 0);
    valid = selected.length > 0;
  }

  if (step === 4) {
    const companies = document.querySelectorAll('#companyGrid input:checked');
    const worktype  = document.querySelector('input[name="worktype"]:checked');
    toggleError('errCompany',  companies.length === 0);
    toggleError('errWorktype', !worktype);
    valid = companies.length > 0 && !!worktype;
  }

  return valid;
}

function toggleError(id, show) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('show', show);
}

function saveScreenData(step) {
  if (step === 1) {
    state.profile = {
      nama:        document.getElementById('inputNama').value.trim(),
      usia:        document.getElementById('inputUsia').value,
      pendidikan:  document.getElementById('inputPendidikan').value,
      pengalaman:  document.getElementById('inputPengalaman').value,
      kota:        document.getElementById('inputKota').value.trim(),
    };
  }

  if (step === 2) {
    state.selectedFields = [...document.querySelectorAll('#fieldGrid input:checked')]
      .map(cb => cb.value);
  }
}

function renderFields() {
  if (!state.jobsData) return;

  const grid = document.getElementById('fieldGrid');
  if (!grid || grid.children.length > 0) return;

  state.jobsData.fields.forEach(field => {
    const label = document.createElement('label');
    label.className = 'field-card';
    label.innerHTML = `
      <input type="checkbox" value="${field.id}" onchange="onFieldChange()" />
      <div class="field-card-inner">
        <span class="field-icon">${field.icon}</span>
        <span class="field-name">${field.label}</span>
        <span class="field-desc">${getFieldDesc(field.id)}</span>
      </div>
      <div class="field-check">
        <svg viewBox="0 0 11 11" fill="none">
          <path d="M2 5.5L4.5 8L9 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>`;
    grid.appendChild(label);
  });
}

function getFieldDesc(id) {
  const descs = {
    data_ai:          'ML, AI, Data Science, Analytics',
    it_software:      'Web, Mobile, DevOps, Cybersecurity',
    design_creative:  'UI/UX, Grafis, Motion, 3D',
    healthcare:       'Medis, Keperawatan, Farmasi',
    business_finance: 'Product, Marketing, Finance, Ops',
    education:        'Mengajar, E-Learning, Riset',
    art_media:        'Game, Film, Jurnalisme, Seni',
    green_sustainability: 'Lingkungan, ESG, Energi Terbarukan',
  };
  return descs[id] || '';
}

function onFieldChange() {
  toggleError('errField', false);
}

const screen2Observer = new MutationObserver(() => {
  const s2 = document.getElementById('screen-2');
  if (s2 && s2.classList.contains('active')) renderFields();
});
document.addEventListener('DOMContentLoaded', () => {
  const s2 = document.getElementById('screen-2');
  if (s2) screen2Observer.observe(s2, { attributes: true, attributeFilter: ['class'] });
});

function renderSkills() {
  if (!state.skillsData) return;

  const area = document.getElementById('skillsArea');
  area.innerHTML = '';

  const relevantCategories = getRelevantCategories();

  relevantCategories.forEach(cat => {
    const section = document.createElement('div');
    section.className = 'skill-category';
    section.dataset.catId = cat.id;

    section.innerHTML = `
      <div class="skill-cat-header">
        <span class="skill-cat-icon">${cat.icon}</span>
        <span class="skill-cat-name">${cat.label}</span>
      </div>
      <div class="skill-list"></div>`;

    const list = section.querySelector('.skill-list');

    cat.skills.forEach(skill => {
      const item = buildSkillItem(skill);
      list.appendChild(item);
    });

    area.appendChild(section);
  });

  updateSkillCounter();
}

function getRelevantCategories() {
  const fields = state.selectedFields;

  const fieldToCatMap = {
    data_ai:          ['programming', 'data_tools', 'infrastructure', 'ai_emerging'],
    it_software:      ['programming', 'web_dev', 'infrastructure'],
    design_creative:  ['design_tools'],
    healthcare:       ['healthcare_skills'],
    business_finance: ['business_skills'],
    education:        ['education_skills','business_skills', 'soft_skills'],
    art_media:        ['design_tools', 'ai_emerging'],
    green_sustainability: ['green_skills','business_skills'],
  };

  const relevantCatIds = new Set(['soft_skills']);
  fields.forEach(f => {
    (fieldToCatMap[f] || []).forEach(c => relevantCatIds.add(c));
  });

  return state.skillsData.categories.filter(c => relevantCatIds.has(c.id));
}

function buildSkillItem(skill) {
  const isChecked = !!state.selectedSkills[skill.id];
  const currentLevel = state.selectedSkills[skill.id] || '';

  const div = document.createElement('div');
  div.className = 'skill-item';
  div.dataset.skillId = skill.id;
  div.dataset.skillName = skill.label.toLowerCase();

  const levelBtns = ['beginner', 'intermediate', 'advanced'].map(lvl => `
    <button
      class="level-btn ${lvl} ${currentLevel === lvl ? 'active' : ''}"
      data-level="${lvl}"
      onclick="setLevel('${skill.id}', '${lvl}', this)"
    >${lvl === 'beginner' ? 'Pemula' : lvl === 'intermediate' ? 'Menengah' : 'Jago'}</button>
  `).join('');

  div.innerHTML = `
    <div class="skill-checkbox-wrap ${isChecked ? 'checked' : ''}"
         onclick="toggleSkill('${skill.id}', this)">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6L5 9L10 3" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="skill-info">
      <div class="skill-name">${skill.label}</div>
      <div class="skill-subdesc">${skill.type === 'hard' ? 'Hard skill' : skill.type === 'soft' ? 'Soft skill' : 'Hard & Soft skill'}</div>
    </div>
    <div class="skill-level-wrap ${isChecked ? 'visible' : ''}">
      ${levelBtns}
    </div>`;

  return div;
}

function toggleSkill(skillId, checkboxEl) {
  const item = checkboxEl.closest('.skill-item');
  const levelWrap = item.querySelector('.skill-level-wrap');
  const isChecked = checkboxEl.classList.contains('checked');

  if (isChecked) {
    checkboxEl.classList.remove('checked');
    levelWrap.classList.remove('visible');
    delete state.selectedSkills[skillId];
  } else {
    checkboxEl.classList.add('checked');
    levelWrap.classList.add('visible');
    if (!state.selectedSkills[skillId]) {
      state.selectedSkills[skillId] = 'beginner';
      const beginnerBtn = levelWrap.querySelector('[data-level="beginner"]');
      if (beginnerBtn) beginnerBtn.classList.add('active');
    }
  }

  updateSkillCounter();
}

function setLevel(skillId, level, btn) {
  const item = btn.closest('.skill-item');
  const checkbox = item.querySelector('.skill-checkbox-wrap');
  if (!checkbox.classList.contains('checked')) {
    checkbox.classList.add('checked');
    item.querySelector('.skill-level-wrap').classList.add('visible');
  }

  state.selectedSkills[skillId] = level;

  const allBtns = btn.closest('.skill-level-wrap').querySelectorAll('.level-btn');
  allBtns.forEach(b => {
    b.classList.remove('active');
    if (b.dataset.level === level) b.classList.add('active');
  });

  updateSkillCounter();
}

function updateSkillCounter() {
  const count = Object.keys(state.selectedSkills).length;
  document.getElementById('selectedCount').textContent = count;
}

function filterSkills(query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll('.skill-item').forEach(item => {
    const name = item.dataset.skillName || '';
    item.style.display = q === '' || name.includes(q) ? '' : 'none';
  });

  document.querySelectorAll('.skill-category').forEach(cat => {
    const visibleItems = [...cat.querySelectorAll('.skill-item')]
      .filter(i => i.style.display !== 'none');
    cat.style.display = visibleItems.length === 0 ? 'none' : '';
  });
}

function renderCompanies() {
  if (!state.jobsData) return;

  const grid = document.getElementById('companyGrid');
  if (grid.children.length > 0) return;

  const companies = state.jobsData.company_types;

  Object.entries(companies).forEach(([id, data]) => {
    const label = document.createElement('label');
    label.className = 'company-card';
    label.innerHTML = `
      <input type="checkbox" value="${id}" onchange="onCompanyChange()" />
      <div class="company-card-inner">
        <div class="company-name">${data.label}</div>
        <div class="company-culture">${data.culture}</div>
      </div>`;
    grid.appendChild(label);
  });
}

function onCompanyChange() {
  toggleError('errCompany', false);
}

function submitQuiz() {
  if (!validateScreen(4)) return;

  state.preferredCompanies = [...document.querySelectorAll('#companyGrid input:checked')]
    .map(cb => cb.value);
  const wt = document.querySelector('input[name="worktype"]:checked');
  state.preferredWorktype = wt ? wt.value : '';

  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('show');

  setTimeout(() => {
    const result = computeResults();
    sessionStorage.setItem('skillpath_result', JSON.stringify(result));
    overlay.classList.remove('show');
    window.location.href = 'result.html';
  }, 1800);
}

function computeResults() {
  const userSkills = state.selectedSkills;
  const userFields = state.selectedFields;
  const userCompanies = state.preferredCompanies;
  const userWorktype = state.preferredWorktype;

  const levelScore = { beginner: 1, intermediate: 2, advanced: 3 };

  const scoredJobs = [];

  state.jobsData.fields.forEach(field => {
    field.jobs.forEach(job => {
      const fieldMatch = userFields.includes(field.id) ? 1 : 0.3;

      const reqSkills = job.required_skills || [];
      let reqScore = 0;
      let reqTotal = reqSkills.length * 3;
      reqSkills.forEach(sk => {
        if (userSkills[sk]) {
          reqScore += levelScore[userSkills[sk]];
        }
      });
      const reqRatio = reqTotal > 0 ? reqScore / reqTotal : 0;

      const niceSkills = job.nice_to_have_skills || [];
      let niceScore = 0;
      niceSkills.forEach(sk => {
        if (userSkills[sk]) niceScore += levelScore[userSkills[sk]];
      });
      const niceRatio = niceSkills.length > 0 ? niceScore / (niceSkills.length * 3) : 0;

      const companyMatch = job.company_types.some(c => userCompanies.includes(c)) ? 1 : 0.4;

      const workMatch = job.work_type && job.work_type.includes(userWorktype) ? 1 : 0.5;

      const demandBonus = {
        very_high: 0.15, high: 0.08, medium: 0, low: -0.05
      }[job.demand_level] || 0;

      const totalScore = (
        (reqRatio   * 0.45) +
        (niceRatio  * 0.15) +
        (fieldMatch * 0.20) +
        (companyMatch * 0.10) +
        (workMatch  * 0.10) +
        demandBonus
      );

      const missingRequired = reqSkills.filter(sk => !userSkills[sk]);
      const missingNice     = niceSkills.filter(sk => !userSkills[sk]);

      const ownedSkills = reqSkills
        .filter(sk => userSkills[sk])
        .map(sk => ({ id: sk, level: userSkills[sk] }));

      scoredJobs.push({
        jobId:         job.id,
        jobTitle:      job.title,
        jobDesc:       job.description,
        fieldId:       field.id,
        fieldLabel:    field.label,
        fieldIcon:     field.icon,
        score:         Math.min(totalScore, 1),
        matchPercent:  Math.round(Math.min(totalScore, 1) * 100),
        reqRatio,
        demandLevel:   job.demand_level,
        growthRate:    job.growth_rate,
        companyTypes:  job.company_types,
        workTypes:     job.work_type || [],
        salaryRange:   job.salary_range,
        missingRequired,
        missingNice,
        ownedSkills,
        educationLevel: job.education_level,
      });
    });
  });

  scoredJobs.sort((a, b) => b.score - a.score);

  const top3 = scoredJobs.slice(0, 3);

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

  const roadmap = buildRoadmap(top3);

  return {
    profile:       state.profile,
    selectedFields: state.selectedFields,
    userSkills,
    preferredCompanies: state.preferredCompanies,
    preferredWorktype: state.preferredWorktype,
    top3,
    allJobsScored: scoredJobs,
    overallSkillScore,
    roadmap,
    generatedAt:   new Date().toISOString(),
    jobsData:      state.jobsData,
    skillsData:    state.skillsData,
  };
}

function buildRoadmap(top3) {
  const roadmap = [];
  const seen = new Set();
  const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };

  top3.forEach((job, rank) => {
    job.missingRequired.forEach(skillId => {
      if (seen.has(skillId)) return;
      seen.add(skillId);

      const skillInfo = findSkillInfo(skillId);
      roadmap.push({
        skillId,
        skillLabel: skillInfo ? skillInfo.label : skillId,
        priority: rank === 0 ? 'high' : 'medium',
        type: 'required',
        forJob: job.jobTitle,
        startLevel: 'beginner',
        targetLevel: 'intermediate',
        learnFrom: skillInfo ? (skillInfo.levels?.beginner?.learn_from || []) : [],
        duration: skillInfo ? (skillInfo.levels?.beginner?.duration_estimate || '1-3 bulan') : '1-3 bulan',
        tools: skillInfo ? (skillInfo.tools || []) : [],
      });
    });

    job.ownedSkills
      .filter(s => s.level === 'beginner')
      .forEach(({ id: skillId }) => {
        if (seen.has(`upgrade_${skillId}`)) return;
        seen.add(`upgrade_${skillId}`);

        const skillInfo = findSkillInfo(skillId);
        roadmap.push({
          skillId,
          skillLabel: skillInfo ? skillInfo.label : skillId,
          priority: 'low',
          type: 'upgrade',
          forJob: job.jobTitle,
          startLevel: 'beginner',
          targetLevel: 'intermediate',
          learnFrom: skillInfo ? (skillInfo.levels?.intermediate?.learn_from || []) : [],
          duration: skillInfo ? (skillInfo.levels?.intermediate?.duration_estimate || '2-4 bulan') : '2-4 bulan',
          tools: skillInfo ? (skillInfo.tools || []) : [],
        });
      });
  });

  const order = { high: 0, medium: 1, low: 2 };
  roadmap.sort((a, b) => order[a.priority] - order[b.priority]);

  return roadmap.slice(0, 12);
}

function findSkillInfo(skillId) {
  if (!state.skillsData) return null;
  for (const cat of state.skillsData.categories) {
    for (const skill of cat.skills) {
      if (skill.id === skillId) return skill;
    }
  }
  return null;
}

window.startQuiz    = startQuiz;
window.goToStep     = goToStep;
window.toggleSkill  = toggleSkill;
window.setLevel     = setLevel;
window.filterSkills = filterSkills;
window.submitQuiz   = submitQuiz;
window.onFieldChange  = onFieldChange;
window.onCompanyChange = onCompanyChange;
