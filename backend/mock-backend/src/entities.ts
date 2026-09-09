// Fachliche Typen des Mock-Backends. Sie spiegeln die Domäne "Flight" wider
// und dienen dem Frontend als Vertrag (API-Contract).

export type AircraftInfoDto = {
  id: number;
  registration: string;
  type: string;
};

export type FlightConnection = {
  from: string;
  to: string;
  icaoFrom: string;
  icaoTo: string;
};

export type FlightTimes = {
  takeOff: string;
  landing: string;
  delay: null | number;
};

export type FlightOperator = {
  name: string;
  shortName: string;
};

export type FlightClassPrice = {
  flightClass: string;
  amount: number;
};

export type FlightPrice = {
  classPrices: FlightClassPrice[];
  seatReservationSurcharge: number;
};

// Aggregat-Root der Domäne: ein Flug mit allen zugehörigen Wertobjekten.
export type Flight = {
  id: number;
  connection: FlightConnection;
  times: FlightTimes;
  operator: FlightOperator;
  price: FlightPrice | null;
  aircraftId: number | null;
};

// Schlanke Lese-Sicht (Read Model) für Listen; enthält nur, was die Liste braucht.
export type FlightInfoDto = {
  id: number;
  from: string;
  to: string;
  date: string;
  delay: null | number;
};

// Eingabe-DTO fürs Anlegen: wie Flight, aber ohne id (die vergibt der Server).
export type CreateFlightDto = Omit<Flight, 'id'>;
