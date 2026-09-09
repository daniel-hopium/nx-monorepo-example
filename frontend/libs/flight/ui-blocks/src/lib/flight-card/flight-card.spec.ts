import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlightCard } from './flight-card';

describe('FlightCard', () => {
  let fixture: ComponentFixture<FlightCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightCard],
    }).compileComponents();

    fixture = TestBed.createComponent(FlightCard);
    fixture.componentRef.setInput('flight', {
      id: 7,
      from: 'Berlin',
      to: 'Paris',
      date: '2026-10-01T10:00',
      delay: 15,
    });
    await fixture.whenStable();
  });

  it('should render route and delay', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.route')?.textContent).toContain('Berlin');
    expect(el.querySelector('.route')?.textContent).toContain('Paris');
    expect(el.querySelector('.delay')?.textContent).toContain('15');
  });
});
