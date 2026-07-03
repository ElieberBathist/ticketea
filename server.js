import express from 'express';
import { Sequelize, DataTypes } from 'sequelize';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false,
});

// Models Definition
const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  availableSeats: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true },
  },
  ticketsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1 },
  },
});

// Relationships
Event.hasMany(Booking, { foreignKey: 'eventId', onDelete: 'CASCADE' });
Booking.belongsTo(Event, { foreignKey: 'eventId' });

// Seed initial data if empty
async function seedDatabase() {
  const count = await Event.count();
  if (count === 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(20, 0, 0, 0);

    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    nextMonth.setHours(18, 0, 0, 0);

    await Event.bulkCreate([
      {
        title: 'Festival de Jazz de Verano',
        description: 'Una noche mágica bajo las estrellas con los mejores exponentes del jazz contemporáneo y fusión nacional e internacional.',
        date: tomorrow,
        location: 'Anfiteatro del Parque Central',
        capacity: 150,
        availableSeats: 150,
        imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800',
      },
      {
        title: 'Conferencia Tech Future 2026',
        description: 'Aprende sobre Inteligencia Artificial, desarrollo web de próxima generación y el futuro de las interfaces inmersivas de la mano de líderes de la industria.',
        date: nextWeek,
        location: 'Centro de Convenciones Metropolitano',
        capacity: 300,
        availableSeats: 300,
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
      },
      {
        title: 'Taller de Cocina Gourmet de Vanguardia',
        description: 'Aprende técnicas culinarias modernas con reconocidos chefs Michelin en una sesión íntima y degustación exclusiva de 5 pasos.',
        date: nextMonth,
        location: 'Estudio Gastronómico Culinaria',
        capacity: 25,
        availableSeats: 25,
        imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800',
      },
    ]);
    console.log('🌱 Base de datos poblada con eventos iniciales.');
  }
}

// API Routes
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.findAll({
      order: [['date', 'ASC']],
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [Booking],
    });
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { title, description, date, location, capacity, imageUrl } = req.body;
    const newEvent = await Event.create({
      title,
      description,
      date,
      location,
      capacity,
      availableSeats: capacity,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800',
    });
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { eventId, userName, userEmail, ticketsCount } = req.body;
    const tickets = parseInt(ticketsCount, 10);

    const event = await Event.findByPk(eventId, { transaction });
    if (!event) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    if (event.availableSeats < tickets) {
      await transaction.rollback();
      return res.status(400).json({ error: 'No hay suficientes entradas disponibles' });
    }

    const booking = await Booking.create({
      eventId,
      userName,
      userEmail,
      ticketsCount: tickets,
    }, { transaction });

    await event.update({
      availableSeats: event.availableSeats - tickets,
    }, { transaction });

    await transaction.commit();
    res.status(201).json(booking);
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [{ model: Event, attributes: ['title'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const eventsCount = await Event.count();
    const bookingsCount = await Booking.count();
    
    const events = await Event.findAll();
    let totalCapacity = 0;
    let totalAvailable = 0;
    
    events.forEach(e => {
      totalCapacity += e.capacity;
      totalAvailable += e.availableSeats;
    });

    const totalTicketsSold = totalCapacity - totalAvailable;
    const occupancyRate = totalCapacity > 0 ? ((totalTicketsSold / totalCapacity) * 100).toFixed(1) : 0;

    res.json({
      eventsCount,
      bookingsCount,
      totalTicketsSold,
      occupancyRate: parseFloat(occupancyRate),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend paths explicitly or fallback to static index/dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Database Sync & Start Server
sequelize.sync().then(async () => {
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('No se pudo conectar a la base de datos:', err);
});
