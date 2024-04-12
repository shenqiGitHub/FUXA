import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HtmlMonitorComponent } from './html-monitor.component';

describe('HtmlMonitorComponent', () => {
  let component: HtmlMonitorComponent;
  let fixture: ComponentFixture<HtmlMonitorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HtmlMonitorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HtmlMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
