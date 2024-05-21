<script>
    document.addEventListener('DOMContentLoaded', function() {
        const toggleButton = document.createElement('button');
        toggleButton.id = 'darkModeToggle';
        toggleButton.innerText = 'Toggle Dark Mode';
        document.body.insertBefore(toggleButton, document.body.firstChild);

        toggleButton.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
        });

        let slideIndex = 0;
        let isPaused = false;
        let slideInterval;

        function generateRandomNumbers(total, count) {
            let numbers = new Set();
            while (numbers.size < count) {
                numbers.add(Math.floor(Math.random() * total) + 1);
            }
            return Array.from(numbers);
        }

        const totalImages = 79;
        const displayImages = 40;
        const randomNumbers = generateRandomNumbers(totalImages, displayImages);

        const container = document.getElementById('slideshow-container');
        
        randomNumbers.forEach(num => {
            const slide = document.createElement('div');
            slide.classList.add('mySlides');
            
            const img = document.createElement('img');
            img.src = `/assets/images/gallery/image${num}.jpeg`;
            img.alt = `Slide ${num}`;
            
            slide.appendChild(img);
            container.appendChild(slide);
        });

        function showSlides(n) {
            const slides = document.getElementsByClassName('mySlides');
            if (n >= slides.length) { slideIndex = 0; }
            if (n < 0) { slideIndex = slides.length - 1; }
            for (let i = 0; i < slides.length; i++) {
                slides[i].style.display = 'none';
            }
            slides[slideIndex].style.display = 'flex';
        }

        function plusSlides(n) {
            showSlides(slideIndex += n);
        }

        function autoAdvanceSlides() {
            if (!isPaused) {
                slideIndex++;
                showSlides(slideIndex);
            }
        }

        function togglePause() {
            isPaused = !isPaused;
        }

        document.getElementById('slideshow-container').addEventListener('click', togglePause);

        slideInterval = setInterval(autoAdvanceSlides, 3000);
        showSlides(slideIndex);
    });
</script>
