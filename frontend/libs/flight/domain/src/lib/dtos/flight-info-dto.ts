export type FlightInfoDto = {
  id: number;
  from: string;
  to: string;
  date: string;
  delay: null | number;
};

export const initialFlightInfoDto: FlightInfoDto = {
  id: 0,
  from: '',
  to: '',
  date: '',
  delay: null,
};
