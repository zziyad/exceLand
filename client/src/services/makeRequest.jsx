import { v4 as uuidv4 } from 'uuid';

export function MakeRequest(url, newData = {}) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: uuidv4(),
      type: 'call',
      method: url.split('api/')[1],
      args: newData,
    }),
  })
    .then((response) => {
      if (response.status === 401) {
        throw new Error('Expire Token');
      }
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      const {
        result: { status, response },
      } = data;

      if (status === 'rejected') {
        throw new Error(response);
      }
      return response;
    })
    .catch((error) => {
      throw new Error(error.message ?? 'Error');
    });
}
