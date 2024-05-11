const extractPath = (inputPath) => {
  const parts = inputPath.split('/');

  if (parts[2] === 'api') {
    const newPath = '/' + parts.slice(2).join('/');
    return newPath;
  } else {
    return "Second parameter is not 'api'";
  }
};

// Example usage:
const originalPath = '/edit/api/post/read';
const extractedPath = extractPath(originalPath);
console.log(extractedPath); // Output: "/api/post/read"
