import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationsPage } from './organizations.page';

describe('OrganizationsPage', () => {
  let component: OrganizationsPage;
  let fixture: ComponentFixture<OrganizationsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OrganizationsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
