import { MakeRequest } from './makeRequest.jsx';

export function create(params) {
  return MakeRequest('api/post/create', params);
}

export function getPosts(params) {
  return MakeRequest('api/post/getAll', params);
}


