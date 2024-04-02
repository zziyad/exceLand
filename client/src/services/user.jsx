import { MakeRequest } from './makeRequest.jsx';

export function updateUser(params) {
  return MakeRequest('api/user/update', params);
}

export function signin(params) {
  return MakeRequest('api/auth/signin', params);
}

export function signup(params) {
  return MakeRequest('api/auth/register', params);
}

export function signout() {
  return MakeRequest('api/auth/signout');
}
