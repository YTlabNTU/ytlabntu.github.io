document.querySelectorAll('.media.mb-5').forEach(item => {
    item.addEventListener('mouseover', event => {
        event.currentTarget.querySelector('img').style.filter = 'none';
    });
  
    item.addEventListener('mouseout', event => {
        event.currentTarget.querySelector('img').style.filter = 'grayscale(100%)';
    });
});
