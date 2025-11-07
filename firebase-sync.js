// --- Define el email del administrador principal (DEPRECADO - usar UID) ---
const ADMIN_EMAIL = "isilber31@gmail.com"; // Solo para fallback
// Lista de UIDs de administradores (más seguro que email)
const ADMIN_UIDS = []; // Se llenará desde Firestore
// ---------------------------------------------


// --- Variables Globales de Sincronización ---
let currentUser = null;
let dbUserRef = null; 
let storageRef = null; // <-- NUEVO para Storage
let isSyncing = false; 
let unsubscribeSnapshot = null; 

// --- Funciones Auxiliares ---

/**
 * Verifica si un usuario es administrador
 * @param {Object} user - Objeto de usuario de Firebase Auth
 * @returns {Promise<boolean>} - true si es admin, false si no
 */
async function checkIfAdmin(user) {
  if (!user || !user.uid) return false;
  
  try {
    // 1. Verificar en la colección 'admins' de Firestore
    const adminDoc = await firestore.collection('admins').doc(user.uid).get();
    if (adminDoc.exists && adminDoc.data().isAdmin === true) {
      console.log("✅ Usuario verificado como admin por UID en Firestore");
      return true;
    }
    
    // 2. Fallback: verificar por email (para compatibilidad)
    const userEmail = (user.email || '').toLowerCase().trim();
    const adminEmail = ADMIN_EMAIL.toLowerCase().trim();
    if (userEmail === adminEmail) {
      console.log("⚠️ Usuario verificado como admin por EMAIL (fallback)");
      console.log("💡 Recomendación: Agregar UID a la colección 'admins' en Firestore");
      
      // Auto-crear el documento en Firestore para futuras verificaciones
      try {
        await firestore.collection('admins').doc(user.uid).set({
          email: user.email,
          isAdmin: true,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: 'auto-migration'
        });
        console.log("✅ Documento de admin creado automáticamente en Firestore");
      } catch (error) {
        console.warn("No se pudo crear el documento de admin:", error);
      }
      
      return true;
    }
    
    console.log("❌ Usuario NO es administrador");
    return false;
    
  } catch (error) {
    console.error("Error verificando admin:", error);
    
    // Si hay error de permisos, usar fallback de email
    const userEmail = (user.email || '').toLowerCase().trim();
    const adminEmail = ADMIN_EMAIL.toLowerCase().trim();
    const isFallbackAdmin = userEmail === adminEmail;
    
    if (isFallbackAdmin) {
      console.warn("⚠️ Usando verificación de email como fallback debido a error");
    }
    
    return isFallbackAdmin;
  }
}

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
      
      // Verificar si es admin (primero por UID, luego por email como fallback)
      const isAdmin = await checkIfAdmin(user);
      
      console.log("=== VERIFICACIÓN DE ADMINISTRADOR ===");
      console.log("UID del usuario:", user.uid);
      console.log("Email del usuario:", user.email);
      console.log("¿Es administrador?:", isAdmin);
      console.log("====================================");
      
      if (!isAdmin) {
        // Verificar si el usuario está en la lista de autorizados
        const accessDoc = await firestore.collection('authorized_users').doc(user.uid).get();
        
        if (!accessDoc.exists || accessDoc.data().status !== 'approved') {
          // Usuario no autorizado - crear o verificar solicitud pendiente
          const requestDoc = await firestore.collection('access_requests').doc(user.uid).get();
          
          if (!requestDoc.exists) {
            // Crear solicitud de acceso
            await firestore.collection('access_requests').doc(user.uid).set({
              email: user.email,
              displayName: user.displayName || 'Usuario',
              photoURL: user.photoURL || '',
              requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
              status: 'pending'
            });
            console.log("Solicitud de acceso creada para:", user.email);
            showPendingAccessScreen(user, true); // Nueva solicitud
          } else {
            // Solicitud ya existe
            showPendingAccessScreen(user, false); // Solicitud existente
          }
          
          console.warn(`Acceso pendiente de aprobación para: ${user.email}`);
          // NO cerrar sesión automáticamente, mantener al usuario en pantalla de espera
          return;
        }
        
        console.log("Usuario autorizado conectado:", user.email);
      } else {
        console.log("Administrador conectado:", user.email);
      }
      
      // --- Usuario AUTORIZADO o ADMIN ---
      currentUser = user;
      dbUserRef = firestore.collection('users').doc(currentUser.uid).collection('datasets').doc('appData');
      storageRef = firebase.storage().ref().child(`users/${currentUser.uid}/images`);
      
      // Ocultar muralla y mostrar app
      loginWall.style.display = 'none';
      appContainer.style.display = 'block';
      
      onLogin(user);

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
  
  /**
   * Muestra la pantalla de acceso pendiente
   */
  function showPendingAccessScreen(user, isNewRequest) {
      const loginWall = document.getElementById('login-wall');
      const loginBox = loginWall.querySelector('.login-box');
      
      loginBox.innerHTML = `
          <div style="text-align: center;">
              <img src="${user.photoURL || 'assets/img/placeholder.svg'}" 
                   alt="Avatar" 
                   style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; margin-bottom: 0.75rem; border: 3px solid var(--color-primary);">
              <h2 style="margin: 0 0 0.25rem 0; font-size: 1.5rem;">¡Hola, ${user.displayName || 'Usuario'}!</h2>
              <p style="color: var(--color-text-alt); margin: 0 0 1.25rem 0; font-size: 0.9rem;">${user.email}</p>
              
              ${isNewRequest ? `
                  <div style="background: rgba(76, 175, 80, 0.1); border-left: 4px solid #4CAF50; padding: 0.75rem; margin-bottom: 1rem; border-radius: 4px; text-align: left;">
                      <h3 style="color: #4CAF50; margin: 0 0 0.25rem 0; font-size: 1rem;">✓ Solicitud Enviada</h3>
                      <p style="margin: 0; color: var(--color-text); font-size: 0.85rem;">Tu solicitud de acceso ha sido enviada correctamente.</p>
                  </div>
              ` : ''}
              
              <div style="background: var(--color-card); padding: 1.25rem; border-radius: 8px; margin-bottom: 1rem;">
                  <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⏳</div>
                  <h2 style="color: var(--color-primary); margin: 0 0 0.75rem 0; font-size: 1.25rem;">Acceso Pendiente</h2>
                  <p style="color: var(--color-text); margin: 0 0 0.5rem 0; font-size: 0.9rem;">
                      El administrador debe aprobar tu solicitud para que puedas acceder a la aplicación.
                  </p>
                  <p style="color: var(--color-text-alt); font-size: 0.85rem; margin: 0;">
                      La página se actualizará automáticamente cuando seas aprobado.
                  </p>
              </div>
              
              <div style="margin: 1rem 0;">
                  <div class="spinner" style="margin: 0 auto;"></div>
                  <p style="color: var(--color-text-alt); font-size: 0.85rem; margin: 0.75rem 0 0 0;">
                      Esperando aprobación...
                  </p>
              </div>
              
              <button id="logout-pending-btn" class="btn btn-secondary" style="margin-top: 1rem; width: 100%;">
                  Cerrar Sesión
              </button>
              
              <p style="margin-top: 1rem; color: var(--color-text-alt); font-size: 0.8rem;">
                  Si tienes preguntas, contacta al administrador.
              </p>
          </div>
      `;
      
      // Agregar evento al botón de logout
      const logoutBtn = document.getElementById('logout-pending-btn');
      if (logoutBtn) {
          logoutBtn.addEventListener('click', () => {
              signOut();
          });
      }
      
      // Mostrar la pantalla de login/espera
      loginWall.style.display = 'flex';
      
      // Escuchar cambios en tiempo real para detectar cuando se aprueba el acceso
      const unsubscribe = firestore.collection('authorized_users').doc(user.uid)
          .onSnapshot((doc) => {
              if (doc.exists && doc.data().status === 'approved') {
                  console.log("✅ Acceso aprobado! Recargando aplicación...");
                  // Desuscribirse del listener
                  unsubscribe();
                  // Recargar la página para que onAuthStateChanged vuelva a verificar
                  window.location.reload();
              }
          }, (error) => {
              console.error("Error escuchando estado de autorización:", error);
          });
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