const tickerItems = [
    { text: "Temukan Skilmu",   icon: "bi-star-fill" },
    { text: "Temukan Arahmu",   icon: "bi-star-fill" },
    { text: "Wujudkan Kariermu",icon: "bi-star-fill" },
    { text: "Kenali Potensimu", icon: "bi-star-fill" },
    { text: "Raih Impianmu",    icon: "bi-star-fill" },
];

function buildTicker() {
    const track = document.getElementById("tickerTrack");
    const combined = [...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems];
    track.innerHTML = combined.map(item =>
    `<span class="ticker-item">
        ${item.text}
        <i class="bi ${item.icon}"></i>
    </span>`
    ).join("");
}

buildTicker();

function adjustTickerSpeed() {
    const track = document.getElementById("tickerTrack");
    const vw = window.innerWidth;
    const speed = vw < 576 ? 14 : vw < 992 ? 18 : 22;
    track.style.animationDuration = speed + "s";
}

adjustTickerSpeed();
window.addEventListener("resize", adjustTickerSpeed);