const trendData = {
    labels: ['2021','2022','2023','2024','2025','2026'],
    values: [8.1, 4.9, 9.7, 6.2, 4.6, 4.3]
};

function calculateAllStats(data) {
    const allJobs = [];
    data.fields.forEach(f => f.jobs && f.jobs.forEach(j => allJobs.push(j)));

    const skillLabels = {
        'python': 'Pemrograman',
        'javascript': 'JavaScript',
        'sql': 'SQL & Database',
        'machine_learning': 'Machine Learning',
        'data_analysis': 'Analisis Data',
        'communication': 'Komunikasi',
        'problem_solving': 'Problem Solving',
        'figma': 'Figma / UI Tools',
        'react': 'React',
        'digital_marketing': 'Digital Marketing',
        'tableau': 'Data Visualization'
    };

    const skillFreq = {};
    allJobs.forEach(job => {
        (job.required_skills || []).forEach(s => { skillFreq[s] = (skillFreq[s] || 0) + 1; });
        (job.nice_to_have_skills || []).forEach(s => { skillFreq[s] = (skillFreq[s] || 0) + 0.5; });
    });

    const totalOcc = Object.values(skillFreq).reduce((a, b) => a + b, 0);
    const topSkills = Object.entries(skillFreq)
        .map(([id, cnt]) => ({
            id,
            label: skillLabels[id] || id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            pct: totalOcc > 0 ? Math.round((cnt / totalOcc) * 100) : 0
        }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 5);

    const maxPct = topSkills[0]?.pct || 1;
    topSkills.forEach(s => { s.pct = Math.round((s.pct / maxPct) * 91); });

    const parseGrowth = (val) => {
        if (!val || val === 'emerging') return null;
        return parseInt(String(val).replace('%', '')) || 0;
    };

    const demandOpenings = { very_high: 8000, high: 5000, medium: 2500, low: 800 };
    const calcOpenings = (job) => {
        const base = demandOpenings[job.demand_level] || 1000;
        const salaryFactor = job.salary_range ? (job.salary_range.max / 50000000) : 0.5;
        return Math.round(base * (0.6 + salaryFactor * 0.4) / 100) * 100;
    };

    const demandScore = { very_high: 100, high: 70, medium: 40, low: 10 };
    allJobs.forEach(job => {
        const g = parseGrowth(job.growth_rate);
        job._score = (demandScore[job.demand_level] || 0) + (g !== null ? g * 0.3 : 50);
    });

    const topJobs = [...allJobs]
        .sort((a, b) => b._score - a._score)
        .slice(0, 5)
        .map((job, i) => ({
            rank: i + 1,
            title: job.title,
            skills: (job.required_skills || []).slice(0, 4).map(s =>
                s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            ),
            openings: calcOpenings(job),
            growthRate: parseGrowth(job.growth_rate),
            isEmerging: job.growth_rate === 'emerging'
        }));

    const lastVal = trendData.values[trendData.values.length - 1];
    const prevVal = trendData.values[trendData.values.length - 2];
    const trendChange = Math.abs(lastVal - prevVal).toFixed(1);
    const trendDir = lastVal < prevVal ? 'down' : 'up';

    return { topSkills, topJobs, trendChange, trendDir, currentPct: lastVal };
}

let lineChartInstance = null;

function renderLineChart() {
    const canvas = document.getElementById('lineChart');
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight || 220);
    gradient.addColorStop(0, 'rgba(9,64,116,0.18)');
    gradient.addColorStop(1, 'rgba(9,64,116,0)');

    if (lineChartInstance) lineChartInstance.destroy();

    lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trendData.labels,
            datasets: [{
                data: trendData.values,
                borderColor: '#094074',
                backgroundColor: gradient,
                borderWidth: 2.5,
                pointBackgroundColor: '#f5a623',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.45
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 3,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.parsed.y}%`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { font: { family: 'Sora', size: 11 }, color: '#6b7280' }
                },
                y: {
                    min: 0,
                    max: 50,
                    grid: { color: '#f0f0f0', drawBorder: false },
                    border: { display: false, dash: [4, 4] },
                    ticks: { font: { family: 'Sora', size: 11 }, color: '#6b7280', stepSize: 10, callback: v => v }
                }
            }
        }
    });
}

window.addEventListener('resize', () => {
    if (lineChartInstance) lineChartInstance.resize();
});

function renderSkillBars(skills) {
    const container = document.getElementById('skillDemandContainer');
    if (!container) return;

    let html = '';
    skills.forEach(skill => {
        html += `
            <div class="skill-item">
                <div class="skill-label">
                    <span>${skill.label}</span>
                    <span class="pct">${skill.pct}%</span>
                </div>
                <div class="skill-bar-bg">
                    <div class="skill-bar-fill" data-width="${skill.pct}"></div>
                </div>
            </div>`;
    });
    container.innerHTML = html;

    setTimeout(() => {
        document.querySelectorAll('.skill-bar-fill').forEach(bar => {
            bar.style.width = bar.dataset.width + '%';
        });
    }, 100);
}

function renderSektor(data) {
    const container = document.getElementById('sektorContainer');
    if (!container) return;

    const top3 = data.fields
        .map(field => ({
            icon: field.icon,
            name: field.label,
            sub: field.jobs.slice(0, 4).map(j => j.title).join(', '),
            score: field.jobs.filter(j => j.demand_level === 'very_high').length
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    container.innerHTML = top3.map(s => `
        <div class="sektor-item">
            <div class="sektor-icon"><i class="${s.icon}"></i></div>
            <div>
                <div class="sektor-name">${s.name}</div>
                <div class="sektor-sub">${s.sub}</div>
            </div>
        </div>`).join('');
}

function renderTopJobs(jobs) {
    const container = document.getElementById('topJobsContainer');
    if (!container) return;

    container.innerHTML = jobs.map(job => {
        let badgeHtml = '';
        if (job.isEmerging) {
            badgeHtml = `<div class="yoy-badge emerging">&#9733; Emerging<span class="yoy-label">Tren Baru</span></div>`;
        } else if (job.growthRate !== null) {
            const isUp = job.growthRate >= 0;
            const arrow = isUp ? '\u25b2' : '\u25bc';
            const badgeClass = isUp ? 'yoy-badge up' : 'yoy-badge down';
            const sign = isUp ? '+' : '';
            badgeHtml = `<div class="${badgeClass}">${arrow} ${sign}${job.growthRate}%<span class="yoy-label">YoY</span></div>`;
        }
        return `
        <div class="job-row ${job.rank === 1 ? 'top-1' : ''}">
            <div class="job-rank-num">${job.rank}</div>
            <div class="job-info">
                <div class="job-title-text">${job.title}</div>
                <div class="job-skills-text">${job.skills.join(' · ')}</div>
            </div>
            <div class="job-count-area">
                <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px">
                    ${badgeHtml}
                    <div>
                        <div class="job-count-num">${job.openings.toLocaleString('id-ID')}</div>
                        <div class="job-count-label">Lowongan</div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function init(data) {
    const stats = calculateAllStats(data);

    const pctEl = document.getElementById('currentPct');
    if (pctEl) pctEl.innerHTML = `${stats.currentPct}<span class="big-pct-unit">%</span>`;

    const trendEl = document.getElementById('yearlyTrend');
    if (trendEl) {
        const icon = stats.trendDir === 'down'
            ? '<i class="bi bi-arrow-down-short"></i>'
            : '<i class="bi bi-arrow-up-short"></i>';
        trendEl.innerHTML = `${icon} ${stats.trendChange}% dari Tahun Lalu`;
    }

    renderLineChart();
    renderSkillBars(stats.topSkills);
    renderSektor(data);
    renderTopJobs(stats.topJobs);
}

document.addEventListener('DOMContentLoaded', function () {
    fetch('data/jobs.json')
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(data => init(data))
        .catch(() => console.error('Gagal load jobs.json'));
});