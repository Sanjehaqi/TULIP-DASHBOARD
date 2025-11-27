let activeCharts = {}; 

async function buatGrafik(channelId, apiKey, canvasId, fieldName, label, color) {
    const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?results=100&api_key=${apiKey}`;
    if (activeCharts[canvasId]) { activeCharts[canvasId].destroy(); activeCharts[canvasId] = null; }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json();
        
        const labels = data.feeds.map(f => new Date(f.created_at).toLocaleTimeString());
        const values = data.feeds.map(f => parseFloat(f[fieldName]));

        const ctx = document.getElementById(canvasId).getContext('2d');
        activeCharts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.reverse(), 
                datasets: [{
                    label: label, data: values.reverse(), 
                    borderColor: color, borderWidth: 2, fill: false, tension: 0.2 
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { x: { title: { display: true, text: 'Waktu' }}, y: { beginAtZero: false }}
            }
        });
    } catch (e) { console.error(e); }
}

function getStatus(val, type) {
    if (isNaN(val) || val === null) return { text: "N/A", color: "gray" };
    if (type === 'karbon') return val <= 1000 ? {text:"SEHAT", color:"#34d399"} : {text:"BAHAYA", color:"#f43f5e"};
    if (type === 'suhu') return (val >= 20 && val <= 26) ? {text:"NYAMAN", color:"#34d399"} : {text:"NORMAL", color:"#1760fd"};
    if (type === 'radiasi') return val <= 0.2 ? {text:"AMAN", color:"#34d399"} : {text:"BAHAYA", color:"#f43f5e"};
    if (type === 'lembab') return (val >= 30 && val <= 60) ? {text:"IDEAL", color:"#34d399"} : {text:"NORMAL", color:"#1760fd"};
    return { text: "", color: "black" };
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
                if (targetId === '#modal-suhu') buatGrafik(CHANNEL_ID, READ_API_KEY, 'suhuChart', FIELD_SUHU, 'Suhu', '#ff6384');
                if (targetId === '#modal-karbon') buatGrafik(CHANNEL_ID, READ_API_KEY, 'karbonChart', FIELD_KARBON, 'Karbon', '#36a2eb');
                if (targetId === '#modal-radiasi') buatGrafik(CHANNEL_ID, READ_API_KEY, 'radiasiChart', FIELD_RADIASI, 'Radiasi', '#ffcd56');
                if (targetId === '#modal-kelembapan') buatGrafik(CHANNEL_ID, READ_API_KEY, 'kelembapanChart', FIELD_KELEMBAPAN, 'Kelembaban', '#4bc0c0');
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