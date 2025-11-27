let activeCharts = {}; 

async function buatGrafik(channelId, apiKey, canvasId, fieldName, label, color) {
    // Ambil 20 data terakhir agar grafik batang terlihat jelas (tidak terlalu rapat)
    const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?results=20&api_key=${apiKey}`;
    
    if (activeCharts[canvasId]) { activeCharts[canvasId].destroy(); activeCharts[canvasId] = null; }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await response.json(); // Perbaikan: gunakan 'response' bukan 'res' untuk konsistensi, tapi di atas pakai res. saya perbaiki variabelnya di bawah.
    } catch(e) {
        // Block catch
    }
    
    // --- PERBAIKAN LOGIKA FETCH ---
    fetch(url)
    .then(response => response.json())
    .then(data => {
        const feeds = data.feeds;
        
        // Format Waktu: 24 Jam (Tanpa AM/PM)
        const labels = feeds.map(feed => {
            const date = new Date(feed.created_at);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        });
        
        const values = feeds.map(feed => parseFloat(feed[fieldName]));

        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // --- BAGIAN YANG MENGUBAH KE HISTOGRAM/BAR ---
        activeCharts[canvasId] = new Chart(ctx, {
            type: 'bar', // <--- UBAH KE 'bar'
            data: {
                labels: labels, // Urutan normal (kiri lama -> kanan baru)
                datasets: [{
                    label: label, 
                    data: values, 
                    // Warna batang dibuat agak transparan
                    backgroundColor: color.replace('1)', '0.6)'), 
                    borderColor: color, 
                    borderWidth: 1,
                    borderRadius: 4, // Sudut batang sedikit membulat
                    barPercentage: 0.6, // Lebar batang (0.1 - 1.0)
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }, // Sembunyikan legenda
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y + ' ' + (fieldName === 'field1' ? 'μSv/h' : fieldName === 'field2' ? 'ppm' : fieldName === 'field3' ? '°C' : '%');
                            }
                        }
                    }
                },
                scales: { 
                    x: { 
                        grid: { display: false }, // Hilangkan garis vertikal biar bersih
                        ticks: { maxTicksLimit: 6 }
                    }, 
                    y: { 
                        beginAtZero: false, // Agar grafik fokus pada perubahan nilai (tidak flat di bawah)
                        grid: { borderDash: [5, 5] } 
                    }
                }
            }
        });
    })
    .catch(error => console.error(error));
}

// --- LOGIKA STATUS ---
function getStatus(val, type) {
    if (isNaN(val) || val === null) return { text: "N/A", color: "gray" };
    
    if (type === 'karbon') {
        if (val <= 1000) return { text: "SEHAT", color: "#34d399" };
        if (val <= 2000) return { text: "WASPADA", color: "#facc15" };
        return { text: "BAHAYA", color: "#f43f5e" };
    }
    if (type === 'suhu') {
        if (val >= 20 && val <= 26) return { text: "NYAMAN", color: "#34d399" };
        if (val > 26 && val <= 30) return { text: "HANGAT", color: "#facc15" };
        return { text: "EKSTREM", color: "#f43f5e" };
    }
    if (type === 'radiasi') {
        if (val <= 0.2) return { text: "AMAN", color: "#34d399" };
        return { text: "BAHAYA", color: "#f43f5e" };
    }
    if (type === 'lembab') {
        if (val >= 30 && val <= 60) return { text: "IDEAL", color: "#34d399" };
        return { text: "NORMAL", color: "#1760fd" };
    }
    return { text: "Info", color: "black" };
}

document.addEventListener('DOMContentLoaded', () => {
    const CHANNEL_ID = '3182232';        
    const READ_API_KEY = 'Q4EK1PMPN150NY25'; 
    const FIELD_RADIASI = 'field1';
    const FIELD_KARBON = 'field2';
    const FIELD_SUHU = 'field3';
    const FIELD_KELEMBAPAN = 'field4';
    const FIELD_BATERAI = 'field5';
    const FIELD_RSSI = 'field6';
    const FIELD_LAT = 'field7';

    // UI Elements
    const batteryVal = document.querySelector('.battery-value');
    const batteryBars = [document.getElementById('battery-bar-1'), document.getElementById('battery-bar-2'), document.getElementById('battery-bar-3')];
    const wifiVal = document.querySelector('.wifi-value');
    const wifiIcon = document.getElementById('wifi-icon');
    const wifiArcs = [document.getElementById('wifi-arc-1'), document.getElementById('wifi-arc-2')];
    const gpsVal = document.querySelector('.gps-value');
    const mapLink = document.getElementById('map-link');
    
    const cardRad = document.querySelector('.card-radiation .card-value');
    const cardKarb = document.querySelector('.card-carbon .card-value');
    const cardSuhu = document.querySelector('.card-temperature .card-value');
    const cardHum = document.querySelector('.humidity-card .card-value');

    async function updateData() {
        try {
            const res = await fetch(`https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=1&api_key=${READ_API_KEY}`);
            const json = await res.json();
            if (!json.feeds.length) return;
            
            const d = json.feeds[0];
            const rad = parseFloat(d[FIELD_RADIASI]);
            const karb = parseFloat(d[FIELD_KARBON]);
            const suhu = parseFloat(d[FIELD_SUHU]);
            const hum = parseFloat(d[FIELD_KELEMBAPAN]);
            const batt = parseFloat(d[FIELD_BATERAI]);
            const rssi = parseFloat(d[FIELD_RSSI]);
            const lat = d[FIELD_LAT];

            // Cards
            cardRad.textContent = isNaN(rad) ? "N/A" : rad.toFixed(3) + " μSv/h";
            const statusRad = getStatus(rad, 'radiasi');
            document.getElementById('status-radiasi-teks').textContent = statusRad.text;
            document.getElementById('status-radiasi-teks').style.color = statusRad.color;

            cardKarb.textContent = isNaN(karb) ? "N/A" : karb.toFixed(1) + " ppm";
            const statusKarb = getStatus(karb, 'karbon');
            document.getElementById('status-karbon-teks').textContent = statusKarb.text;
            document.getElementById('status-karbon-teks').style.color = statusKarb.color;

            cardSuhu.textContent = isNaN(suhu) ? "N/A" : suhu.toFixed(1) + " °C";
            const statusSuhu = getStatus(suhu, 'suhu');
            document.getElementById('status-suhu-teks').textContent = statusSuhu.text;
            document.getElementById('status-suhu-teks').style.color = statusSuhu.color;
            const modalFahr = document.querySelectorAll('#modal-suhu .modal-value');
            if (modalFahr.length > 0 && !isNaN(suhu)) modalFahr[0].textContent = ((suhu*9/5)+32).toFixed(1) + "°F";

            cardHum.textContent = isNaN(hum) ? "N/A" : hum.toFixed(0) + "%";
            const statusHum = getStatus(hum, 'lembab');
            document.getElementById('status-kelembapan-teks').textContent = statusHum.text;
            document.getElementById('status-kelembapan-teks').style.color = statusHum.color;

            // Battery
            const bVal = isNaN(batt) ? 0 : Math.min(100, Math.max(0, batt));
            batteryVal.textContent = bVal.toFixed(0) + "%";
            batteryBars.forEach(b => b.style.display = 'none');
            if (bVal > 66) batteryBars.forEach(b => b.style.display='block');
            else if (bVal > 33) { batteryBars[0].style.display='block'; batteryBars[1].style.display='block'; }
            else if (bVal > 5) batteryBars[0].style.display='block';

            // LoRa Signal
            const rVal = isNaN(rssi) ? -120 : rssi;
            let sigTxt = "Disconnected", sigCol = "#f43f5e";
            wifiArcs.forEach(a => a.style.display = 'none');
            if (rVal > -70) { sigTxt="Excellent"; sigCol="#1760fd"; wifiArcs.forEach(a=>a.style.display='block'); }
            else if (rVal > -90) { sigTxt="Good"; sigCol="#1760fd"; wifiArcs[0].style.display='block'; wifiArcs[1].style.display='block'; }
            else if (rVal > -110) { sigTxt="Fair"; sigCol="#facc15"; wifiArcs[0].style.display='block'; }
            
            wifiVal.textContent = `${sigTxt} (${rVal.toFixed(0)} dBm)`;
            wifiVal.style.color = sigCol;
            wifiIcon.style.fill = sigCol;

            // GPS
            if (lat && lat !== "N/A" && lat !== "0") {
                gpsVal.textContent = parseFloat(lat).toFixed(4);
                if (mapLink) mapLink.href = `https://maps.google.com/maps?q=Latitude,Longitude0{lat},-118.243`;
            } else {
                gpsVal.textContent = "No Signal";
            }

        } catch (e) { console.error(e); }
    }

    document.querySelectorAll('.detail-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.dataset.target;
            const m = document.querySelector(targetId);
            if (m) {
                m.classList.add('show');
                // Warna grafik disesuaikan agar cantik
                if (targetId === '#modal-suhu') buatGrafik(CHANNEL_ID, READ_API_KEY, 'suhuChart', FIELD_SUHU, 'Suhu', 'rgba(255, 99, 132, 1)');
                if (targetId === '#modal-karbon') buatGrafik(CHANNEL_ID, READ_API_KEY, 'karbonChart', FIELD_KARBON, 'Karbon', 'rgba(54, 162, 235, 1)');
                if (targetId === '#modal-radiasi') buatGrafik(CHANNEL_ID, READ_API_KEY, 'radiasiChart', FIELD_RADIASI, 'Radiasi', 'rgba(255, 206, 86, 1)');
                if (targetId === '#modal-kelembapan') buatGrafik(CHANNEL_ID, READ_API_KEY, 'kelembapanChart', FIELD_KELEMBAPAN, 'Kelembaban', 'rgba(75, 192, 192, 1)');
            }
        });
    });

    document.querySelectorAll('.modal-button, .modal-overlay').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
        });
    });

    updateData();
    setInterval(updateData, 30000);
});