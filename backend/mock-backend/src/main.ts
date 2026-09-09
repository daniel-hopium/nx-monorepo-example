/**
 * Mock-Backend auf Basis von Express.
 * Liefert Testdaten für die Angular-App, damit das Frontend ohne echtes
 * Backend entwickelt werden kann.
 */
import express from 'express';
import cors from 'cors';
import { CreateFlightDto, Flight } from './entities';
import {
  aircraftList,
  findFlights,
  flightList,
  getFlightById,
} from './test-data';
import { flightsToFlightInfoDto } from './util';
import { initiativesRouter } from './initiatives';

const app = express();
// Erlaubt Aufrufe vom Angular-Dev-Server (anderer Port = anderer Origin).
app.use(cors());
// Parst JSON-Bodies. Seit Express 4.16 eingebaut, body-parser ist nicht mehr nötig.
app.use(express.json());

app.get('/api', (_req, res) => {
  res.json({ message: 'Welcome to mock-backend!' });
});

// Routen der Domäne "Initiative" (eigener Router, eigene Datei).
app.use('/api/initiatives', initiativesRouter);

app.get('/api/aircraft-infos', (_req, res) => {
  res.json(aircraftList);
});

app.get('/api/aircraft-infos/:id', (req, res) => {
  const aircraft = aircraftList.find(
    (a) => a.id === parseInt(req.params.id, 10)
  );
  if (aircraft) {
    res.json(aircraft);
  } else {
    res.status(404).json({ message: 'Aircraft not found' });
  }
});

app.get('/api/flight-infos', (req, res) => {
  const { from, to, date } = req.query as Record<string, string | undefined>;
  const flights = findFlights(from, to, date).slice(0, 30); // maximal 30 Treffer
  res.json(flightsToFlightInfoDto(flights));
});

app.get('/api/flights/:id', (req, res) => {
  const flight = getFlightById(req.params.id);
  if (flight) {
    res.json(flight);
  } else {
    res.status(404).json({ message: 'Flight not found' });
  }
});

app.post('/api/flights', (req, res) => {
  const dto = req.body as CreateFlightDto;
  const nextId = Math.max(0, ...flightList.map((f) => f.id)) + 1;
  const flight: Flight = { id: nextId, ...dto };
  flightList.push(flight);
  res.status(201).json(flight);
});

app.put('/api/flights/:id', (req, res) => {
  const flight = getFlightById(req.params.id);
  if (!flight) {
    res.status(404).json({ message: 'Flight not found' });
    return;
  }
  const dto = req.body as CreateFlightDto;
  Object.assign(flight, dto, { id: flight.id });
  res.status(204).send();
});

app.delete('/api/flights/:id', (req, res) => {
  const index = flightList.findIndex(
    (f) => f.id === parseInt(req.params.id, 10)
  );
  if (index === -1) {
    res.status(404).json({ message: 'Flight not found' });
    return;
  }
  flightList.splice(index, 1);
  res.status(204).send();
});

const port = process.env['PORT'] ? Number(process.env['PORT']) : 5100;
const server = app.listen(port, () => {
  console.log(`Mock backend listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
