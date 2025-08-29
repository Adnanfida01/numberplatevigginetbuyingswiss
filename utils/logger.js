function checkStatus() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('valid'); // After 10s, vignette is valid
    }, 10000);
  });
}

module.exports = { checkStatus };
