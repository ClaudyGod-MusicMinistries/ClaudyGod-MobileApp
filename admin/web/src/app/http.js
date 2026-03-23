import axios from 'axios';
import { API_URL } from './config';

export const http = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'X-Claudy-Client-Platform': 'web',
  },
});
