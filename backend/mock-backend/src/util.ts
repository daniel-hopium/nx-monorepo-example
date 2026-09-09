import { Flight, FlightInfoDto } from './entities';

// Mapper: Domänenobjekt -> Read-Model. Hält die API schlank und entkoppelt.
export function flightsToFlightInfoDto(flights: Flight[]): FlightInfoDto[] {
  return flights.map((f) => ({
    id: f.id,
    from: f.connection.from,
    to: f.connection.to,
    date: f.times.takeOff,
    delay: f.times.delay,
  }));
}
