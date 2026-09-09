package com.monorepo.flight.repository;

import com.monorepo.flight.model.AircraftInfo;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class AircraftRepository {

  private final List<AircraftInfo> aircraft =
      List.of(
          new AircraftInfo(1, "D-ABCD", "Airbus A320"),
          new AircraftInfo(2, "D-EFGH", "Boeing 737"),
          new AircraftInfo(3, "D-IJKL", "Embraer E190"),
          new AircraftInfo(4, "D-MNOP", "Bombardier CRJ900"));

  public List<AircraftInfo> findAll() {
    return aircraft;
  }

  public Optional<AircraftInfo> findById(int id) {
    return aircraft.stream().filter(a -> a.id() == id).findFirst();
  }
}
