const CHANNEL_ID = '3182232';        
const READ_API_KEY = 'Q4EK1PMPN150NY25'; 

const SENSORS = {
    radiasi: { 
        field: 'field1', unit: 'μSv/h', title: 'Level Radiasi', color: 'rgba(255, 206, 86, 1)', 
        sensorName: 'Geiger Counter', statusType: 'radiasi' 
    },
    karbon: { 
        field: 'field2', unit: 'ppm', title: 'Kadar Karbon', color: 'rgba(54, 162, 235, 1)', 
        sensorName: 'MQ-7 (CO)', statusType: 'karbon' 
    },
    suhu: { 
        field: 'field3', unit: '°C', title: 'Suhu Lingkungan', color: 'rgba(255, 99, 132, 1)', 
        sensorName: 'DHT22', statusType: 'suhu' 
    },
    kelembapan: { 
        field: 'field4', unit: '%', title: 'Kelembapan', color: 'rgba(75, 192, 192, 1)', 
        sensorName: 'DHT22', statusType: 'lembab' 
    }
};

let activeChart = null; 
let currentSensorType = null; 

// --- HELPER FORMAT TANGGAL (PENTING AGAR TIDAK ERROR DI SERVER) ---
function formatDateKey(dateObj) {
    // Menghasilkan string "1/12/2025" yang konsisten di semua browser
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1; // Bulan mulai dari 0
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
}

// 1. FUNGSI NAVIGASI
function switchView(viewName) {
    const home = document.getElementById('home-view');
    const detail = document.getElementById('detail-view');

    if (viewName === 'detail') {
        home.classList.add('hidden');
        detail.classList.remove('hidden');
        window.scrollTo(0,0);
    } else {
        home.classList.remove('hidden');
        detail.classList.add('hidden');
    }
}

// 2. STATUS CHECKER
function getStatus(val, type) {
    if (isNaN(val) || val === null) return { text: "N/A", color: "gray" };
    
    if (type === 'karbon') {
        if (val <= 1000) return { text: "AMAN", color: "#34d399" };
        if (val <= 2000) return { text: "WASPADA", color: "#facc15" };
        return { text: "BAHAYA", color: "#f43f5e" };
    }
    if (type === 'suhu') {
        if (val >= 20 && val <= 26) return { text: "NYAMAN", color: "#34d399" };
        if (val > 26 && val <= 30) return { text: "HANGAT", color: "#facc15" };
        return { text: "PANAS", color: "#f43f5e" };
    }
    if (type === 'radiasi') {
        if (val <= 0.2) return { text: "NORMAL", color: "#34d399" };
        return { text: "BAHAYA", color: "#f43f5e" };
    }
    if (type === 'lembab') {
        if (val >= 30 && val <= 60) return { text: "IDEAL", color: "#34d399" };
        return { text: "NORMAL", color: "#1760fd" };
    }
    return { text: "Info", color: "black" };
}

// 3. LOGIKA CHART
async function loadChart(type, range) {
    if (!type || !SENSORS[type]) return;

    const sensor = SENSORS[type];
    const canvas = document.getElementById('detailChart');
    if (!canvas) return; // Mencegah error jika canvas belum siap

    const ctx = canvas.getContext('2d');
    
    // Matikan chart lama jika ada
    if (activeChart) { 
        activeChart.destroy(); 
        activeChart = null;
    }

    let url = '';
    if (range === 'week') {
        url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?days=7&api_key=${READ_API_KEY}`;
    } else {
        url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=60&api_key=${READ_API_KEY}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        const feeds = data.feeds;

        let labels = [];
        let values = [];
        let chartType = 'bar'; // Default line untuk harian

        if (range === 'week') {
            chartType = 'bar';
            const dailyDataMap = {};
            
            feeds.forEach(feed => {
                const dateObj = new Date(feed.created_at);
                const dateKey = formatDateKey(dateObj); // Pakai helper function
                const val = parseFloat(feed[sensor.field]);
                
                if (!isNaN(val)) {
                    if (!dailyDataMap[dateKey]) {
                        dailyDataMap[dateKey] = { sum: 0, count: 0 };
                    }
                    dailyDataMap[dateKey].sum += val;
                    dailyDataMap[dateKey].count += 1;
                }
            });

            // Loop 7 hari terakhir
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                
                const dateKey = formatDateKey(d);
                // Label hari dalam Bahasa Indonesia
                const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'long' });

                labels.push(dayLabel);

                if (dailyDataMap[dateKey]) {
                    const avg = dailyDataMap[dateKey].sum / dailyDataMap[dateKey].count;
                    values.push(avg.toFixed(2));
                } else {
                    values.push(0);
                }
            }

        } else {
            // Harian (Line Chart)
            chartType = 'bar';
            labels = feeds.map(f => {
                const date = new Date(f.created_at);
                return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
            });
            values = feeds.map(f => parseFloat(f[sensor.field]));
        }

        // Hitung Rata-rata Total
        const validValuesTotal = feeds.map(f => parseFloat(f[sensor.field])).filter(v => !isNaN(v));
        const avgTotal = validValuesTotal.length ? (validValuesTotal.reduce((a, b) => a + b, 0) / validValuesTotal.length) : 0;
        document.getElementById('detail-avg').textContent = avgTotal.toFixed(2) + ' ' + sensor.unit;

        activeChart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: sensor.title,
                    data: values,
                    backgroundColor: range === 'week' ? sensor.color : sensor.color.replace('1)', '0.2)'),
                    borderColor: sensor.color,
                    borderWidth: 2,
                    fill: (range === 'day'), 
                    tension: 0.3,
                    borderRadius: range === 'week' ? 5 : 0 
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { maxTicksLimit: 8 } },
                    y: { beginAtZero: false }
                }
            }
        });

    } catch (error) {
        console.error("Gagal load chart:", error);
    }
}

// 4. OPEN DETAIL
function openDetail(type) {
    currentSensorType = type;
    const sensor = SENSORS[type];
    
    document.getElementById('detail-title-text').textContent = sensor.title;
    document.getElementById('detail-sensor-type').textContent = sensor.sensorName;

    const classMapping = {
        'radiasi': 'card-radiation',
        'karbon': 'card-carbon',
        'suhu': 'card-temperature',
        'kelembapan': 'card-humidity'
    };

    const targetClass = classMapping[type];
    const cardEl = document.querySelector(`.${targetClass}`);
    
    let cardValue = "--";
    if (cardEl) {
        const valEl = cardEl.querySelector('.card-value');
        if (valEl) cardValue = valEl.textContent;
    }
    
    document.getElementById('detail-value-big').textContent = cardValue;

    // Reset tombol filter
    document.querySelectorAll('.chart-toggle').forEach(b => b.classList.remove('active'));
    document.querySelector('.chart-toggle[data-range="day"]').classList.add('active');

    // Update Status Badge
    const rawVal = parseFloat(cardValue); 
    const status = getStatus(rawVal, sensor.statusType);
    const badge = document.getElementById('detail-status-badge');
    badge.textContent = status.text;
    badge.style.backgroundColor = status.color;

    switchView('detail');
    loadChart(type, 'day');
}

// 5. UPDATE DASHBOARD UTAMA
async function updateDashboard() {
    try {
        // Ambil hanya 1 data terakhir untuk dashboard
        const res = await fetch(`https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=1&api_key=${READ_API_KEY}`);
        const json = await res.json();
        
        // Cek apakah ada data
        if (!json.feeds || json.feeds.length === 0) return;
        
        const d = json.feeds[0];
        
        const updateCard = (cls, field, type) => {
            const val = parseFloat(d[field]);
            const card = document.querySelector('.' + cls);
            if (card) {
                const elVal = card.querySelector('.card-value');
                const decimals = (type === 'radiasi') ? 3 : 1;
                elVal.textContent = isNaN(val) ? "N/A" : val.toFixed(decimals) + " " + SENSORS[type].unit;
            }
        };

        updateCard('card-radiation', SENSORS.radiasi.field, 'radiasi');
        updateCard('card-carbon', SENSORS.karbon.field, 'karbon');
        updateCard('card-temperature', SENSORS.suhu.field, 'suhu');
        updateCard('card-humidity', SENSORS.kelembapan.field, 'kelembapan');

        // Update Battery & Signal
        const batt = parseFloat(d['field5']);
        const rssi = parseFloat(d['field6']);
        const lat = d['field7'];
        
        const bVal = isNaN(batt) ? 0 : Math.min(100, Math.max(0, batt));
        const elBat = document.querySelector('.battery-value');
        if(elBat) elBat.textContent = bVal.toFixed(0) + "%";

        const rVal = isNaN(rssi) ? -120 : rssi;
        const wifiVal = document.querySelector('.wifi-value');
        const wifiIcon = document.getElementById('wifi-icon');
        
        if (wifiVal && wifiIcon) {
            if (rVal > -70) { 
                wifiVal.textContent="Excellent"; wifiVal.style.color="#1760fd"; wifiIcon.style.fill="#1760fd"; 
            } else if (rVal > -90) { 
                wifiVal.textContent="Good"; wifiVal.style.color="#1760fd"; wifiIcon.style.fill="#1760fd"; 
            } else { 
                wifiVal.textContent="Weak"; wifiVal.style.color="#facc15"; wifiIcon.style.fill="#facc15"; 
            }
        }

        // GPS Link
        const gpsVal = document.querySelector('.gps-value');
        const mapLink = document.getElementById('map-link');
        
        if (lat && lat !== "N/A" && lat !== "0") {
             if(gpsVal) gpsVal.textContent = parseFloat(lat).toFixed(4);
             // Update link Google Maps jika ada koordinat (misal field7=lat, field8=long)
             // Di sini asumsi field7 adalah Lat, field8 mungkin Long (sesuaikan jika perlu)
             // Jika hanya ada 1 data lat, mapLink tetap aktif
             if(mapLink) mapLink.href = `https://www.google.com/maps?q=${lat}`;
        } else {
             if(gpsVal) gpsVal.textContent = "No Signal";
        }

    } catch (e) { 
        console.error("Dashboard update error:", e); 
    }
}

// 6. INISIALISASI
document.addEventListener('DOMContentLoaded', () => {
    
    // Listener Tombol Detail
    document.querySelectorAll('.detail-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // Mencegah scroll ke atas
            e.stopPropagation(); // Mencegah double click
            const type = btn.dataset.type; 
            if(type) openDetail(type);
        });
    });

    // Listener Tombol Kembali
    const btnBack = document.getElementById('btn-kembali');
    if(btnBack) {
        btnBack.addEventListener('click', () => {
            switchView('home');
        });
    }

    // Listener Toggle Chart (Hari/Minggu)
    document.querySelectorAll('.chart-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chart-toggle').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const range = e.target.dataset.range; 
            if (currentSensorType) {
                loadChart(currentSensorType, range);
            }
        });
    });

    // Jalankan pertama kali
    updateDashboard();
    
    // Auto update tiap 15 detik
    setInterval(updateDashboard, 15000);
});