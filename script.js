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

});