document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.createElement('button');
    toggleButton.id = 'darkModeToggle';
    toggleButton.innerHTML = '&#9790;'; // Moon icon
    toggleButton.style.position = 'fixed';
    toggleButton.style.top = '10px';
    toggleButton.style.right = '10px';
    toggleButton.style.zIndex = '1000';
    toggleButton.style.border = 'none'; // Remove button border
    toggleButton.style.background = 'none'; // Remove button background
    toggleButton.style.cursor = 'pointer'; // Change cursor to pointer on hover
    toggleButton.style.fontSize = '24px'; // Increase icon size
    toggleButton.style.color = 'black'; // Set icon color

    document.body.insertBefore(toggleButton, document.body.firstChild);

    toggleButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode'));
    });

    if (localStorage.getItem('dark-mode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});
