import { credential, initializeApp } from 'firebase-admin'
import cred from '../genesix-6f119-firebase-adminsdk-oab9q-ed7e039301.json';

initializeApp({
    credential: credential.cert(cred)
});