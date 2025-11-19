// firebaseConfig.ts
import { initializeApp } from 'firebase/app';

// --- PASTE YOUR FIREBASE CONFIGURATION HERE ---
// You can get this from your Firebase project settings.
// After creating a web app in the Firebase console, it will give you this object.
const firebaseConfig = {
  apiKey: "AIzaSyCe-0gyPIikH-ZUsIKQC0eRlU7p2x9fejM",
  authDomain: "hostelhivemanager-d8a50.firebaseapp.com",
  projectId: "hostelhivemanager-d8a50",
  storageBucket: "hostelhivemanager-d8a50.firebasestorage.app",
  messagingSenderId: "956145466471",
  appId: "1:956145466471:web:c81f89b80d0722ff0028c2",
  measurementId: "G-86BTCCL74P"
};
// -------------------------------------------------


// A simple check to see if the config has been updated.
// This provides a clearer message than the Firebase error.
// Note: Commenting this out to allow the app to initialize even with default keys,
// so validation errors are handled by the UI logic instead of blocking execution.
/*
if (firebaseConfig.apiKey === "AIzaSyCe-0gyPIikH-ZUsIKQC0eRlU7p2x9fejM") {
    const errorHTML = `
        <div style="font-family: system-ui, sans-serif; padding: 2rem; text-align: center; background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; border-radius: 0.5rem; margin: 2rem; line-height: 1.6;">
            <h1 style="font-size: 1.5rem; font-weight: bold;">Action Required: Connect Your Firebase Project</h1>
            <p style="margin-top: 1rem; font-size: 1.125rem;">This application is not yet connected to a database.</p>
            <p style="margin-top: 0.5rem;">To get started, please follow these steps:</p>
            <ol style="margin: 1.5rem auto; padding-left: 0; list-style-position: inside; text-align: left; max-width: 400px; gap: 0.5rem; display: flex; flex-direction: column;">
                <li>Go to your <a href="https://console.firebase.google.com/" target="_blank" style="color: #1d4ed8; text-decoration: underline; font-weight: 500;">Firebase Console</a>.</li>
                <li>Create a new project or select an existing one.</li>
                <li>In your project, go to 'Project Settings' and add a 'Web' application.</li>
                <li>During setup, Firebase will provide a 'firebaseConfig' object. Copy it.</li>
                <li>Open the <strong>firebaseConfig.ts</strong> file in the editor.</li>
                <li>Paste your configuration object, replacing the placeholder values.</li>
            </ol>
            <p style="margin-top: 1rem; font-size: 0.875rem; color: #4b5563;">Once you've updated the file, this message will disappear and the app will load.</p>
        </div>
    `;
    const rootElement = document.getElementById('root');
    if (rootElement) {
        rootElement.innerHTML = errorHTML;
    }
    // Halt execution to prevent further Firebase errors
    throw new Error("Firebase configuration is missing or invalid. Please update firebaseConfig.ts with your project's credentials.");
}
*/


// Initialize Firebase
const app = initializeApp(firebaseConfig);

export { app };