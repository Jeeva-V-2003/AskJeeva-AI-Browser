document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('video-upload-form');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();  // Prevent page reload

        const formData = new FormData();
        const videoInput = document.getElementById('video-input').files[0];

        if (!videoInput) {
            alert('Please select a video to upload.');
            return;
        }

        formData.append('video', videoInput);

        try {
            const response = await fetch('http://localhost:3000/analyze-video', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload video');
            }

            const result = await response.json();

            // ✅ Display the summary in the UI
            const summaryContainer = document.getElementById('video-summary');
            summaryContainer.innerHTML = `<p><strong>Summary:</strong> ${result.summary}</p>`;
            summaryContainer.style.display = 'block';

            console.log('Video analysis complete:', result.summary);

            // ✅ Fetch similar videos directly on YouTube
            fetchSimilarVideosOnYouTube(result.summary);

        } catch (error) {
            console.error('Error:', error);
            alert('Error processing video');
        }
    });
});

// ✅ Directly search on YouTube
function fetchSimilarVideosOnYouTube(summary) {
    const searchQuery = summary.split('.').slice(0, 2).join(' ');  // Use first 2 sentences for search
    console.log(`Redirecting to YouTube with query: ${searchQuery}`);

    // ✅ Open YouTube search results in a new tab
    const youtubeSearchURL = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    window.open(youtubeSearchURL, '_blank');
}
