const fs = require('fs');
const path = require('path');

// Directory path
const directoryPath = path.join(__dirname, '../assets/images/gallery');

// Function to count image files
function countImages() {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                reject('Unable to scan directory: ' + err);
            } else {
                // Filter files to include only .jpeg images
                const imageFiles = files.filter(file => file.match(/image\d+\.jpeg$/));
                resolve(imageFiles.length);
            }
        });
    });
}

// Update the JS file with the total number of images
countImages().then(totalImages => {
    const outputContent = `
// Total images and number of images to display
const totalImages = ${totalImages};
const displayImages = ${totalImages};
const randomNumbers = generateRandomNumbers(totalImages, displayImages);
`;

    fs.writeFile(path.join(__dirname, '../updateImages.js'), outputContent, err => {
        if (err) throw err;
        console.log('The file has been saved with totalImages = ' + totalImages);
    });
}).catch(err => {
    console.error(err);
});
