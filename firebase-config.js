// --- Configuración de Firebase ---
// REEMPLAZA ESTO con la configuración de tu propio proyecto de Firebase
// (Ve a Configuración del proyecto > General > Tus apps > App web)
const firebaseConfig = {
  apiKey: "AIzaSyDw468VKxdwG_nRPaWWfhJa3sFknd6hCGg",
  authDomain: "pizzas-bato.firebaseapp.com",
  projectId: "pizzas-bato",
  storageBucket: "pizzas-bato.firebasestorage.app",
  messagingSenderId: "68252600633",
  appId: "1:68252600633:web:f02837f97ce09959c880e8",
  measurementId: "G-1LQCD80BNC"
};

// --- Inicialización de Firebase ---
let app;
let auth;
let firestore;
let googleProvider;

try {
  // Inicializa la app de Firebase
  app = firebase.initializeApp(firebaseConfig);
  
  // Inicializa los servicios que usaremos
  auth = firebase.auth();
  firestore = firebase.firestore();
  
  // Configura el proveedor de Google para el login
  googleProvider = new firebase.auth.GoogleAuthProvider();
  
  // (Opcional) Habilitar la persistencia offline de Firestore.
  // Esto permite que Firestore maneje su propia caché offline,
  // pero nosotros usaremos un enfoque manual (localStorage) para control total.
  // Si quisieras que Firestore lo maneje, descomenta la siguiente línea:
  // firebase.firestore().enablePersistence();

  console.log("Firebase inicializado correctamente.");

} catch (error) {
  console.error("Error al inicializar Firebase:", error);
  alert("Error al conectar con los servicios de sincronización. Comprueba tu conexión o la configuración de Firebase.");
}