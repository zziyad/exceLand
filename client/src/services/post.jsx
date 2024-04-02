import { MakeRequest } from './makeRequest.jsx';

export function create(params) {
  return MakeRequest('api/post/create', params);
}


