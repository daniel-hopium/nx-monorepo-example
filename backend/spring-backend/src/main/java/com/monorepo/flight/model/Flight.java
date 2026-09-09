package com.monorepo.flight.model;

/**
 * Aggregat-Root der Domäne "Flight".
 * Da Records unveränderlich sind, liefert {@link #withId(int)} eine Kopie
 * mit neuer Id statt das Objekt zu mutieren.
 */
public record Flight(
    int id,
    FlightConnection connection,
    FlightTimes times,
    FlightOperator operator,
    FlightPrice price,
    Integer aircraftId) {

  public Flight withId(int newId) {
    return new Flight(newId, connection, times, operator, price, aircraftId);
  }
}
