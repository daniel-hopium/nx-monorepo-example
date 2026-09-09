package com.monorepo.flight.repository;

import com.monorepo.flight.model.Flight;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Repository;

/**
 * Repository-Schicht: kapselt den Datenzugriff. Hier eine In-Memory-Map,
 * in einer echten Anwendung stünde hier Spring Data JPA mit einer Datenbank.
 * Die Controller/Service-Schicht merkt vom Austausch nichts.
 */
@Repository
public class FlightRepository {

  private final Map<Integer, Flight> flights = new ConcurrentHashMap<>();
  private final AtomicInteger idSequence = new AtomicInteger(0);

  public List<Flight> findAll() {
    return flights.values().stream()
        .sorted(Comparator.comparing(f -> f.times().takeOff()))
        .toList();
  }

  public Optional<Flight> findById(int id) {
    return Optional.ofNullable(flights.get(id));
  }

  /** Vergibt bei id == 0 eine neue Id (Insert), sonst wird ersetzt (Update). */
  public Flight save(Flight flight) {
    Flight toStore = flight.id() == 0 ? flight.withId(idSequence.incrementAndGet()) : flight;
    flights.put(toStore.id(), toStore);
    return toStore;
  }

  public boolean deleteById(int id) {
    return flights.remove(id) != null;
  }
}
