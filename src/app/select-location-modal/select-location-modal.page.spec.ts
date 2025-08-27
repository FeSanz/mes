import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectLocationModalPage } from './select-location-modal.page';

describe('SelectLocationModalPage', () => {
  let component: SelectLocationModalPage;
  let fixture: ComponentFixture<SelectLocationModalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectLocationModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
