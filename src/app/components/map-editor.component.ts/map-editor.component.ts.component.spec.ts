import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MapEditorComponentTsComponent } from './map-editor.component.ts.component';

describe('MapEditorComponentTsComponent', () => {
  let component: MapEditorComponentTsComponent;
  let fixture: ComponentFixture<MapEditorComponentTsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MapEditorComponentTsComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(MapEditorComponentTsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
