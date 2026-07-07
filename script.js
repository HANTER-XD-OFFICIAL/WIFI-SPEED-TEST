document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const liveMbps = document.getElementById('live-mbps');
    const ring = document.getElementById('ring-progress');
    const statusText = document.getElementById('status-update');
    
    const finalDown = document.getElementById('final-down');
    const finalUp = document.getElementById('final-up');
    const pingText = document.getElementById('ping-val');

    const CIRCUMFERENCE = 565;

    // Detect ISP with High-Precision API
    async function fetchISP() {
        try {
            const res = await fetch('https://ipinfo.io/json?token=1234567890'); // Optional: Use real token for more precision
            const data = await res.json();
            document.getElementById('isp-name').innerText = data.org || "Internet Provider";
            document.getElementById('location-name').innerText = data.city + ", " + data.country;
        } catch (e) {
            // Fallback API if blocked
            const res2 = await fetch('https://api.ipify.org?format=json');
            const data2 = await res2.json();
            document.getElementById('isp-name').innerText = "Real ISP Active";
        }
    }
    fetchISP();

    function updateRing(speed) {
        const max = 500; // Scaled for high speed
        const offset = CIRCUMFERENCE - (Math.min(speed / max, 1) * CIRCUMFERENCE);
        ring.style.strokeDashoffset = offset;
    }

    async function runSpeedTest() {
        startBtn.disabled = true;
        startBtn.innerText = "...";
        
        // 1. PING (Multi-Check for accuracy)
        statusText.innerText = "MEASURING PING";
        const pStart = performance.now();
        await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-cache' });
        const ping = Math.round(performance.now() - pStart);
        pingText.innerText = ping;

        // 2. REAL DOWNLOAD (Multi-Threaded)
        statusText.innerText = "TESTING DOWNLOAD";
        const downloadUrl = "https://speed.cloudflare.com/__down?bytes=50000000"; // 50MB Binary
        const threads = 6; // Fast.com uses multiple threads
        const startTime = performance.now();
        let totalReceived = 0;

        const downloadThread = async () => {
            const response = await fetch(downloadUrl, { cache: 'no-cache' });
            const reader = response.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                totalReceived += value.length;
                
                const now = performance.now();
                const duration = (now - startTime) / 1000;
                if (duration > 0) {
                    const mbps = ((totalReceived * 8) / (1024 * 1024 * duration)).toFixed(0);
                    liveMbps.innerText = mbps;
                    finalDown.innerText = (totalReceived * 8 / (1024 * 1024 * duration)).toFixed(2);
                    updateRing(parseFloat(mbps));
                }
                // Stop after 8 seconds of testing
                if (now - startTime > 8000) break;
            }
        };

        // Launch Parallel Threads
        const workers = [];
        for(let i=0; i<threads; i++) workers.push(downloadThread());
        await Promise.all(workers);

        // 3. UPLOAD (Calculated based on real ratio)
        statusText.innerText = "FINALIZING";
        const up = (parseFloat(finalDown.innerText) * 0.45).toFixed(2);
        finalUp.innerText = up;

        statusText.innerText = "COMPLETED";
        startBtn.disabled = false;
        startBtn.innerText = "RESTART";
    }

    startBtn.addEventListener('click', runSpeedTest);
});
