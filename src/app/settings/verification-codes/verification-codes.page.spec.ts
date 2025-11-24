import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerificationCodesPage } from './verification-codes.page';

describe('VerificationCodesPage', () => {
  let component: VerificationCodesPage;
  let fixture: ComponentFixture<VerificationCodesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VerificationCodesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
