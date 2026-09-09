package com.monorepo.flight.model;

/**
 * Model-Schicht (das "M" in MVC): reine Datenklassen ohne Web- oder
 * Persistenzlogik. Java-Records sind unveränderlich (immutable) und
 * erzeugen Konstruktor, Getter, equals/hashCode automatisch.
 */
public record AircraftInfo(int id, String registration, String type) {}
