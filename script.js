document.addEventListener('DOMContentLoaded', () => {

    //logika modal untuk buka modal//
    const openModalButtons = document.querySelectorAll('.detail-button');

    openModalButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();

            const modalId = button.dataset.target;
            const modal = document.querySelector(modalId);

            if(modal) {
                modal.classList.add('show');
            }
        });
    });


    //logika untuk tutup modal//
const closeModalButtons = document.querySelectorAll('.modal-button');

closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');

        if (modal){
            modal.classList.remove('show');
        }
    });
});

    //overlay hitam modal//
const modalOverlays = document.querySelectorAll('.modal-overlay');

modalOverlays.forEach(overlay => {
    overlay.addEventListener('click', () => {
        const modal = overlay.closest('.modal');

        if(modal) {
            modal.classList.remove('show');
        }
    });
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {

        const openModal = document.querySelector('.modal.show');
        if(openModal) {
            openModal.classList.remove('show');
        }
    }
});


//---LOGIKA BATERAI DAN WIFI---//
const batteryItem = document.querySelector('.indikator-item:nth-child(1)');
const batteryIcon = document.getElementById('battery-icon');
const batteryValueText = document.querySelector('.battery-value');
const batteryBars = [
    document.getElementById('battery-bar-1'),
    document.getElementById('battery-bar-2'),
    document.getElementById('battery-bar-3')
];

const wifiIcon = document.getElementById('wifi-icon');
const wifiValueText = document.querySelector('.wiif-value');
const wifiArcs = [
    document.getElementById('wifi-arc-1'),
    document.getElementById('wifi-arc-2'),
    document.getElementById('wifi-arc-3')
];

//update status baterai//
function updateBatteryStatus() {
    //angka acak//
    const level = Math.floor(Math.random() * 101);

    //text persentase//
    batteryValueText.textContent = level + '%';

    //Logika warna baterai//
    batteryItem.classList.remove('battery-status-good', 'battery-status-medium', 'battery-status-low');

    if (level >= 50){
        batteryItem.classList.add('battery-status-good');
    }
    else if (level >= 20){
        batteryItem.classList.add('battery-status-medium');
    }
    else{
        batteryItem.classList.add('battery-status-low')
    }

    //Logika Bar Baterai//
    batteryBars.forEach(bar => bar.style.display = 'none');

    if (level > 66){
        batteryBars.forEach(bar => bar.style.display='block');
    }
    else if (level > 33){
        batteryBars[0].style.display='block';
        batteryBars[1].style.display='block';
    }
    else if (level > 5){
        batteryBars[0].style.display='block';
    }
}

//update status WIFI//
function updateWifiStatus() {
    const ping = Math.floor(Math.random() * 250);

    wifiArcs.forEach(arc => arc.style.display = 'none');

    const blueColor = '#1760fd';
    const yellowColor = '#DEB513';
    const redColor = '#DE1313';

    let statusText = '';
    let statusColor = blueColor;

    if (ping < 50){
        statusText = 'Excellent';
        statusColor = blueColor;
        wifiArcs.forEach(arc => arc.style.display = 'block');
    }
    else if (ping <100){
        statusText = 'Good';
        statusColor = blueColorColor;
        wifiArcs[0].style.display = 'block';
        wifiArcs[1].style.display = 'block';
    }
    else if (ping < 200){
        statusText = 'Fair';
        statusColor = yellowColor;
        wifiArcs[0].style.display = 'block';
    }
    else {
        statusText = 'Poor';
        statusColor = redColor;
    }

    wifiValueText.textContent = statusText;
    wifiValueText.style.color = statusColor;
    wifiIcon.style.fill = statusColor;
}

// MENJALANKAN PEMBARUAN //
function updateAllStatus(){
    updateBatteryStatus();
    updateWifiStatus();
}

// Panggil seklai saat masuk//
updateAllStatus();
//update setia 5detik//
setInterval(updateAllStatus, 5000);

});