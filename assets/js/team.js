console.log("Hello, world!")

document.querySelectorAll('.team-member').forEach(item => {
  item.addEventListener('mouseover', event => {
    event.target.querySelector('img').classList.remove('grayscale-effect');
    event.target.querySelector('img').classList.add('colorful-effect');
  });
  
  item.addEventListener('mouseout', event => {
    event.target.querySelector('img').classList.remove('colorful-effect');
    event.target.querySelector('img').classList.add('grayscale-effect');
  });
});
