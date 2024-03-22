"use strict";

module.exports = () => {
  const error = new Error("Custom error message");
  error.statusCode = 403; // Set the status code
  // Throw the error to trigger the error handling middleware
  throw error;
  return `<h1>Welcome....</h1>`;
};
