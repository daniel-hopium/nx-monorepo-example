package com.monorepo.flight.model;

import java.util.List;

public record FlightPrice(List<FlightClassPrice> classPrices, double seatReservationSurcharge) {}
