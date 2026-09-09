package com.monorepo.flight.dto;

import com.monorepo.flight.model.Flight;
import com.monorepo.flight.model.FlightConnection;
import com.monorepo.flight.model.FlightOperator;
import com.monorepo.flight.model.FlightPrice;
import com.monorepo.flight.model.FlightTimes;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

/**
 * Eingabe-DTO für POST/PUT. Die Id fehlt bewusst, sie vergibt der Server.
 * {@code @Valid} sorgt dafür, dass die Constraints der verschachtelten
 * Records ebenfalls geprüft werden (Bean Validation).
 */
public record CreateFlightDto(
    @NotNull @Valid FlightConnection connection,
    @NotNull @Valid FlightTimes times,
    @NotNull @Valid FlightOperator operator,
    FlightPrice price,
    Integer aircraftId) {

  public Flight toFlight(int id) {
    return new Flight(id, connection, times, operator, price, aircraftId);
  }
}
