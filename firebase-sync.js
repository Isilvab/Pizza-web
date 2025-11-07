// --- Define el único email autorizado ---
// !! REEMPLAZA ESTO CON TU PROPIO EMAIL !!
const ALLOWED_EMAIL = "isilber31@gmail.com";
// ---------------------------------------------


// --- Variables Globales de Sincronización ---
let currentUser = null;
let dbUserRef = null; 
let storageRef = null; // <-- NUEVO para Storage
let isSyncing = false; 
let unsubscribeSnapshot = null; 

// --- 1. Inicialización y Autenticación ---

/**
 * Inicializa el listener de estado de autenticación de Firebase.
 * Se llama UNA VEZ cuando la página carga (desde app.js).
 */
function initFirebaseSync(onLogin, onLogout) {
  if (typeof auth === 'undefined' || typeof firestore === 'undefined' || typeof firebase.storage === 'undefined') {
    console.error("Error: Los scripts de Firebase (auth, firestore, storage) no se cargaron correctamente.");
    showLoginScreen("Error crítico de la aplicación. Revisa la consola.");
    return;
  }
  
  const loginWall = document.getElementById('login-wall');
  const appContainer = document.getElementById('app-container-main');

  // Listener que se dispara cuando el usuario inicia o cierra sesión
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // --- Usuario ha iniciado sesión ---
      
      // --- Comprobación de Acceso ---
      const isAllowed = user.email.toLowerCase() === ALLOWED_EMAIL.toLowerCase();

      if (!isAllowed) {
        console.warn(`Intento de acceso denegado para: ${user.email}`);
        showLoginScreen("Acceso Denegado. Esta cuenta no está autorizada.");
        signOut(); // Desloguear al usuario no autorizado
        return; 
      }
      
      // --- Usuario AUTORIZADO ---
      currentUser = user;
      dbUserRef = firestore.collection('users').doc(currentUser.uid).collection('datasets').doc('appData');
      storageRef = firebase.storage().ref().child(`users/${currentUser.uid}/images`); // <-- NUEVO: Ruta de Storage
      
      console.log("Usuario autorizado conectado:", currentUser.email);
      
      // Ocultar muralla y mostrar app
      loginWall.style.display = 'none';
      appContainer.style.display = 'block'; // <-- ¡MOSTRAR LA APP!
      
      onLogin(user); // Llama a la función en app.js para actualizar la UI del perfil

      // --- Siempre descargar de la nube al iniciar sesión ---
      await pullFromCloud();
      startRealtimeListener();

    } else {
      // --- Usuario ha cerrado sesión ---
      console.log("Usuario desconectado.");
      currentUser = null;
      dbUserRef = null;
      storageRef = null;
      
      // Ocultar app y mostrar muralla
      loginWall.style.display = 'flex';
      appContainer.style.display = 'none';
      
      // Limpiar errores
      const loginError = document.getElementById('login-error-message');
      if (loginError) loginError.style.display = 'none';

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
      
      onLogout(); // Llama a la función en app.js para actualizar la UI del perfil
    }
  });

  /**
   * Muestra la pantalla de login y oculta el mensaje de "cargando"
   */
  function showLoginScreen(error = null) {
      const loginMessage = document.getElementById('login-message');
      const loginBtn = document.getElementById('login-btn');
      const loginError = document.getElementById('login-error-message');

      loginMessage.textContent = "Por favor, inicia sesión para acceder a tus recetas.";
      loginBtn.style.display = "inline-flex"; // Mostrar botón de login

      if (error) {
          loginError.textContent = error;
          loginError.style.display = 'block';
      } else {
          loginError.style.display = 'none';
      }
  }
  
  // Como no estamos usando redirect, podemos mostrar el botón de login inmediatamente
  // si el usuario no está ya logueado (lo cual onAuthStateChanged maneja).
  if (!auth.currentUser) {
      showLoginScreen();
  }
}

/**
 * Inicia el proceso de login con Google (usando Popup)
 */
function signInWithGoogle() {
  const loginError = document.getElementById('login-error-message');
  loginError.textContent = 'Abriendo ventana de Google...';
  loginError.style.display = 'block';

  if (auth && googleProvider) {
    auth.signInWithPopup(googleProvider)
      .then((result) => {
        // El listener 'onAuthStateChanged' se encargará del resto
        console.log("Inicio de sesión con Pop-up exitoso.");
        loginError.style.display = 'none';
      })
      .catch((error) => {
        console.error("Error durante el inicio de sesión con Google (Popup):", error);
        
        if (error.code === 'auth/popup-blocked') {
          loginError.textContent = "Error: El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.";
        } else if (error.code === 'auth/unauthorized-domain') {
           loginError.textContent = "Error: Dominio no autorizado. Revisa la consola de Firebase.";
        } else {
           loginError.textContent = `Error al iniciar sesión: ${error.message}`;
        }
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
  console.log("Iniciando descarga desde la nube...");
  console.log("Ruta de Firestore:", `users/${currentUser.uid}/datasets/appData`);
  
  try {
    const doc = await dbUserRef.get();
    
    console.log("Documento existe:", doc.exists);
    
    if (!doc.exists) {
      console.log("No hay datos en la nube. Subiendo datos locales para crear registro inicial.");
      const localData = getLocalDataSnapshot();
      if (localData && localData.lastModified > 0) {
        console.log("Datos locales encontrados:", Object.keys(localData));
        await pushToCloud(localData);
      } else {
        console.log("No hay datos locales para subir.");
      }
      isSyncing = false;
      return null;
    }
    
    const cloudData = doc.data();
    console.log("Datos descargados de la nube:");
    console.log("- Recetas:", cloudData.recipes?.length || 0);
    console.log("- Inventario:", cloudData.inventory?.length || 0);
    console.log("- Diario:", cloudData.diary?.length || 0);
    console.log("- Masas:", cloudData.doughRecipes?.length || 0);
    console.log("- Eventos:", cloudData.events?.length || 0);
    console.log("- Equipo:", cloudData.equipment?.length || 0);
    
    // CAMBIO CRÍTICO: Siempre actualizar si hay datos en la nube
    console.log("✅ FORZANDO actualización con datos de la nube");
    if (typeof handleCloudUpdate === 'function') {
      handleCloudUpdate(cloudData);
    }
    if (typeof window.updateSyncStatus === 'function') window.updateSyncStatus(true);
    isSyncing = false;
    return cloudData;

  } catch (error) {
    console.error("Error descargando datos:", error);
    console.error("Código de error:", error.code);
    console.error("Mensaje:", error.message);
    if (error.code === 'permission-denied') {
        console.warn("Firestore rechazó la lectura.");
        alert("No tienes permiso para leer datos en la nube. Revisa las reglas de Firestore.");
    }
    if (typeof window.updateSyncStatus === 'function') window.updateSyncStatus(false);
    isSyncing = false;
    throw error;
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

// --- 3. NUEVO: Lógica de Storage ---

/**
 * Sube un archivo a Firebase Storage y devuelve la URL de descarga.
 * @param {File} file - El archivo a subir (ej. desde un input <input type="file">)
 * @param {string} fileName - El nombre que tendrá el archivo en la nube (ej: 'pizza_margarita.jpg')
 * @returns {Promise<string>} La URL pública de descarga del archivo.
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
        // Manejar errores de permisos (asegúrate de que las reglas de Storage estén bien)
        if (error.code === 'storage/unauthorized') {
            alert("ERROR DE PERMISOS (STORAGE)\n\nNo tienes permiso para subir archivos. Asegúrate de haber publicado las reglas de Storage correctamente.");
        }
        throw error;
    }
}

/**
 * Obtiene los datos locales desde el almacenamiento local (localStorage).
 * Devuelve un objeto con la propiedad lastModified y otros datos relevantes.
 */
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
    const raw = localStorage.getItem('pizzaAppData');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (typeof parsed.lastModified !== 'number') parsed.lastModified = 0;
    return parsed;
  } catch (error) {
    console.error('No se pudo obtener los datos locales:', error);
    return fallback;
  }
}

// FUNCIÓN DE DIAGNÓSTICO
async function diagnosticarFirestore() {
  if (!currentUser || !dbUserRef) {
    console.error("❌ No hay usuario autenticado o dbUserRef no está configurado.");
    console.log("Debes iniciar sesión primero.");
    return;
  }

  console.log("=== 🔍 DIAGNÓSTICO DE FIRESTORE ===");
  console.log("Usuario actual:", currentUser.email);
  console.log("UID:", currentUser.uid);
  console.log("Ruta del documento:", `users/${currentUser.uid}/datasets/appData`);
  
  try {
    const doc = await dbUserRef.get();
    console.log("¿Documento existe en Firebase?", doc.exists);
    
    if (doc.exists) {
      const data = doc.data();
      console.log("\n📦 CONTENIDO DEL DOCUMENTO:");
      console.log("- lastModified:", data.lastModified ? new Date(data.lastModified).toLocaleString() : 'N/A');
      console.log("- Recetas:", data.recipes?.length || 0);
      console.log("- Inventario:", data.inventory?.length || 0);
      console.log("- Diario:", data.diary?.length || 0);
      console.log("- Masas:", data.doughRecipes?.length || 0);
      
      console.log("\n📋 DATOS COMPLETOS:");
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log("\n⚠️ El documento NO existe en Firestore.");
      console.log("\nPara crear el documento, ejecuta:");
      console.log(`
        pushToCloud({
          lastModified: Date.now(),
          recipes: [],
          inventory: [],
          diary: [],
          doughRecipes: []
        });
      `);
    }
  } catch (error) {
    console.error("❌ Error al diagnosticar:", error);
    console.error("Código:", error.code);
    console.error("Mensaje:", error.message);
  }
  console.log("=== FIN DEL DIAGNÓSTICO ===\n");
}

// Exponer globalmente
window.diagnosticarFirestore = diagnosticarFirestore;
window.getLocalData = getLocalData;