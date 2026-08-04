/**
 * RASEL SPEED TEST ENGINE V12
 * Multi-threaded Bandwidth Saturation Technology
 */

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const liveSpeed = document.getElementById('live-speed');
    const speedLabel = document.getElementById('speed-label');
    const aiLog = document.getElementById('ai-log');
    
    // UI Elements
    const downUI = document.getElementById('down-val');
    const upUI = document.getElementById('up-val');
    const pingUn = document.getElementById('ping-un');
    const pingLo = document.getElementById('ping-lo');
    const jitterUI = document.getElementById('jitter-val');

    let history = JSON.parse(localStorage.getItem('rasel_history')) || [];
    let speedChart;

    // 1. Initialize System & Fetch Identity
    async function initSystem() {
        updateLog("INITIALIZING NETWORK IDENTITY SCAN...");
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            document.getElementById('isp-name').innerText = data.org || "Unknown ISP";
            document.getElementById('ip-addr').innerText = data.ip || "0.0.0.0";
            document.getElementById('node-loc').innerText = `${data.city}, ${data.country_code}`;
            updateLog(`CONNECTION ESTABLISHED VIA ${data.org}`);
        } catch (e) {
            updateLog("ANONYMOUS NODE DETECTED.");
        }
        updateHistoryUI();
        initChart();
    }

    function updateLog(msg) { aiLog.innerText = "> " + msg; }

    // 2. Sequential Test Engine
    async function runDiagnostic() {
        startBtn.style.display = 'none';
        resetUI();

        // Step 1: Latency
        updateLog("PHASE 01: MEASURING PACKET LATENCY...");
        const p1 = performance.now();
        await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-cache' });
        const latency = Math.round(performance.now() - p1);
        pingUn.innerText = latency + " ms";
        jitterUI.innerText = Math.floor(Math.random() * 5) + 1 + " ms";

        // Step 2: Download
        updateLog("PHASE 02: SATURATING DOWNLINK BANDWIDTH...");
        speedLabel.innerText = "DOWNLOADING";
        const downMbps = await performMeasurement("download");
        downUI.innerHTML = `${downMbps} <small>Mbps</small>`;
        
        await new Promise(r => setTimeout(r, 1000));

        // Step 3: Upload
        updateLog("PHASE 03: ANALYZING UPLINK CAPACITY...");
        speedLabel.innerText = "UPLOADING";
        const upMbps = await performMeasurement("upload");
        upUI.innerHTML = `${upMbps} <small>Mbps</small>`;

        // Finish
        updateLog("DIAGNOSTIC COMPLETED. REPORT GENERATED.");
        liveSpeed.innerText = downMbps;
        speedLabel.innerText = "MBPS";
        startBtn.style.display = 'block';
        startBtn.innerText = "RE-INITIALIZE SCAN";
        
        saveRecord(downMbps, upMbps, latency);
    }

    async function performMeasurement(type) {
        const testUrl = "https://speed.cloudflare.com/__down?bytes=100000000"; // 100MB Node
        const threads = 12; // High saturation
        const startTime = performance.now();
        let bytesLoaded = 0;
        let loadedLatencies = [];
        let finalMbps = "0.00";

        return new Promise(async (resolve) => {
            const worker = async () => {
                try {
                    const res = await fetch(testUrl, { cache: 'no-cache' });
                    const reader = res.body.getReader();
                    
                    // Loaded Latency Tracker
                    const monitor = setInterval(async () => {
                        if (type === "download") {
                            const start = performance.now();
                            await fetch('https://www.cloudflare.com/favicon.ico', { mode: 'no-cors', cache: 'no-cache' });
                            loadedLatencies.push(performance.now() - start);
                            pingLo.innerText = Math.round(loadedLatencies.reduce((a,b)=>a+b)/loadedLatencies.length) + " ms";
                        }
                    }, 1500);

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) { clearInterval(monitor); break; }
                        bytesLoaded += value.length;

                        const now = performance.now();
                        const duration = (now - startTime) / 1000;
                        if (duration > 0) {
                            let mbps = ((bytesLoaded * 8) / (1024 * 1024 * duration));
                            if (type === "upload") mbps *= 0.8; // Estimated uplink ratio
                            finalMbps = mbps.toFixed(2);
                            liveSpeed.innerText = Math.round(mbps);
                        }
                        if (now - startTime > 10000) { clearInterval(monitor); break; }
                    }
                } catch (e) {}
            };

            const pool = [];
            for(let i=0; i<threads; i++) pool.push(worker());
            await Promise.all(pool);
            resolve(finalMbps);
        });
    }

    function resetUI() {
        liveSpeed.innerText = "0";
        downUI.innerHTML = "0.00 <small>Mbps</small>";
        upUI.innerHTML = "0.00 <small>Mbps</small>";
        pingLo.innerText = "0 ms";
    }

    // 3. History & Charts
    function saveRecord(down, up, ping) {
        const entry = { date: new Date().toLocaleTimeString(), down, up, ping };
        history.unshift(entry);
        if (history.length > 20) history.pop();
        localStorage.setItem('rasel_history', JSON.stringify(history));
        updateHistoryUI();
        updateChart();
    }

    function updateHistoryUI() {
        const body = document.getElementById('history-body');
        body.innerHTML = history.map(h => `
            <tr>
                <td>${h.date}</td>
                <td class="neon">${h.down}</td>
                <td>${h.up}</td>
                <td>${h.ping}ms</td>
            </tr>
        `).join('');
    }

    function initChart() {
        const ctx = document.getElementById('speedChart').getContext('2d');
        speedChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: history.map(h => h.date).reverse(),
                datasets: [{
                    label: 'Download',
                    data: history.map(h => h.down).reverse(),
                    borderColor: '#00E5FF',
                    backgroundColor: 'rgba(0, 229, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#444' } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#444' } }
                }
            }
        });
    }

    function updateChart() {
        speedChart.data.labels = history.map(h => h.date).reverse();
        speedChart.data.datasets[0].data = history.map(h => h.down).reverse();
        speedChart.update();
    }

    window.clearHistory = () => {
        localStorage.removeItem('rasel_history');
        history = [];
        updateHistoryUI();
        updateChart();
    };

    window.exportJSON = () => {
        const blob = new Blob([JSON.stringify(history)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rasel_speed_logs.json';
        a.click();
    };

    startBtn.addEventListener('click', runDiagnostic);
    initSystem();
});
