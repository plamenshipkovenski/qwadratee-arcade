document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('lang-settings-btn');
    const langModal = document.getElementById('lang-modal');
    const closeLang = document.getElementById('close-lang');

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => { langModal.style.display = 'flex'; });
    }
    if (closeLang) {
        closeLang.addEventListener('click', () => { langModal.style.display = 'none'; });
    }

    const qrScanBtn = document.getElementById('qr-scan-btn');
    const scannerModal = document.getElementById('qr-scanner-modal');
    const closeScanner = document.getElementById('close-scanner');

    if (qrScanBtn) {
        qrScanBtn.addEventListener('click', () => { scannerModal.style.display = 'flex'; });
    }
    if (closeScanner) {
        closeScanner.addEventListener('click', () => { scannerModal.style.display = 'none'; });
    }

    window.addEventListener('click', (event) => {
        if (event.target === langModal) langModal.style.display = 'none';
        if (event.target === scannerModal) scannerModal.style.display = 'none';
    });

    const codeInputs = document.querySelectorAll('.code-box-input');

    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            const digit = value.replace(/[^0-9]/g, '').slice(-1);
            e.target.value = digit;

            if (digit && index < codeInputs.length - 1) {
                codeInputs[index + 1].focus();
            }

            checkFullCode();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                codeInputs[index - 1].focus();
            }
        });
    });

    function checkFullCode() {
        let code = '';
        codeInputs.forEach(input => code += input.value);

        if (code.length === 4) {
            if (code === '1001') {
                setTimeout(() => {
                    window.location.href = `game.html?access=granted&code=${code}`;
                }, 300);
            } else {
                setTimeout(() => {
                    alert('Невалиден код! Използвайте ключа за достъп.');
                    codeInputs.forEach(input => input.value = '');
                    codeInputs[0].focus();
                }, 200);
            }
        }
    }
});