// --- Configuración de Firebase ---
// REEMPLAZA ESTO con la configuración de tu propio proyecto de Firebase
// (Ve a Configuración del proyecto > General > Tus apps > App web)
const firebaseConfig = {
  apiKey: "AIzaSyDw468VKxdwG_nRPaWWfhJa3sFknd6hCGg",
  authDomain: "pizzas-bato.firebaseapp.com",
  projectId: "pizzas-bato",
  storageBucket: "pizzas-bato.appspot.com",
  messagingSenderId: "68252600633",
  appId: "1:68252600633:web:f02837f97ce09959c880e8",
  measurementId: "G-1LQCD80BNC"
};

// --- Inicialización de Firebase ---
// Se declaran en el ámbito global para que otros scripts puedan acceder a ellas.
var app;
var auth;
var firestore;
var storage;
var googleProvider;

try {
  // Inicializa la app de Firebase
  app = firebase.initializeApp(firebaseConfig);
  
  // Inicializa los servicios que usaremos
  auth = firebase.auth();
  firestore = firebase.firestore();
  storage = firebase.storage(); 
  googleProvider = new firebase.auth.GoogleAuthProvider();

  console.log("Firebase inicializado correctamente (auth, firestore, storage).");

} catch (error) {
  console.error("Error al inicializar Firebase:", error);
  alert("Error al conectar con los servicios de sincronización. Comprueba tu conexión o la configuración de Firebase.");
}


