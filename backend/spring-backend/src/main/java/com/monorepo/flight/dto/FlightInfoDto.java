package com.monorepo.flight.dto;

import com.monorepo.flight.model.Flight;

/**
 * DTO (Data Transfer Object) für Listen: enthält nur, was die Liste braucht.
 * Der Mapper liegt als statische Factory direkt beim DTO.
 */
public record FlightInfoDto(int id, String from, String to, String date, Integer delay) {

  public static FlightInfoDto from(Flight flight) {
    return new FlightInfoDto(
        flight.id(),
        flight.connection().from(),
        flight.connection().to(),
        flight.times().takeOff(),
        flight.times().delay());
  }
}
