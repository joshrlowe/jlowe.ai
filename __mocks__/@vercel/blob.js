/**
 * Mock for @vercel/blob
 *
 * Used for testing file upload functionality without making actual API calls.
 */

export const put = jest.fn().mockImplementation((filename, _buffer, _options) => {
  return Promise.resolve({
    url: `https://blob.vercel-storage.com/${filename}`,
    pathname: filename,
  });
});

export default { put };

