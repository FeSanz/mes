import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MachinesPage } from './machines.page';

describe('MachinesPage', () => {
  let component: MachinesPage;
  let fixture: ComponentFixture<MachinesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MachinesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
