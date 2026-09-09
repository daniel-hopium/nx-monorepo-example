import { AircraftInfoDto, Flight, FlightOperator, FlightPrice } from './entities';

export const aircraftList: AircraftInfoDto[] = [
  { id: 1, registration: 'D-ABCD', type: 'Airbus A320' },
  { id: 2, registration: 'D-EFGH', type: 'Boeing 737' },
  { id: 3, registration: 'D-IJKL', type: 'Embraer E190' },
  { id: 4, registration: 'D-MNOP', type: 'Bombardier CRJ900' },
];

const CITY_NAMES = ['Berlin', 'Munich', 'Paris', 'London', 'Hamburg', 'Frankfurt'];

const OPERATOR_POOL: FlightOperator[] = [
  { name: 'Lufthansa', shortName: 'LH' },
  { name: 'EasyFly', shortName: 'EF' },
  { name: 'Continental Express', shortName: 'CX' },
  { name: 'SkyWays', shortName: 'SW' },
];

const rnd = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const choose = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const future = (maxDays = 30) => {
  const d = rnd(1, maxDays);
  const h = rnd(0, 23);
  const m = rnd(0, 59);
  return new Date(Date.now() + ((d * 24 + h) * 60 + m) * 60000);
};
const durMin = () => rnd(30, 300);
const money = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

export const generateFlights = (count: number): Flight[] => {
  const aircraftIds = aircraftList.map((a) => a.id);
  return Array.from({ length: count }, (_, idx) => {
    const from = choose(CITY_NAMES);
    const to = choose(CITY_NAMES.filter((c) => c !== from));
    const takeOff = future();
    const landing = new Date(takeOff.getTime() + durMin() * 60000);
    const price: FlightPrice = {
      classPrices: [
        { flightClass: 'economy', amount: money(50, 200) },
        { flightClass: 'business', amount: money(150, 600) },
        { flightClass: 'first', amount: money(450, 1300) },
      ],
      seatReservationSurcharge: money(5, 30),
    };
    const delay = Math.random() > 0.6 ? null : rnd(5, 120);
    return {
      id: idx + 1,
      connection: {
        from,
        to,
        icaoFrom: from.slice(0, 3).toUpperCase() + 'X',
        icaoTo: to.slice(0, 3).toUpperCase() + 'X',
      },
      times: {
        takeOff: takeOff.toISOString().slice(0, 16),
        landing: landing.toISOString().slice(0, 16),
        delay,
      },
      operator: choose(OPERATOR_POOL),
      price,
      aircraftId: choose(aircraftIds),
    };
  });
};

// In-Memory-"Datenbank": lebt nur solange der Prozess läuft.
export const flightList: Flight[] = generateFlights(1000);

export function getFlightById(id: number | string): Flight | undefined {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  return flightList.find((f) => f.id === numericId);
}

export function findFlights(from?: string, to?: string, date?: string): Flight[] {
  let result = flightList;

  if (from) {
    result = result.filter(
      (f) => f.connection.from.toLowerCase() === from.toLowerCase()
    );
  }
  if (to) {
    result = result.filter(
      (f) => f.connection.to.toLowerCase() === to.toLowerCase()
    );
  }
  if (date) {
    const notBefore = new Date(date).getTime();
    result = result.filter(
      (f) => new Date(f.times.takeOff).getTime() >= notBefore
    );
  }

  return [...result].sort(
    (a, b) =>
      new Date(a.times.takeOff).getTime() - new Date(b.times.takeOff).getTime()
  );
}
