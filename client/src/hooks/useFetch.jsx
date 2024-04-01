import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useDispatch } from 'react-redux';
import {
  signInStart,
  signInSuccess,
  signInFailure,
  signoutSuccess,
} from '../redux/user/userSlice';

export default function useFetch(url) {
  const [data, setData] = useState();
  const [errorStatus, setErrorStatus] = useState();
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const location = useLocation();

  function appendData(newData = {}) {
    fetch(url, {
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
          window.confirm('Your session has expired. Please log in again.');
          dispatch(signoutSuccess());
        }

        if (!response.ok) {
          throw response.status;
        }

        return response.json();
      })
      .then((d) => {
        const {
          result: { status, response },
        } = d;
        if (url.endsWith('signin')) {
          dispatch(signInStart());
          if (status === 'rejected') {
            dispatch(signInFailure(response));
          }
          dispatch(signInSuccess(response));
          navigate('/');
          return;
        }
        console.log({ res: d.result })
        setData(d.result);
        return d.result;
      })
      .catch((e) => {
        console.log(e);
        setErrorStatus(e);
      });
  }

  return { appendData, data, errorStatus };
}
