import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Thông số lấy chính xác từ Firebase Console 
const firebaseConfig = {
    apiKey: "AIzaSyAHr770a6MiK526IR3AV9OxZwcPhRzERWQ",
    authDomain: "toan-9072e.firebaseapp.com",
    projectId: "toan-9072e",
    storageBucket: "toan-9072e.firebasestorage.app",
    messagingSenderId: "953483024959",
    appId: "1:953483024959:web:69ef2ea231d6075c9bf68a",
    measurementId: "G-H4Z61P408Y"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Xuất các dịch vụ cần thiết để sử dụng ở các trang khác
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup };