document.addEventListener('DOMContentLoaded', function() {
    console.log("Hello, world!");
    
    document.querySelectorAll('.media.mb-5').forEach(item => {
        // item.addEventListener('mouseover', event => {
        //     event.currentTarget.querySelector('img').style.filter = 'none';
        // });
      
        // item.addEventListener('mouseout', event => {
        //     event.currentTarget.querySelector('img').style.filter = 'grayscale(100%)';
        // });

        // make image slightly larger on hover
        item.addEventListener('mouseover', event => {
            event.currentTarget.querySelector('img').style.transform = 'scale(1.05)';
            // make image grayscale on hover
            event.currentTarget.querySelector('img').style.filter = 'grayscale(25%)';
        });

        item.addEventListener('mouseout', event => {
            event.currentTarget.querySelector('img').style.transform = 'scale(1)';
            event.currentTarget.querySelector('img').style.filter = 'none';
        });

    });
});





