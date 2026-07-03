// Dashboard Page Javascript

const createEventForm = document.getElementById('create-event-form');
const bookingsTableBody = document.getElementById('bookings-table-body');
const eventsTableBody = document.getElementById('events-table-body');
const toastContainer = document.getElementById('toast-container');

// Stats Elements
const statEvents = document.getElementById('stat-events');
const statBookings = document.getElementById('stat-bookings');
const statSold = document.getElementById('stat-sold');
const statOccupancy = document.getElementById('stat-occupancy');

// Load All Dashboard Data
async function loadDashboardData() {
  await Promise.all([
    loadStats(),
    loadBookings(),
    loadEventsList()
  ]);
}

// Fetch Stats from API
async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    if (!response.ok) throw new Error('Error al obtener estadísticas');
    const stats = await response.json();
    
    statEvents.textContent = stats.eventsCount;
    statBookings.textContent = stats.bookingsCount;
    statSold.textContent = stats.totalTicketsSold;
    statOccupancy.textContent = `${stats.occupancyRate}%`;
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Fetch and Render Bookings Table
async function loadBookings() {
  try {
    const response = await fetch('/api/bookings');
    if (!response.ok) throw new Error('Error al obtener las reservas');
    const bookings = await response.json();

    if (bookings.length === 0) {
      bookingsTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay reservas registradas.</td>
        </tr>
      `;
      return;
    }

    bookingsTableBody.innerHTML = bookings.map(booking => {
      const formattedDate = new Date(booking.createdAt).toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <tr>
          <td>
            <div style="font-weight: 500;">${booking.userName}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${booking.userEmail}</div>
          </td>
          <td>${booking.Event ? booking.Event.title : 'Evento eliminado'}</td>
          <td><span style="font-weight: 600;">${booking.ticketsCount}</span></td>
          <td style="color: var(--text-secondary); font-size: 0.8rem;">${formattedDate}</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    showToast(error.message, 'error');
    bookingsTableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--accent-danger); padding: 2rem;">Error al cargar reservas.</td>
      </tr>
    `;
  }
}

// Fetch and Render Active Events Table
async function loadEventsList() {
  try {
    const response = await fetch('/api/events');
    if (!response.ok) throw new Error('Error al obtener los eventos');
    const events = await response.json();

    if (events.length === 0) {
      eventsTableBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay eventos registrados.</td>
        </tr>
      `;
      return;
    }

    eventsTableBody.innerHTML = events.map(event => {
      const formattedDate = new Date(event.date).toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <tr>
          <td>
            <div style="font-weight: 500;">${event.title}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${event.location}</div>
          </td>
          <td>
            <div><span style="font-weight: 600;">${event.availableSeats}</span> / ${event.capacity}</div>
          </td>
          <td style="color: var(--text-secondary); font-size: 0.8rem;">${formattedDate}</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    showToast(error.message, 'error');
    eventsTableBody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; color: var(--accent-danger); padding: 2rem;">Error al cargar eventos.</td>
      </tr>
    `;
  }
}

// Create New Event
createEventForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    title: document.getElementById('eventTitle').value.trim(),
    description: document.getElementById('eventDescription').value.trim(),
    date: document.getElementById('eventDate').value,
    location: document.getElementById('eventLocation').value.trim(),
    capacity: parseInt(document.getElementById('eventCapacity').value, 10),
    imageUrl: document.getElementById('eventImageUrl').value.trim() || null
  };

  try {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ocurrió un error al crear el evento.');
    }

    showToast('¡Evento creado con éxito!', 'success');
    createEventForm.reset();
    loadDashboardData(); // Refresh all panels
  } catch (error) {
    showToast(error.message, 'error');
  }
});

// Toast Utility Function
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);
  lucide.createIcons();

  // Remove toast after 4s
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Set modern default datetime input value to tomorrow
document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  now.setDate(now.getDate() + 1); // tomorrow
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('eventDate').value = now.toISOString().slice(0, 16);
  
  loadDashboardData();
});
