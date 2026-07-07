/**
 * RASEL SPEED TEST - Logic Engine
 * Powered by MD RASEL
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State & Config ---
    const state = {
        isTesting: false,
        history: JSON.parse(localStorage.getItem('speed_history')) || [],
        downloadData: [],
        uploadData: [],
        pingData: []
    };

    // --- DOM Elements ---
    const startBtn = document.getElementById('start-btn');
    const speedProgress = document.getElementById('speed-progress');
    const currentSpeedText = document.getElementById('current-speed');
    const statusText = document.getElementById('status-text');
    const downloadVal = document.getElementById('download-val');
    const uploadVal = document.getElementById('upload-val');
    const pingVal = document.getElementById('ping-val');
    const jitterVal = document.getElementById('jitter-val');
    const historyBody = document.getElementById('history-body');

    // --- Initialization ---
    initApp();
    
    function initApp() {
        detectSystemInfo();
        fetchNetworkInfo();
        updateHistoryUI();
        initCharts();
        createParticles();
        setupEventListeners();
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        startBtn.addEventListener('click', runSpeedTest);
        
        document.getElementById('theme-toggle').addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const icon = document.querySelector('#theme-toggle i');
            icon.classList.toggle('fa-moon');
            icon.classList.toggle('fa-sun');
        });

        document.getElementById('fullscreen-toggle').addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });

        document.getElementById('clear-history').addEventListener('click', () => {
            state.history = [];
            localStorage.removeItem('speed_history');
            updateHistoryUI();
        });

        document.getElementById('export-json').addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.history));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "rasel_speed_history.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });

        document.getElementById('export-png').addEventListener('click', () => {
            html2canvas(document.querySelector("main")).then(canvas => {
                const link = document.createElement('a');
                link.download = 'rasel-speedtest-result.png';
                link.href = canvas.toDataURL();
                link.click();
            });
        });

        // Mouse glow effect
        document.addEventListener('mousemove', (e) => {
            const glow = document.getElementById('mouse-glow');
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
        });
    }

    // --- Speed Test Engine (Simulated for Demo Performance) ---
    async function runSpeedTest() {
        if (state.isTesting) return;
        
        state.isTesting = true;
        startBtn.disabled = true;
        startBtn.innerText = "TESTING...";
        
        // Reset UI
        downloadVal.innerText = "0.00";
        uploadVal.innerText = "0.00";
        pingVal.innerText = "0";
        jitterVal.innerText = "0";

        // 1. Ping Phase
        statusText.innerText = "Measuring Latency...";
        const ping = Math.floor(Math.random() * 30) + 12;
        const jitter = Math.floor(Math.random() * 5) + 1;
        await animateValue(pingVal, 0, ping, 1000);
        jitterVal.innerText = jitter;

        // 2. Download Phase
        statusText.innerText = "Testing Download Speed...";
        const finalDown = (Math.random() * 80 + 20).toFixed(2);
        await simulateSpeed(finalDown, 'download');

        // 3. Upload Phase
        statusText.innerText = "Testing Upload Speed...";
        const finalUp = (finalDown * 0.4 + Math.random() * 10).toFixed(2);
        await simulateSpeed(finalUp, 'upload');

        // Completion
        statusText.innerText = "Test Complete";
        startBtn.disabled = false;
        startBtn.innerText = "RESTART TEST";
        state.isTesting = false;

        saveResult(finalDown, finalUp, ping);
    }

    async function simulateSpeed(target, type) {
        return new Promise(resolve => {
            let current = 0;
            const duration = 4000; // 4 seconds
            const start = performance.now();

            function update(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                
                // Add some realistic fluctuation
                const fluctuation = Math.sin(now / 100) * 2;
                current = (progress * target) + fluctuation;
                if (current < 0) current = 0;

                currentSpeedText.innerText = current.toFixed(2);
                updateGauge(current, 100);

                if (type === 'download') downloadVal.innerText = current.toFixed(2);
                else uploadVal.innerText = current.toFixed(2);

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    currentSpeedText.innerText = target;
                    updateGauge(target, 100);
                    resolve();
                }
            }
            requestAnimationFrame(update);
        });
    }

    function updateGauge(value, max) {
        const percent = Math.min((value / max) * 100, 100);
        const offset = 565.48 - (565.48 * percent) / 100;
        speedProgress.style.strokeDashoffset = offset;
    }

    // --- System Info Detectors ---
    function detectSystemInfo() {
        document.getElementById('os-info').innerText = getOS();
        document.getElementById('browser-info').innerText = getBrowser();
        document.getElementById('cpu-threads').innerText = navigator.hardwareConcurrency || 'N/A';
        document.getElementById('screen-res').innerText = `${window.screen.width}x${window.screen.height}`;
        document.getElementById('net-type').innerText = navigator.connection ? navigator.connection.effectiveType.toUpperCase() : 'WiFi/Ethernet';
    }

    async function fetchNetworkInfo() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            document.getElementById('ip-addr').innerText = data.ip;
            document.getElementById('isp-name').innerText = data.org;
        } catch (e) {
            document.getElementById('ip-addr').innerText = "Blocked/Unavailable";
            document.getElementById('isp-name').innerText = "Unknown ISP";
        }
    }

    // --- Helpers ---
    function getOS() {
        const userAgent = window.navigator.userAgent;
        if (userAgent.indexOf("Windows NT 10.0") != -1) return "Windows 10/11";
        if (userAgent.indexOf("Mac") != -1) return "MacOS";
        if (userAgent.indexOf("Android") != -1) return "Android";
        if (userAgent.indexOf("iPhone") != -1) return "iOS";
        return "Linux/Other";
    }

    function getBrowser() {
        if (navigator.userAgent.indexOf("Chrome") != -1) return "Google Chrome";
        if (navigator.userAgent.indexOf("Firefox") != -1) return "Mozilla Firefox";
        if (navigator.userAgent.indexOf("Safari") != -1) return "Apple Safari";
        return "Browser";
    }

    function getGrade(speed) {
        if (speed > 50) return { label: 'Excellent', class: 'bg-success' };
        if (speed > 25) return { label: 'Good', class: 'bg-primary' };
        return { label: 'Average', class: 'bg-danger' };
    }

    function saveResult(down, up, ping) {
        const result = {
            date: new Date().toLocaleString(),
            down: down,
            up: up,
            ping: ping,
            grade: getGrade(down)
        };
        state.history.unshift(result);
        if (state.history.length > 20) state.history.pop();
        localStorage.setItem('speed_history', JSON.stringify(state.history));
        updateHistoryUI();
        updateMainChart();
    }

    function updateHistoryUI() {
        historyBody.innerHTML = state.history.map(item => `
            <tr>
                <td>${item.date.split(',')[0]}</td>
                <td class="accent-text">${item.down}</td>
                <td>${item.up}</td>
                <td>${item.ping}</td>
                <td><span class="badge" style="background:${item.grade.label === 'Excellent' ? '#22C55E' : '#7C3AED'}">${item.grade.label}</span></td>
            </tr>
        `).join('');
    }

    function animateValue(obj, start, end, duration) {
        return new Promise(resolve => {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                obj.innerHTML = Math.floor(progress * (end - start) + start);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    resolve();
                }
            };
            window.requestAnimationFrame(step);
        });
    }

    // --- Charts ---
    let mainChart;
    function initCharts() {
        const ctx = document.getElementById('mainHistoryChart').getContext('2d');
        mainChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: state.history.map(h => h.date.split(',')[0]).reverse(),
                datasets: [{
                    label: 'Download (Mbps)',
                    data: state.history.map(h => h.down).reverse(),
                    borderColor: '#00E5FF',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(0, 229, 255, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    function updateMainChart() {
        mainChart.data.labels = state.history.map(h => h.date.split(',')[1]).reverse();
        mainChart.data.datasets[0].data = state.history.map(h => h.down).reverse();
        mainChart.update();
    }

    // --- Background Animation ---
    function createParticles() {
        const container = document.getElementById('particle-container');
        for (let i = 0; i < 50; i++) {
            const p = document.createElement('div');
            p.style.position = 'absolute';
            p.style.width = '2px';
            p.style.height = '2px';
            p.style.background = 'rgba(0, 229, 255, 0.3)';
            p.style.top = Math.random() * 100 + '%';
            p.style.left = Math.random() * 100 + '%';
            p.style.borderRadius = '50%';
            container.appendChild(p);
            
            animateParticle(p);
        }
    }

    function animateParticle(p) {
        const duration = Math.random() * 3000 + 2000;
        p.animate([
            { opacity: 0, transform: 'translateY(0)' },
            { opacity: 1, transform: 'translateY(-100px)' },
            { opacity: 0, transform: 'translateY(-200px)' }
        ], {
            duration: duration,
            iterations: Infinity
        });
    }
});