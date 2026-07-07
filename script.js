document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startBtn = document.getElementById('start-btn');
    const liveSpeedText = document.getElementById('live-speed');
    const speedCircle = document.getElementById('speed-indicator');
    const downloadText = document.getElementById('download-val');
    const uploadText = document.getElementById('upload-val');
    const pingText = document.getElementById('ping-val');
    const jitterText = document.getElementById('jitter-val');
    const statusText = document.getElementById('test-status');

    const CIRCUMFERENCE = 2 * Math.PI * 120; // 753.98

    // --- Background Effects ---
    document.addEventListener('mousemove', (e) => {
        const glow = document.getElementById('mouse-glow');
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });

    // --- Initialization ---
    function init() {
        detectSystem();
        fetchNetworkInfo();
        speedCircle.style.strokeDasharray = CIRCUMFERENCE;
        speedCircle.style.strokeDashoffset = CIRCUMFERENCE;
    }

    function setGauge(value) {
        const maxSpeed = 100;
        const percent = Math.min(value / maxSpeed, 1);
        const offset = CIRCUMFERENCE - (percent * CIRCUMFERENCE);
        speedCircle.style.strokeDashoffset = offset;
    }

    async function detectSystem() {
        document.getElementById('os-info').innerText = navigator.platform;
        document.getElementById('browser-info').innerText = navigator.userAgent.split(' ')[0];
    }

    async function fetchNetworkInfo() {
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            document.getElementById('ip-addr').innerText = data.ip;
            document.getElementById('isp-name').innerText = data.org;
            document.getElementById('location').innerText = `${data.city}, ${data.country_name}`;
        } catch (e) {
            document.getElementById('ip-addr').innerText = "127.0.0.1";
            document.getElementById('isp-name').innerText = "Local/Blocked";
        }
    }

    // --- Speed Test Simulation Logic ---
    async function runTest() {
        startBtn.disabled = true;
        
        // Reset values
        downloadText.innerText = "0.00";
        uploadText.innerText = "0.00";
        pingText.innerText = "0";
        jitterText.innerText = "0";

        // 1. Ping Phase
        statusText.innerText = "MEASURING LATENCY...";
        await sleep(1000);
        let ping = Math.floor(Math.random() * 15) + 12;
        let jitter = Math.floor(Math.random() * 4) + 1;
        pingText.innerText = ping;
        jitterText.innerText = jitter;

        // 2. Download Phase
        statusText.innerText = "TESTING DOWNLOAD SPEED...";
        let targetDown = (Math.random() * 60 + 30).toFixed(2);
        await animateSpeed(targetDown, (val) => {
            liveSpeedText.innerText = val;
            downloadText.innerText = val;
            setGauge(parseFloat(val));
        });

        await sleep(500);

        // 3. Upload Phase
        statusText.innerText = "TESTING UPLOAD SPEED...";
        let targetUp = (targetDown * 0.5 + Math.random() * 5).toFixed(2);
        await animateSpeed(targetUp, (val) => {
            liveSpeedText.innerText = val;
            uploadText.innerText = val;
            setGauge(parseFloat(val));
        });

        // Finalize
        statusText.innerText = "TEST COMPLETE";
        liveSpeedText.innerText = targetDown;
        setGauge(targetDown);
        startBtn.disabled = false;
        startBtn.innerText = "RESTART TEST";
    }

    function animateSpeed(target, callback) {
        return new Promise(resolve => {
            let current = 0;
            let step = target / 50; 
            let interval = setInterval(() => {
                current += step + (Math.random() - 0.5) * 2; // Add jitter
                if (current >= target) {
                    current = target;
                    clearInterval(interval);
                    callback(parseFloat(current).toFixed(2));
                    resolve();
                } else {
                    if (current < 0) current = 0;
                    callback(parseFloat(current).toFixed(2));
                }
            }, 40);
        });
    }

    function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

    startBtn.addEventListener('click', runTest);
    init();
});
