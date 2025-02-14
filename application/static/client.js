// Upload form event listener
console.log('client.js');
document
  .getElementById('uploadForm')
  .addEventListener('submit', async (event) => {
    event.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const progressBar = document.getElementById('progress-bar');
    const statusDiv = document.getElementById('status');

    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      // Reset progress bar
      progressBar.style.width = '0%';
      progressBar.textContent = '0%';
      statusDiv.textContent = '';

      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 20;
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${progress}%`;

        if (progress >= 100) {
          clearInterval(progressInterval);

          // Start the upload process immediately
          uploadFile(formData);
        }
      }, 400); // Simulates progress over 2 seconds (5 steps of 400ms)
    } else {
      alert('Please select a file first');
    }
  });

// Function to handle file upload
async function uploadFile(formData) {
  const statusDiv = document.getElementById('status');
  try {
    const response = await fetch('http://localhost:8001/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await response.text();
    console.log('Upload Success:', data);

    // Show the download button after successful upload
    statusDiv.textContent = 'File uploaded successfully!';

    // Ensure the button is appended only after successful upload
    addDownloadButton();
  } catch (error) {
    console.error('Error uploading file:', error);
    statusDiv.textContent = 'Upload failed!';
  }
}

// Function to add the download button
function addDownloadButton() {
  const statusDiv = document.getElementById('status');

  // Check if the download button already exists to avoid duplicates
  let downloadButton = document.getElementById('downloadButton');
  if (!downloadButton) {
    downloadButton = document.createElement('button');
    downloadButton.id = 'downloadButton';
    downloadButton.textContent = 'Download File';
    downloadButton.addEventListener('click', async () => {
      const fileInput = document.getElementById('fileInput');
      // Get the file name from the input
      const fileName = fileInput.files[0].name;
      await downloadFile(fileName);
    });
    statusDiv.appendChild(downloadButton);
  }
}

// Function to handle file download
async function downloadFile(fileName) {
  const statusDiv = document.getElementById('status');
  try {
    const response = await fetch('http://localhost:8001/api/file/download', {
      method: 'POST',
      headers: {
        Accept: 'text/plain',
      },
      body: JSON.stringify({
        id: 1,
        type: 'http',
        method: 'file/download',
        args: { fileName },
      }),
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // a.download = fileName;
    a.setAttribute('download', 'upsell_report.csv');
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    console.error('Error downloading file:', error);
    statusDiv.textContent = 'Download failed!';
  }
}
