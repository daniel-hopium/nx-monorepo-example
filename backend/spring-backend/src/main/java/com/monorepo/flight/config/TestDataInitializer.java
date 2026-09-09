package com.monorepo.flight.config;

import com.monorepo.flight.model.Flight;
import com.monorepo.flight.model.FlightClassPrice;
import com.monorepo.flight.model.FlightConnection;
import com.monorepo.flight.model.FlightOperator;
import com.monorepo.flight.model.FlightPrice;
import com.monorepo.flight.model.FlightTimes;
import com.monorepo.flight.repository.AircraftRepository;
import com.monorepo.flight.repository.FlightRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Befüllt das In-Memory-Repository beim Start mit Testdaten.
 * {@link ApplicationRunner} wird von Spring Boot einmal nach dem Hochfahren
 * des Kontexts aufgerufen.
 */
@Component
public class TestDataInitializer implements ApplicationRunner {

  private static final List<String> CITY_NAMES =
      List.of("Berlin", "Munich", "Paris", "London", "Hamburg", "Frankfurt");

  private static final List<FlightOperator> OPERATOR_POOL =
      List.of(
          new FlightOperator("Lufthansa", "LH"),
          new FlightOperator("EasyFly", "EF"),
          new FlightOperator("Continental Express", "CX"),
          new FlightOperator("SkyWays", "SW"));

  private static final DateTimeFormatter ISO_MINUTES =
      DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

  private final FlightRepository flightRepository;
  private final AircraftRepository aircraftRepository;
  private final Random random = new Random();

  // Constructor Injection: Spring reicht die Abhängigkeiten beim Erzeugen herein.
  public TestDataInitializer(
      FlightRepository flightRepository, AircraftRepository aircraftRepository) {
    this.flightRepository = flightRepository;
    this.aircraftRepository = aircraftRepository;
  }

  @Override
  public void run(ApplicationArguments args) {
    for (int i = 0; i < 1000; i++) {
      flightRepository.save(randomFlight());
    }
  }

  private Flight randomFlight() {
    String from = choose(CITY_NAMES);
    String to = choose(CITY_NAMES.stream().filter(c -> !c.equals(from)).toList());
    LocalDateTime takeOff =
        LocalDateTime.now()
            .plusDays(rnd(1, 30))
            .plusHours(rnd(0, 23))
            .plusMinutes(rnd(0, 59))
            .withSecond(0)
            .withNano(0);
    LocalDateTime landing = takeOff.plusMinutes(rnd(30, 300));
    Integer delay = random.nextDouble() > 0.6 ? null : rnd(5, 120);

    FlightPrice price =
        new FlightPrice(
            List.of(
                new FlightClassPrice("economy", money(50, 200)),
                new FlightClassPrice("business", money(150, 600)),
                new FlightClassPrice("first", money(450, 1300))),
            money(5, 30));

    return new Flight(
        0, // 0 = Repository vergibt die Id
        new FlightConnection(from, to, icao(from), icao(to)),
        new FlightTimes(takeOff.format(ISO_MINUTES), landing.format(ISO_MINUTES), delay),
        choose(OPERATOR_POOL),
        price,
        choose(aircraftRepository.findAll()).id());
  }

  private static String icao(String city) {
    return city.substring(0, 3).toUpperCase() + "X";
  }

  private int rnd(int min, int max) {
    return random.nextInt(max - min + 1) + min;
  }

  private double money(double min, double max) {
    return Math.round((random.nextDouble() * (max - min) + min) * 100) / 100.0;
  }

  private <T> T choose(List<T> list) {
    return list.get(random.nextInt(list.size()));
  }
}
