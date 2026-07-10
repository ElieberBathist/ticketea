// Dynamic navigation bar logic
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
});

async function initNavbar() {
  const navContainer = document.querySelector('.nav-links');
  if (!navContainer) return;

  const currentPath = window.location.pathname;
  const isInicio = currentPath === '/' || currentPath === '/index.html';
  const isDashboard = currentPath.startsWith('/dashboard');
  const isLogin = currentPath.startsWith('/login');
  const isRegister = currentPath.startsWith('/register');

  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) throw new Error('Error de red');
    const status = await response.json();

    if (status.loggedIn) {
      navContainer.innerHTML = `
        <a href="/" class="nav-link ${isInicio ? 'active' : ''}">Inicio</a>
        <a href="/dashboard" class="nav-link ${isDashboard ? 'active' : ''}">Dashboard</a>
        <a href="#" id="logout-link" class="nav-link">Cerrar Sesión</a>
      `;

      // Set up logout link handler
      const logoutLink = document.getElementById('logout-link');
      if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
          e.preventDefault();
          await handleLogout();
        });
      }
    } else {
      navContainer.innerHTML = `
        <a href="/" class="nav-link ${isInicio ? 'active' : ''}">Inicio</a>
        <a href="/login.html" class="nav-link ${isLogin ? 'active' : ''}">Iniciar Sesión</a>
        <a href="/register.html" class="nav-link ${isRegister ? 'active' : ''}">Registrarse</a>
      `;
    }

    // Re-run Lucide Icons to make sure any navbar icons render correctly if any were added
    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (error) {
    console.error('Error al inicializar la barra de navegación:', error);
  }
}

async function handleLogout() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST'
    });

    if (response.ok) {
      // Show logout success toast if container exists
      const toastContainer = document.getElementById('toast-container');
      if (toastContainer) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.innerHTML = `
          <i data-lucide="check-circle"></i>
          <span>Sesión cerrada correctamente.</span>
        `;
        toastContainer.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        setTimeout(() => {
          toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
          setTimeout(() => {
            toast.remove();
            window.location.href = '/';
          }, 300);
        }, 1500);
      } else {
        window.location.href = '/';
      }
    } else {
      console.error('Error al cerrar sesión');
    }
  } catch (error) {
    console.error('Error de red al cerrar sesión:', error);
  }
}
