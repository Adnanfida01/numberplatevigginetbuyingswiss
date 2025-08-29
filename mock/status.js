let status = 'pending';

function checkStatus() {
    return new Promise((resolve) => {
        setTimeout(() => {
            status = 'valid';
            resolve(status);
        }, 10000); // 10s delay
    });
}

module.exports = { checkStatus };
