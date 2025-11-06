// --- Define el único email autorizado ---
// !! REEMPLAZA ESTO CON TU PROPIO EMAIL !!
const ALLOWED_EMAIL = "isilber31@gmail.com";
// ---------------------------------------------


// --- Variables Globales de Sincronización ---
let currentUser = null;
let dbUserRef = null; 
let storageRef = null; 
let isSyncing = false; 
let unsubscribeSnapshot = null; 

// --- Funciones de Utilidad de UI (Muralla de Login) ---
const loginWall = document.getElementById('login-wall');
const appContainer = document.getElementById('app-container-main');
const loginMessage = document.getElementById('login-message');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error-message');

function showLoginScreen(message = "Por favor, inicia sesión para acceder a tus recetas.", error = null) {
    loginMessage.textContent = message;
    loginBtn.style.display = "inline-flex";
    appContainer.style.display = 'none';
    loginWall.style.display = 'flex';
    if (error) {
        loginError.textContent = error;
        loginError.style.display = 'block';
    } else {
        loginError.style.display = 'none';
    }
}

function showAppScreen() {
    loginWall.style.display = 'none';
    appContainer.style.display = 'block';
}


// --- 1. Inicialización y Autenticación ---

/**
 * Inicializa el listener de estado de autenticación de Firebase.
 */
function initFirebaseSync(onLogin, onLogout) {
  if (typeof auth === 'undefined' || typeof storage === 'undefined') {
    showLoginScreen("Error al cargar Firebase.", "Scripts no cargados o error de configuración.");
    return;
  }
  
  // Mostrar mensaje de carga inicial
  showLoginScreen("Verificando sesión...", null);
  loginBtn.style.display = "none";
  
  // 1. Manejar el resultado del redireccionamiento PRIMERO
  auth.getRedirectResult()
    .then(() => {
        // El onAuthStateChanged se disparará después, no hacemos nada aquí
    })
    .catch((error) => {
        console.error("Error al retornar de Google:", error);
        // Si hay un error al volver, lo mostramos en la muralla
        showLoginScreen("Error al iniciar sesión.", error.message);
    });

  // 2. Listener que se dispara cuando el usuario inicia o cierra sesión
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // --- Comprobación de Acceso ---
      const isAllowed = user.email.toLowerCase() === ALLOWED_EMAIL.toLowerCase();

      if (!isAllowed) {
        console.warn(`Intento de acceso denegado para: ${user.email}`);
        showLoginScreen("Acceso Denegado. Esta cuenta no está autorizada.", "ACCESO DENEGADO");
        signOut();
        return; 
      }
      
      // --- Usuario AUTORIZADO ---
      currentUser = user;
      dbUserRef = firestore.collection('users').doc(currentUser.uid).collection('datasets').doc('appData');
      storageRef = storage.ref().child(`users/${currentUser.uid}/images`);
      
      console.log("Usuario autorizado conectado:", currentUser.email);
      
      showAppScreen(); // Mostrar la app antes de la sincronización
      
      onLogin(user); // Cargar datos locales y actualizar UI

      await pullFromCloud();
      startRealtimeListener();

    } else {
      // --- Usuario ha cerrado sesión ---
      console.log("Usuario desconectado.");
      currentUser = null;
      dbUserRef = null;
      storageRef = null;
      
      // Si no estamos en medio de un proceso de redirección, mostramos el login.
      // Esta es la parte que evita el bucle/flash si la autenticación ya falló o terminó.
      if (!auth.getRedirectResult().pending) {
          showLoginScreen();
      }

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
      
      onLogout(); // Limpiar datos locales
    }
  });
}

/**
 * Inicia el proceso de login con Google (usando Redirect - SOLUCIÓN COOP)
 */
function signInWithGoogle() {
  loginError.textContent = 'Redirigiendo a Google...';
  loginError.style.display = 'block';

  if (auth && googleProvider) {
    // Usamos Redirect para evitar los bloqueos de ventana Pop-up (COOP/COEP)
    auth.signInWithRedirect(googleProvider)
      .catch((error) => {
        console.error("Error al iniciar el proceso de redirección:", error);
        loginError.textContent = `Error al iniciar el proceso: ${error.message}`;
      });
  }
}

/**
 * Cierra la sesión del usuario.
 */
function signOut() {
  if (auth) {
    auth.signOut().catch((error) => {
      console.error("Error al cerrar sesión:", error);
    });
  }
}

// --- 2. Sincronización (Push & Pull) ---

async function pushToCloud(localData) {
  if (!dbUserRef || !localData || isSyncing) {
    return;
  }
  isSyncing = true;
  console.log("Iniciando subida (Push) a la nube...");
  try {
    const doc = await dbUserRef.get();
    if (doc.exists) {
      const cloudTimestamp = doc.data().lastModified || 0;
      if (cloudTimestamp > localData.lastModified) {
        console.warn("Conflicto detectado: La nube es más reciente. Abortando Push.");
        isSyncing = false;
        return; 
      }
    }
    await dbUserRef.set(localData, { merge: true });
    console.log("Sincronización (Push) completada.");
    updateSyncStatus(true); 
  } catch (error) {
    console.error("Error subiendo datos (Push):", error);
    if (error.code === 'permission-denied') {
        alert("ERROR DE PERMISOS (PUSH)\n\nLas reglas de Firestore rechazaron la escritura. Asegúrate de que tu email esté correcto en 'firestore.rules' y que hayas publicado las reglas.");
    }
    updateSyncStatus(false); 
  }
  isSyncing = false;
}

async function pullFromCloud() {
  if (!dbUserRef || isSyncing) {
    return null; 
  }
  isSyncing = true;
  console.log("Iniciando descarga (Pull) desde la nube...");
  try {
    const doc = await dbUserRef.get();
    if (!doc.exists) {
      console.log("No hay datos en la nube. Subiendo datos locales.");
      const localData = getLocalData(); 
      if (localData && localData.lastModified) {
        await pushToCloud(localData);
      }
      isSyncing = false;
      return null;
    }
    const cloudData = doc.data();
    const localData = getLocalData(); 
    const cloudTimestamp = cloudData.lastModified || 0;
    const localTimestamp = localData.lastModified || 0;
    console.log(`Timestamp Nube: ${new Date(cloudTimestamp).toLocaleString()}`);
    console.log(`Timestamp Local: ${new Date(localTimestamp).toLocaleString()}`);
    if (cloudTimestamp > localTimestamp) {
      console.log("Datos de la nube son más recientes. Actualizando local.");
      isSyncing = false;
      return cloudData; 
    } else if (localTimestamp > cloudTimestamp) {
      console.log("Datos locales son más recientes. Subiendo a la nube.");
      await pushToCloud(localData); 
      isSyncing = false;
      return null;
    } else {
      console.log("Datos locales y de la nube están sincronizados.");
      isSyncing = false;
      return null;
    }
  } catch (error) {
    console.error("Error descargando datos (Pull):", error);
    if (error.code === 'permission-denied') {
        alert("ERROR DE PERMISOS (PULL)\n\nLas reglas de Firestore rechazaron la lectura. Esto casi siempre significa que el email en tus 'firestore.rules' (en la web de Firebase) no coincide con el email con el que iniciaste sesión.");
        signOut(); // Forzar cierre de sesión porque no tiene permisos
    }
    updateSyncStatus(false);
    isSyncing = false;
    return null;
  }
}

function startRealtimeListener() {
  if (!dbUserRef) return;
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
  }
  console.log("Iniciando escucha de cambios en tiempo real...");
  unsubscribeSnapshot = dbUserRef.onSnapshot(
    (doc) => {
      if (isSyncing) {
        console.log("Snapshot recibido durante sincronización, ignorando.");
        return;
      }
      console.log("Datos modificados en la nube (Snapshot recibido).");
      if (!doc.exists) {
        console.log("Los datos en la nube fueron eliminados.");
        return;
      }
      const cloudData = doc.data();
      const localData = getLocalData(); 
      const cloudTimestamp = cloudData.lastModified || 0;
      const localTimestamp = localData.lastModified || 0;
      if (cloudTimestamp > localTimestamp) {
        console.log("Snapshot es más reciente. Actualizando local.");
        handleCloudUpdate(cloudData); 
      }
    },
    (error) => {
      console.error("Error en el listener de Firestore:", error);
    }
  );
}

// --- 3. Lógica de Storage ---

/**
 * Sube un archivo a Firebase Storage y devuelve la URL de descarga.
 */
async function uploadFileToStorage(file, fileName) {
    if (!storageRef || !file) {
        throw new Error("El usuario no está autenticado o no se proporcionó ningún archivo.");
    }

    // Crear una referencia al archivo
    const fileRef = storageRef.child(fileName);

    try {
        console.log(`Subiendo archivo a Storage: ${fileName}`);
        
        // Subir el archivo
        const snapshot = await fileRef.put(file);
        
        // Obtener la URL de descarga
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        console.log("Archivo subido con éxito. URL:", downloadURL);
        return downloadURL;

    } catch (error) {
        console.error("Error al subir archivo a Storage:", error);
        if (error.code === 'storage/unauthorized') {
            alert("ERROR DE PERMISOS (STORAGE)\n\nNo tienes permiso para subir archivos. Asegúrate de haber publicado las reglas de Storage correctamente.");
        }
        throw error;
    }
}