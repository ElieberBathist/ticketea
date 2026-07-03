// Landing Page Javascript

const eventsContainer = document.getElementById('events-container');
const bookingDialog = document.getElementById('booking-dialog');
const closeDialogBtn = document.getElementById('close-dialog-btn');
const bookingForm = document.getElementById('booking-form');
const toastContainer = document.getElementById('toast-container');

// Elements inside Dialog
const bookingEventId = document.getElementById('booking-event-id');
const bookingEventTitle = document.getElementById('booking-event-title');
const bookingEventInfo = document.getElementById('booking-event-info');

// Load Events from API
async function loadEvents() {
  try {
    const response = await fetch('/api/events');
    if (!response.ok) throw new Error('Error al obtener los eventos');
    const events = await response.json();
    renderEvents(events);
  } catch (error) {
    showToast(error.message, 'error');
    eventsContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: var(--accent-danger); padding: 3rem;">
        <i data-lucide="alert-circle" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
        <p>No se pudieron cargar los eventos. Por favor, intenta de nuevo más tarde.</p>
      </div>
    `;
    lucide.createIcons();
  }
}

// Render Events Grid
function renderEvents(events) {
  if (events.length === 0) {
    eventsContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">
        <p>No hay eventos disponibles en este momento.</p>
      </div>
    `;
    return;
  }

  eventsContainer.innerHTML = events.map(event => {
    const isSoldOut = event.availableSeats <= 0;
    const formattedDate = new Date(event.date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="event-card glass">
        <div class="event-card-img">
          <img src="${event.imageUrl}" alt="${event.title}" loading="lazy">
          <span class="event-badge ${isSoldOut ? 'badge-soldout' : 'badge-available'}">
            ${isSoldOut ? 'Agotado' : `${event.availableSeats} disponibles`}
          </span>
        </div>
        <div class="event-card-content">
          <h3>${event.title}</h3>
          <p class="description">${event.description}</p>
          <div class="event-details-meta">
            <div class="meta-item">
              <i data-lucide="calendar"></i>
              <span>${formattedDate}</span>
            </div>
            <div class="meta-item">
              <i data-lucide="map-pin"></i>
              <span>${event.location}</span>
            </div>
            <div class="meta-item">
              <i data-lucide="users"></i>
              <span>Capacidad: ${event.capacity} personas</span>
            </div>
          </div>
          <button class="btn btn-primary" ${isSoldOut ? 'disabled' : ''} onclick="openBookingModal('${event.id}', '${event.title.replace(/'/g, "\\'")}', '${event.location.replace(/'/g, "\\'")}')">
            ${isSoldOut ? 'Agotado' : 'Reservar Asistencia'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Re-run Lucide Icons helper for newly injected elements
  lucide.createIcons();
}

// Open Booking Modal
window.openBookingModal = function(id, title, location) {
  bookingEventId.value = id;
  bookingEventTitle.textContent = title;
  bookingEventInfo.innerHTML = `<i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> ${location}`;
  bookingForm.reset();
  bookingDialog.showModal();
  lucide.createIcons();
};

// Close Booking Modal
closeDialogBtn.addEventListener('click', () => {
  bookingDialog.close();
});

// Click outside modal to close
bookingDialog.addEventListener('click', (e) => {
  if (e.target === bookingDialog) {
    bookingDialog.close();
  }
});

// Submit Booking Form
bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    eventId: bookingEventId.value,
    userName: document.getElementById('userName').value.trim(),
    userEmail: document.getElementById('userEmail').value.trim(),
    ticketsCount: document.getElementById('ticketsCount').value
  };

  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ocurrió un error al procesar tu reserva.');
    }

    showToast('¡Reserva realizada con éxito!', 'success');
    bookingDialog.close();
    loadEvents(); // Reload event list to update capacity/badges
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

// Initial Run
document.addEventListener('DOMContentLoaded', loadEvents);
