console.log("Hello, world!")

document.querySelectorAll('.team-member').forEach(item => {
  item.addEventListener('mouseover', event => {
    event.target.querySelector('img').style.filter = 'none';
  });
  
  item.addEventListener('mouseout', event => {
    event.target.querySelector('img').style.filter = 'grayscale(100%)';
  });
});

