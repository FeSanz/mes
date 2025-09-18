import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonToggle, IonModal, IonItem, IonInput, IonDatetime, IonDatetimeButton, IonSelect, IonSelectOption, IonTextarea,
  IonBreadcrumb, IonBreadcrumbs, IonCol
} from '@ionic/angular/standalone';
import { AlertsService } from 'src/app/services/alerts.service';
import { ApiService } from 'src/app/services/api.service';
import { PermissionsService } from 'src/app/services/permissions.service';

import { PrimeTemplate } from "primeng/api";
import { Table, TableModule } from "primeng/table";
import { Select } from "primeng/select";
import { FloatLabel } from "primeng/floatlabel";
import { pencilOutline, trashOutline, eyeOutline, reorderThreeOutline, addOutline, checkmark, moveOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Tag } from "primeng/tag";

@Component({
  selector: 'app-production-campaign',
  templateUrl: './production-campaign.page.html',
  styleUrls: ['./production-campaign.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, PrimeTemplate, TableModule, IonToggle, IonModal,
    IonItem, IonInput, IonDatetime, IonDatetimeButton, IonSelect, IonSelectOption, IonTextarea, Select, FloatLabel, IonBreadcrumb, IonBreadcrumbs, Tag, IonCol]
})
export class ProductionCampaignPage implements OnInit {
  campaignsArray: any = []
  workOrdersArray: any = []
  freeWorkOrdersArray: any = []
  userData: any = {};
  isModalOpen = false
  rowsPerPage: number = 19;
  rowsPerPageOptions: number[] = [5, 10, 20];
  scrollHeight: string = '90%';
  searchValueAl: string = '';
  searchOrders: string = '';
  currentCampaign: any = {
    campaign_id: "",
    name: "",
    code: ""
  }
  currentWO: any = {
    id: "",
    work_order_number: ""
  }
  showCampaign = false
  isModalNewCampaign = false
  isModalNewWO = false
  campaignObj: any = {
    code: '',
    name: '',
    description: '',
    status_telegram: 'CREATED',
    enabled_flag: 'Y',
    plannedStartDate: '2025-09-11T13:34:49',
    plannedEndDate: '2025-09-11T13:34:49'
  }
  woObj: any = {}
  organizationSelected: string | any = '';
  selectedProducts: any[] = [];

  selectedOrders: any[] = [];
  isDragging: boolean = false;
  draggedItems: any[] = [];
  dropIndicatorVisible: boolean = false;
  constructor(
    private alerts: AlertsService,
    private apiService: ApiService,
    public permissions: PermissionsService,
    private changeDetector: ChangeDetectorRef) {
    this.userData = JSON.parse(String(localStorage.getItem("userData")));
    this.organizationSelected = this.userData.Company.Organizations[1];
    addIcons({ addOutline, pencilOutline, trashOutline, eyeOutline, moveOutline, reorderThreeOutline, checkmark });
  }

  products = [
    { code: 'P100', name: 'Laptop', category: 'Electronics' },
    { code: 'P200', name: 'Mouse', category: 'Accessories' },
    { code: 'P300', name: 'Keyboard', category: 'Accessories' }
  ];

  ngOnInit() {
  }

  ionViewDidEnter() {
    this.GetCampaigns()
  }
  GetCampaigns() {
    this.apiService.GetRequestRender(`campaigns/${this.organizationSelected.OrganizationId}`).then((response: any) => {
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.showCampaign = false
        this.currentCampaign = {
          campaign_id: "",
          name: "",
          code: ""
        }
        this.campaignsArray = response.items
      }
    })
  }
  GetCurrentWO() {

  }
  GetCurrentCampaign() {

  }
  ClearCampaigns(table: any) {
    table.clear();
    this.searchValueAl = '';
  }
  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  EditCampaign(wo: any) {

  }
  AddWoToCampaign(wo: any) {

  }
  DeleteCampaign(wo: any) {

  }
  ViewCampaign(wo: any) {

  }
  EditOrder(wo: any) {

  }
  DeleteOrder(wo: any) {

  }
  ViewOrder(wo: any) {

  }
  AddToCurrentCampaign(wo: any) {
    const payload = {
      "campaign_id": this.currentCampaign.campaign_id,
      "work_order_ids": [wo.work_order_id]
    }
    this.changeDetector.detectChanges()
    this.apiService.PutRequestRender('work-orders/assign-campaign', payload).then(async (response: any) => {
      if (response.errorsExistFlag) {
        //this.alerts.Info(response.message);
      } else {
        this.alerts.Success("WO: " + wo.code + " agregada a " + this.currentCampaign.code);
        this.freeWorkOrdersArray = this.freeWorkOrdersArray.filter((w: any) => w.work_order_id != wo.work_order_id);
        this.currentCampaign.work_orders.push(wo)
        this.changeDetector.detectChanges()
      }
    });
  }
  SaveCampaign() {
    const payload = {
      organization_id: this.organizationSelected.OrganizationId,
      code: this.campaignObj.code,
      name: this.campaignObj.name,
      description: this.campaignObj.description,
      start_date: this.campaignObj.plannedEndDate,
      end_date: this.campaignObj.plannedStartDate,
      status_telegram: this.campaignObj.status_telegram,
      enabled_flag: this.campaignObj.enabled_flag
    }
    this.apiService.PostRequestRender('campaigns', payload).then(async (response: any) => {
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.alerts.Success(response.message);;
      }
    });
  }
  ClearOrders(table: any) {
    table.clear();
    this.searchValueAl = '';
  }
  GetCompleteOrder(campaign: any) {
    this.currentCampaign = campaign
    this.apiService.GetRequestRender(`campaign/${campaign.campaign_id}`).then((response: any) => {
      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.currentCampaign = response
        console.log(response);

      }
    })
    this.apiService.GetRequestRender(`work-orders/without-campaign/${this.organizationSelected.OrganizationId}`, false).then((response: any) => {

      this.freeWorkOrdersArray = response.items

      if (response.errorsExistFlag) {
        this.alerts.Info(response.message);
      } else {
        this.workOrdersArray = response.items
        console.log(this.workOrdersArray);

      }
    })
    this.showCampaign = true
  }
  ShowNewWO() {
    this.isModalNewWO = true
  }
  ShowNewCampaign() {
    this.isModalNewCampaign = true
  }
  ////////****************///////////*************////////************/////********** */ */ */ */
  onDragStart(event: DragEvent, item: any) {
    if (!this.isSelected(item)) {
      event.preventDefault();
      return;
    }

    this.isDragging = true;
    this.draggedItems = [...this.selectedOrders];

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/json', JSON.stringify(this.draggedItems));
    }

    // Agregar clase visual durante el drag
    setTimeout(() => {
      document.body.classList.add('dragging-active');
    }, 0);
  }

  // Función para manejar drag over
  onDragOver(event: DragEvent, rowIndex: number) {
    if (!this.isDragging) return;

    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';

    // Mostrar indicador visual de donde se va a soltar
    this.showDropIndicator(event, rowIndex);
  }

  // Función para manejar el drop
  onDrop(event: DragEvent, dropIndex: number) {
    if (!this.isDragging) return;

    event.preventDefault();

    const targetItem = this.currentCampaign.work_orders[dropIndex];

    // No permitir drop sobre items seleccionados
    if (this.isSelected(targetItem)) {
      this.onDragEnd(event);
      return;
    }

    this.moveSelectedRowsToPosition(dropIndex);
    this.onDragEnd(event);
  }

  // Función para finalizar el arrastre
  onDragEnd(event: DragEvent) {
    this.isDragging = false;
    this.draggedItems = [];
    this.dropIndicatorVisible = false;

    // Remover clase visual
    document.body.classList.remove('dragging-active');

    // Limpiar indicadores visuales
    const indicators = document.querySelectorAll('.drop-indicator-temp');
    indicators.forEach(indicator => indicator.remove());
  }

  // Mostrar indicador de drop
  showDropIndicator(event: DragEvent, rowIndex: number) {
    // Lógica para mostrar donde se va a insertar la fila
    const targetRow = event.currentTarget as HTMLElement;
    const rect = targetRow.getBoundingClientRect();
    const mouseY = event.clientY;
    const rowMiddle = rect.top + rect.height / 2;

    // Determinar si insertar antes o después
    const insertAfter = mouseY > rowMiddle;

    // Aquí puedes agregar lógica visual para mostrar la línea indicadora
    this.dropIndicatorVisible = true;
  }

  // Mover filas seleccionadas a nueva posición
  moveSelectedRowsToPosition(targetIndex: number) {
    const workOrders = [...this.currentCampaign.work_orders];
    const selectedIndices = this.selectedOrders.map(order =>
      workOrders.findIndex(wo => wo.work_order_number === order.work_order_number)
    ).sort((a, b) => a - b);

    // Extraer elementos seleccionados
    const selectedItems = selectedIndices.map(index => workOrders[index]);

    // Crear array sin los elementos seleccionados
    const filteredArray = workOrders.filter((_, index) =>
      !selectedIndices.includes(index)
    );

    // Calcular nueva posición considerando elementos removidos
    let adjustedTargetIndex = targetIndex;
    for (const selectedIndex of selectedIndices) {
      if (selectedIndex < targetIndex) {
        adjustedTargetIndex--;
      }
    }

    // Insertar elementos en la nueva posición
    filteredArray.splice(adjustedTargetIndex, 0, ...selectedItems);

    this.currentCampaign.work_orders = filteredArray;

    // Actualizar secuencia con incrementos de 10
    this.updateRowSequence();
  }

  // Actualizar secuencia con incrementos de 10 (10, 20, 30, etc.)
  updateRowSequence() {
    this.currentCampaign.work_orders.forEach((order: any, index: any) => {
      order.sequence = (index + 1) * 10;
    });

    // Guardar en el backend
    this.saveOrderSequence();

    console.log('Secuencias actualizadas:', this.currentCampaign.work_orders.map((o: any) => ({
      work_order_number: o.work_order_number,
      sequence: o.sequence
    })));
  }

  // Función para rastrear filas (mejora el performance)
  rowTrackBy(index: number, item: any) {
    return item.work_order_number;
  }

  // Verificar si una fila está seleccionada
  isSelected(item: any): boolean {
    return this.selectedOrders.some(selected =>
      selected.work_order_number === item.work_order_number
    );
  }

  // Seleccionar todas las filas
  selectAll() {
    this.selectedOrders = [...this.currentCampaign.work_orders];
  }

  // Limpiar selección
  clearSelection() {
    this.selectedOrders = [];
  }

  // Guardar el nuevo orden en el backend
  saveOrderSequence() {
    console.log('Guardando nueva secuencia...');

    // Ejemplo de implementación:
    // const sequenceData = this.currentCampaign.work_orders.map(order => ({
    //   work_order_number: order.work_order_number,
    //   sequence: order.sequence
    // }));
    // 
    // this.orderService.updateOrderSequence(sequenceData)
    //   .subscribe(response => {
    //     console.log('Secuencia guardada exitosamente');
    //   });
  }
}
