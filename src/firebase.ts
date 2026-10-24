import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAfNOt7VTb05XoRkDEa1cynh9rN0NJkBwo',
  authDomain: 'healthcenter-1.firebaseapp.com',
  projectId: 'healthcenter-1',
  storageBucket: 'healthcenter-1.firebasestorage.app',
  messagingSenderId: '317380098847',
  appId: '1:317380098847:web:3b2dd5c52ff81d19740e2a',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
