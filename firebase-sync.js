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
function getLocalData() {
  const fallback = { lastModified: 0 };
  try {
    if (typeof window?.exportLocalData === 'function') {
      const data = window.exportLocalData();
      if (data && typeof data === 'object') {
        return typeof data.lastModified === 'number' ? data : { ...data, lastModified: 0 };
      }
      return fallback;
    }
    const raw = localStorage.getItem('mi-proyecto-pizzas:data');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (typeof parsed.lastModified !== 'number') parsed.lastModified = 0;
    return parsed;
  } catch (error) {
    console.error('No se pudo obtener los datos locales:', error);
    return fallback;
  }
}

function showAppScreen() {
    loginWall.style.display = 'none';
    appContainer.style.display = 'block';
}

// --- 1. Inicialización y Autenticación ---
function initFirebaseSync(onLogin, onLogout) {
  // CORRECCIÓN CRÍTICA: Se añade la comprobación de 'firestore'.
  // Si 'firestore' no está definido, el código fallaba más adelante, deteniendo la app.
  if (typeof auth === 'undefined' || typeof firestore === 'undefined' || typeof storage === 'undefined') {
    showLoginScreen("Error al cargar Firebase.", "Scripts no cargados o error de configuración.");
    console.error("Error crítico: auth, firestore, o storage no están definidos globalmente.");
    return;
  }
  
  // Mostrar mensaje de carga inicial
  showLoginScreen("Verificando sesión...", null);
  loginBtn.style.display = "inline-flex";

  let redirectProcessing = true;
  const loginFallbackTimer = setTimeout(() => {
    if (!auth.currentUser) {
      console.warn("Sin respuesta de Firebase tras el redirect. Mostrando pantalla de login.");
      showLoginScreen();
    }
  }, 4000);

  auth.getRedirectResult()
    .then(() => {
        // no hacemos nada aquí; la onAuthStateChanged se ejecutará según sea necesario
    })
    .catch((error) => {
        console.error("Error al retornar de Google:", error);
        showLoginScreen("Error al iniciar sesión.", error.message);
    })
    .finally(() => {
        redirectProcessing = false;
        if (!auth.currentUser) {
            showLoginScreen();
        }
    });

  auth.onAuthStateChanged(async (user) => {
    clearTimeout(loginFallbackTimer);
    if (user) {
      // --- Comprobación de Acceso ---
      const isAllowed = user.email && user.email.toLowerCase() === ALLOWED_EMAIL.toLowerCase();

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
      
      // --- FLUJO DE CARGA DEFINITIVO ---
      // 1. Cargar datos locales INMEDIATAMENTE para que la UI no esté vacía.
      if (typeof loadData === 'function') {
        loadData();
      }
      if (typeof renderAll === 'function') {
        renderAll();
      }

      // 2. Mostrar la app y notificar a app.js que el usuario está logueado.
      showAppScreen();
      if (typeof onLogin === 'function') onLogin(user);

      // 3. Intentar sincronizar con la nube en segundo plano.
      (async () => {
        try {
          const cloudData = await pullFromCloud();
          // Si no había datos en la nube, intentar subir los locales si existen.
          if (!cloudData) {
            const localData = getLocalData ? getLocalData() : null;
            if (localData && localData.lastModified > 0) {
              console.log("No hay datos en la nube, subiendo los locales existentes.");
              await pushToCloud(localData);
            }
          }
        } catch (error) {
          console.error("Error en la sincronización inicial en segundo plano:", error);
          // No se muestra alerta para no interrumpir al usuario, ya tiene los datos locales.
        }
      })();

      // 4. Iniciar el listener para cambios en tiempo real.
      startRealtimeListener();

    } else {
      // --- Usuario ha cerrado sesión ---
      console.log("Usuario desconectado.");
      currentUser = null;
      dbUserRef = null;
      storageRef = null;
      
      // Mostrar login salvo que aún estemos procesando el redirect
      if (!redirectProcessing) {
          showLoginScreen();
      }

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
      
      if (typeof onLogout === 'function') onLogout(); // Limpiar datos locales
    }
  });
}

/**
 * Inicia el proceso de login with Google (usando Redirect - SOLUCIÓN COOP)
 */
function signInWithGoogle() {
  loginError.textContent = 'Redirigiendo a Google...';
  loginError.style.display = 'block';

  if (auth && googleProvider) {
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
    if (typeof window.updateSyncStatus === 'function') window.updateSyncStatus(true);
  } catch (error) {
    console.error("Error subiendo datos (Push):", error);
    if (error.code === 'permission-denied') {
        alert("ERROR DE PERMISOS (PUSH)\n\nLas reglas de Firestore rechazaron la escritura. Asegúrate de que tu email esté correcto en 'firestore.rules' y que hayas publicado las reglas.");
    }
    if (typeof window.updateSyncStatus === 'function') window.updateSyncStatus(false);
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
      const localData = getLocalData ? getLocalData() : null; 
      if (localData && localData.lastModified) {
        await pushToCloud(localData);
      }
      isSyncing = false;
      return null;
    }
    const cloudData = doc.data();
    const localData = getLocalData ? getLocalData() : { lastModified: 0 }; 
    const cloudTimestamp = cloudData.lastModified || 0;
    const localTimestamp = localData.lastModified || 0;
    console.log(`Timestamp Nube: ${new Date(cloudTimestamp).toLocaleString()}`);
    console.log(`Timestamp Local: ${new Date(localTimestamp).toLocaleString()}`);
    if (cloudTimestamp > localTimestamp) {
      console.log("Datos de la nube son más recientes. Actualizando local.");
      if (typeof handleCloudUpdate === 'function') {
        handleCloudUpdate(cloudData);
      }
      if (typeof window.updateSyncStatus === 'function') window.updateSyncStatus(true);
      isSyncing = false;
      return cloudData; 
    } else if (localTimestamp > cloudTimestamp) {
      console.log("Datos locales son más recientes. Subiendo a la nube.");
      await pushToCloud(localData); 
      isSyncing = false;
      return null;
    } else {
      console.log("Datos locales y de la nube están sincronizados.");
      if (typeof window.updateSyncStatus === 'function') window.updateSyncStatus(true);
      isSyncing = false;
      return null;
    }
  } catch (error) {
    console.error("Error descargando datos (Pull):", error);
    if (auth?.currentUser && error?.message) {
        alert(error.message);
    }
    if (error.code === 'permission-denied') {
        console.warn("Firestore rechazó la lectura para el usuario actual.");
        alert("No tienes permiso para leer datos en la nube. Revisa las reglas de Firestore o continúa usando tus datos locales.");
        isSyncing = false;
        if (typeof window.updateSyncStatus === 'function') window.updateSyncStatus(false);
        return null;
    }
    if (typeof window.updateSyncStatus === 'function') window.updateSyncStatus(false);
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
      const localData = getLocalData ? getLocalData() : { lastModified: 0 }; 
      const cloudTimestamp = cloudData.lastModified || 0;
      const localTimestamp = localData.lastModified || 0;
      if (cloudTimestamp > localTimestamp) {
        console.log("Snapshot es más reciente. Actualizando local.");
        if (typeof handleCloudUpdate === 'function') handleCloudUpdate(cloudData);
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