import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MsePlayerComponent } from './mse-player.component';

describe('MsePlayerComponent', () => {
  let component: MsePlayerComponent;
  let fixture: ComponentFixture<MsePlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MsePlayerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MsePlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
