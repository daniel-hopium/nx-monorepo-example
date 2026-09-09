/**
 * Domänenmodell "Flight".
 * Reine Typen und Initialwerte, keine Angular-Abhängigkeiten. So kann das
 * Modell von jeder Schicht (feature, ui, data-access) genutzt werden.
 */

export type FlightConnection = {
  from: string;
  to: string;
  icaoFrom: string;
  icaoTo: string;
};

export const initialFlightConnection: FlightConnection = {
  from: '',
  to: '',
  icaoFrom: '',
  icaoTo: '',
};

export type FlightTimes = {
  takeOff: string;
  landing: string;
  delay: null | number;
};

export const initialFlightTimes: FlightTimes = {
  takeOff: '',
  landing: '',
  delay: null,
};

export type FlightOperator = {
  name: string;
  shortName: string;
};

export const initialFlightOperator: FlightOperator = {
  name: '',
  shortName: '',
};

export type FlightClassPrice = {
  flightClass: string;
  amount: number;
};

export type FlightPrice = {
  classPrices: FlightClassPrice[];
  seatReservationSurcharge: number;
};

export const initialFlightPrice: FlightPrice = {
  classPrices: [],
  seatReservationSurcharge: 0,
};

export type Flight = {
  id: number;
  connection: FlightConnection;
  times: FlightTimes;
  operator: FlightOperator;
  price: FlightPrice | null;
  aircraftId: number | null;
};

export const initialFlight: Flight = {
  id: 0,
  connection: initialFlightConnection,
  times: initialFlightTimes,
  operator: initialFlightOperator,
  price: initialFlightPrice,
  aircraftId: null,
};

export type CreateFlightDto = Omit<Flight, 'id'>;

export const initialCreateFlightDto: CreateFlightDto = {
  connection: initialFlightConnection,
  times: initialFlightTimes,
  operator: initialFlightOperator,
  price: initialFlightPrice,
  aircraftId: null,
};
