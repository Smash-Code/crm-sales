// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDsX4qOhODRiVPL2vXSs8ox2YFsmlGMkes",
    authDomain: "crm-sales-56417.firebaseapp.com",
    projectId: "crm-sales-56417",
    storageBucket: "crm-sales-56417.firebasestorage.app",
    messagingSenderId: "867531438503",
    appId: "1:867531438503:web:465a4d248e4e2e17265e82"
};

// Initialize Firebase
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export that
export const db = getFirestore(app);