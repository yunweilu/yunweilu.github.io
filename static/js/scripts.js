document.addEventListener('DOMContentLoaded', function() {
    const researchText = document.querySelector('.research-text');
    const container = document.querySelector('.research-container');
    const body = document.querySelector('body');
    const zoomInBtn = document.querySelector('.zoom-in');
    const zoomOutBtn = document.querySelector('.zoom-out');
    
    let scale = 2; // Initial scale after animation
    const minScale = 0.3;
    const maxScale = 3;
    let isZoomedOut = false;

    // Reset transform on page load
    container.style.transform = '';

    // Navigation event listener for research text (only when not zoomed out)
    if (researchText) {
        researchText.addEventListener('click', function(event) {
            if (!isZoomedOut) {
                window.location.href = '/research.html';
            }
            event.stopPropagation(); // Prevent click from reaching body
        });
    }

    // Zoom in button - instant zoom in
    zoomInBtn.addEventListener('click', function(event) {
        scale = maxScale;
        container.style.transform = `scale(${scale})`;
        body.classList.remove('zoomed-out');
        isZoomedOut = false;
        event.stopPropagation(); // Prevent click from reaching body
    });

    // Zoom out button - instant zoom out
    zoomOutBtn.addEventListener('click', function(event) {
        scale = minScale;
        container.style.transform = `scale(${scale})`;
        body.classList.add('zoomed-out');
        isZoomedOut = true;
        event.stopPropagation(); // Prevent click from reaching body
    });

    // Click anywhere when zoomed out to go to life page
    body.addEventListener('click', function(event) {
        if (isZoomedOut && !zoomInBtn.contains(event.target) && !zoomOutBtn.contains(event.target)) {
            window.location.href = '/life.html';
        }
    });

    // Wait for initial animation to complete
    setTimeout(() => {
        container.classList.add('animation-complete');
    }, 3100);
});
