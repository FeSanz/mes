import {
  AfterViewInit, ChangeDetectorRef, Component, ElementRef,
  HostListener, OnInit, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonButtons, IonCard, IonCol, IonContent,
  IonGrid, IonHeader, IonIcon, IonMenuButton, IonRow, IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { Platform } from '@ionic/angular';

import { Card } from 'primeng/card';
import { SelectButton } from 'primeng/selectbutton';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { Dialog } from 'primeng/dialog';
import { DialogModule } from 'primeng/dialog';
import { PrimeTemplate } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { DatePicker } from 'primeng/datepicker';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';

import { ApiService } from '../../../../services/api.service';
import { EndpointsService } from '../../../../services/endpoints.service';
import { AlertsService } from '../../../../services/alerts.service';
import { ToggleMenu } from 'src/app/models/design';
import { Round, Truncate } from 'src/app/models/math.operations';
import { HeightTable, RowsPerPageProduction } from 'src/app/models/tables.prime';
import { addIcons } from 'ionicons';
import { menuOutline } from 'ionicons/icons';

// 'P' = OT de proceso (ProcessWorkOrders), 'D' = OT discreta (workOrders)
interface SearchMatch {
  raw: any;
  type: 'P' | 'D';
}

@Component({
  selector: 'app-movil',
  templateUrl: './movil.page.html',
  styleUrls: ['./movil.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonButton, IonIcon,
    IonGrid, IonRow, IonCol, IonCard,
    CommonModule, FormsModule,
    Card, SelectButton, InputText, Button, Tag, FloatLabel, Select,
    Dialog, DialogModule, PrimeTemplate,
    TableModule, DatePicker, IconField, InputIcon
  ]
})
export class MovilPage implements OnInit, AfterViewInit {
  @ViewChild('scanInput') scanInputRef: ElementRef<HTMLInputElement> | undefined;
  @ViewChild('dtHistory') dtHistory: any;

  userData: any = {};
  organizationSelected: any = '';

  // ──── Escaneo ────────────────────────────────────────────────────────────────

  searchModes = [
    { label: '1. Por Orden de Trabajo', value: 'wo' },
    { label: '2. Por Item', value: 'item' }
  ];
  searchMode: string = 'wo';
  scanValue: string = '';
  matchList: SearchMatch[] = [];

  // ──── Modal de despacho ───────────────────────────────────────────────────────

  selectedWorkOrder: any = null;
  isModalOpen: boolean = false;
  completeGlobal: number = 0;
  scrapGlobal: number = 0;
  rejectGlobal: number = 0;

  get totalGlobal(): number {
    return (this.completeGlobal || 0) + (this.scrapGlobal || 0) + (this.rejectGlobal || 0);
  }

  private materialOnHandCache: Map<string, any> = new Map();
  private loadingMaterials: Set<string> = new Set();
  hasInsufficientStock: boolean = false;

  // ──── Historial de despachos ──────────────────────────────────────────────────

  dispatchHistory: any[] = [];
  searchValueHistory: string = '';
  scrollHeight: string = '400px';
  rowsPerPage: number = 10;
  rowsPerPageOptions: number[] = [5, 10, 20];

  // Opciones de período — valores coinciden exactamente con los intervalos del backend
  readonly intervalOptions = [
    { label: 'Hoy', value: 'today' },
    { label: 'Últimos 7 días', value: '7days' },
    { label: 'Esta semana', value: 'week' },
    { label: 'Últimos 30 días', value: '30days' },
    { label: 'Este mes', value: 'month' },
    { label: 'Rango personalizado', value: 'custom' }
  ];
  historyInterval: string = 'today';
  historyStartDate: Date | undefined;
  historyEndDate: Date | undefined;
  showDatePickers: boolean = false;

  // ──── Modal de detalle del historial ─────────────────────────────────────────

  isDetailOpen: boolean = false;
  detailDispatch: any = null;   // fila seleccionada del historial
  detailPayload: any = null;    // RequestPayload completo del backend

  // ──── Transformadores de datos Fusion ────────────────────────────────────────
  // Fusion expone dos tipos de OT con campos distintos; este mapa normaliza ambas
  // respuestas a la misma estructura interna que usa el template.

  private readonly dataTransformers: { [key: string]: (data: any) => any } = {
    'P': (data: any) => ({
      _type: 'P',
      WorkOrderId: data.WorkOrderId,
      WorkOrderNumber: data.WorkOrderNumber,
      ItemNumber: data.ItemNumber,
      Description: data.Description,
      UoM: data.PrimaryProductUOMCode,
      PlannedQuantity: data.PrimaryProductQuantity,
      CompletedQuantity: data.CompletedQuantity,
      Scrap: data.ScrappedQuantity,
      Reject: data.RejectedQuantity,
      Operations: data.Operation,
      Materials: data.ProcessWorkOrderMaterial,
      Resources: data.ProcessWorkOrderResource,
      Outputs: data.ProcessWorkOrderOutput
    }),
    'D': (data: any) => ({
      _type: 'D',
      WorkOrderId: data.WorkOrderId,
      WorkOrderNumber: data.WorkOrderNumber,
      ItemNumber: data.ItemNumber,
      Description: data.Description,
      UoM: data.UOMCode,
      PlannedQuantity: data.PlannedStartQuantity,
      CompletedQuantity: data.CompletedQuantity,
      Scrap: data.ScrappedQuantity,
      Reject: data.RejectedQuantity,
      Operations: data.WorkOrderOperation,
      Materials: data.WorkOrderMaterial,
      Resources: data.WorkOrderResource,
      Outputs: null
    })
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private apiService: ApiService,
    private endPoints: EndpointsService,
    private alerts: AlertsService,
    private platform: Platform
  ) {
    addIcons({ menuOutline });
  }

  ngOnInit() {
    this.userData = JSON.parse(String(localStorage.getItem('userData')));
    if (this.userData?.Company?.Organizations?.length > 0) {
      const sorted = [...this.userData.Company.Organizations].sort((a, b) => a.OrganizationId - b.OrganizationId);
      this.organizationSelected = sorted[0];
      this.LoadHistory();
    } else {
      this.alerts.Warning('No se encontraron organizaciones');
    }
  }

  ngAfterViewInit() {
    this.UpdateScrollHeight();
    this.FocusScanInput();
  }

  @HostListener('window:resize')
  onResize() { this.UpdateScrollHeight(); }

  private UpdateScrollHeight() {
    this.scrollHeight = HeightTable(this.platform.height());
    this.RowsPerPage();
  }

  private RowsPerPage() {
    this.rowsPerPage = RowsPerPageProduction(window.innerHeight);
    this.rowsPerPageOptions = [
      Math.max(5, Math.floor(this.rowsPerPage / 2)),
      this.rowsPerPage,
      Math.min(50, this.rowsPerPage * 2)
    ];
    if (this.dtHistory) {
      this.dtHistory.rows = this.rowsPerPage;
      this.cdr.detectChanges();
    }
  }

  // ──── Historial ───────────────────────────────────────────────────────────────

  async LoadHistory() {
    if (!this.organizationSelected?.OrganizationId) return;
    const orgId = this.organizationSelected.OrganizationId;

    // getTimezoneOffset() devuelve minutos al oeste de UTC (ej. UTC-6 → 360).
    // El backend lo usa para convertir timestamps UTC a hora local antes de filtrar.
    const tz = new Date().getTimezoneOffset();

    let endpoint: string;
    if (this.historyInterval === 'custom') {
      if (!this.historyStartDate || !this.historyEndDate) return;
      const start = this.FormatDateParam(this.historyStartDate);
      const end = this.FormatDateParam(this.historyEndDate);
      endpoint = `workDispatch/history/${orgId}/between/${start}/${end}`;
    } else {
      endpoint = `workDispatch/history/${orgId}/interval/${this.historyInterval}?tzOffset=${tz}`;
    }

    const response: any = await this.apiService.GetRequestRender(endpoint, false);
    this.dispatchHistory = response?.items || [];
  }

  OnIntervalChange() {
    this.showDatePickers = this.historyInterval === 'custom';
    if (this.historyInterval !== 'custom') {
      this.LoadHistory();
    }
  }

  OnDateRangeChange() {
    if (this.historyStartDate && this.historyEndDate) {
      this.LoadHistory();
    }
  }

  OnOrganizationChange() {
    this.LoadHistory();
  }

  // Abre el modal de detalle cargando el RequestPayload del despacho seleccionado
  async OpenDispatchDetail(dispatch: any) {
    await this.alerts.ShowLoading();
    try {
      const response: any = await this.apiService.GetRequestRender(
        `workDispatch/${dispatch.WorkDispatchId}`, false
      );
      const data = response?.items?.[0];
      this.detailDispatch = dispatch;
      this.detailPayload = data?.RequestPayload ?? null;
      this.isDetailOpen = true;
    } finally {
      await this.alerts.HideLoading();
    }
  }

  StatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
    if (status === 'SUCCESS') return 'success';
    if (status === 'PARTIAL_ERROR') return 'warn';
    if (status === 'ERROR') return 'danger';
    return 'secondary';
  }

  // Devuelve true si la sección tuvo errores (para resaltar el encabezado en el detalle)
  SectionHasError(section: 'Operations' | 'Resources' | 'Materials' | 'Outputs'): boolean {
    return (this.detailDispatch?.ErrorsByPayload?.[section] ?? 0) > 0;
  }

  // Devuelve los nombres de las secciones que tuvieron errores (para el resumen del diálogo)
  ErroredSections(): string[] {
    const byPayload = this.detailDispatch?.ErrorsByPayload;
    if (!byPayload) return [];
    return Object.entries(byPayload)
      .filter(([, count]) => (count as number) > 0)
      .map(([section]) => section);
  }

  OnFilterGlobal(event: Event, table: any) {
    const target = event.target as HTMLInputElement;
    table.filterGlobal(target.value, 'contains');
  }

  ClearHistoryFilter(table: any) {
    table.clear();
    this.searchValueHistory = '';
  }

  private FormatDateParam(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ──── Escaneo ────────────────────────────────────────────────────────────────

  OnModeChange() { this.ResetAll(); }

  OnScan() {
    const code = this.scanValue.trim();
    if (!code) return;
    if (!this.organizationSelected) { this.alerts.Warning('Seleccione una organización'); return; }
    this.searchMode === 'wo' ? this.SearchByWorkOrder(code) : this.SearchByItem(code);
  }

  private async SearchByWorkOrder(code: string) {
    await this.alerts.ShowLoading();
    try {
      // Se busca primero en OT de proceso (más frecuente en planta); solo si no hay resultado se consulta discreta.
      const responseP = await this.apiService.GetRequestFusion(
        this.endPoints.Path('wo_process_dispatch', this.organizationSelected.Code, code), false);
      const dataP = responseP ? JSON.parse(responseP) : { items: [] };
      if (dataP.items?.length > 0) { await this.SetSelectedWorkOrder(dataP.items[0], 'P'); return; }

      const responseD = await this.apiService.GetRequestFusion(
        this.endPoints.Path('wo_discrete_dispatch', this.organizationSelected.Code, code), false);
      const dataD = responseD ? JSON.parse(responseD) : { items: [] };
      if (dataD.items?.length > 0) { await this.SetSelectedWorkOrder(dataD.items[0], 'D'); return; }

      this.alerts.Warning(`No se encontró una orden de trabajo liberada para "${code}"`);
      this.ClearScan();
    } finally {
      await this.alerts.HideLoading();
    }
  }

  private async SearchByItem(code: string) {
    await this.alerts.ShowLoading();
    try {
      // Un mismo ítem puede tener OTs en proceso y discretas simultáneamente; se consultan en paralelo.
      const [responseP, responseD] = await Promise.all([
        this.apiService.GetRequestFusion(
          this.endPoints.Path('wo_process_by_item', this.organizationSelected.Code, code), false),
        this.apiService.GetRequestFusion(
          this.endPoints.Path('wo_discrete_by_item', this.organizationSelected.Code, code), false)
      ]);

      const itemsP: SearchMatch[] = (responseP ? JSON.parse(responseP).items : [])
        .map((raw: any) => ({ raw, type: 'P' as const }));
      const itemsD: SearchMatch[] = (responseD ? JSON.parse(responseD).items : [])
        .map((raw: any) => ({ raw, type: 'D' as const }));
      const matches = [...itemsP, ...itemsD];

      if (matches.length === 0) {
        this.alerts.Warning(`No se encontraron órdenes de trabajo liberadas para el item "${code}"`);
        this.ClearScan();
      } else if (matches.length === 1) {
        await this.SetSelectedWorkOrder(matches[0].raw, matches[0].type);
      } else {
        // Múltiples coincidencias: mostrar lista para que el usuario seleccione
        this.matchList = matches;
      }
    } finally {
      await this.alerts.HideLoading();
    }
  }

  async SelectMatch(match: SearchMatch) {
    this.matchList = [];
    await this.SetSelectedWorkOrder(match.raw, match.type);
  }

  private async SetSelectedWorkOrder(raw: any, type: 'P' | 'D') {
    this.materialOnHandCache.clear();
    this.loadingMaterials.clear();
    this.hasInsufficientStock = false;

    this.selectedWorkOrder = this.dataTransformers[type](raw);

    const lastOp = this.LastOperation();
    this.completeGlobal = lastOp?.ReadyQuantity || 0;
    this.scrapGlobal = 0;
    this.rejectGlobal = 0;

    this.scanValue = '';
    this.isModalOpen = true;

    // Resolver el work_order_id interno del backend IoT y el stock en paralelo.
    // El ID interno de la tabla mes_work_orders es distinto al WorkOrderId de Fusion.
    await Promise.all([
      this.ResolveInternalWorkOrderId(),
      this.LoadAllMaterialsOnHand()
    ]);
  }

  // Busca WorkOrderId y OrganizationId internos del backend IoT por WorkOrderNumber.
  // La tabla mes_work_dispatch tiene FK a mes_work_orders; el WorkOrderId de Fusion no sirve aquí.
  private async ResolveInternalWorkOrderId() {
    const woNumber = this.selectedWorkOrder?.WorkOrderNumber;
    if (!woNumber) return;
    try {
      const response: any = await this.apiService.GetRequestRender(
        `workOrders/byNumber/${woNumber}`, false
      );
      const data = response?.items?.[0];
      if (data?.WorkOrderId) {
        this.selectedWorkOrder.InternalWorkOrderId = data.WorkOrderId;
        this.selectedWorkOrder.InternalOrganizationId = data.OrganizationId;
      }
    } catch {
      // No bloqueamos la UI; la validación en ConfirmDispatch avisará al usuario si falta el ID.
    }
  }

  // ──── Helpers del modal de despacho ──────────────────────────────────────────
  // IMPORTANTE: estos métodos mutan propiedades SOBRE los objetos originales del array.
  // Usar spread/map aquí crea nuevas referencias en cada ciclo de CD, lo que dispara
  // ngAfterViewInit en pInputText → detectChanges() → bucle infinito.

  Operations() {
    return this.selectedWorkOrder?.Operations?.items || [];
  }

  private getPlannedQuantity(): number {
    return this.selectedWorkOrder?.PlannedQuantity || 1;
  }

  OutputsForOperation(operationSequence: number) {
    const outputs = this.selectedWorkOrder?.Outputs?.items || [];
    const filtered = outputs.filter((o: any) => o.OperationSequenceNumber === operationSequence);
    const plannedQty = this.getPlannedQuantity();
    filtered.forEach((o: any) => {
      o.Standard = (o.OutputQuantity || 0) / plannedQty;
      o.StandardReal = (o.Standard || 0) * (this.totalGlobal || 0);
    });
    return filtered;
  }

  MaterialsForOperation(operationSequence: number) {
    const materials = this.selectedWorkOrder?.Materials?.items || [];
    const filtered = materials.filter((m: any) => m.OperationSequenceNumber === operationSequence);
    const plannedQty = this.getPlannedQuantity();
    filtered.forEach((m: any) => {
      m.Standard = (m.Quantity || 0) / plannedQty;
      m.StandardReal = (m.Standard || 0) * (this.totalGlobal || 0);
      const cacheKey = `${m.ItemNumber}_${m.SupplySubinventory}`;
      const cached = this.materialOnHandCache.get(cacheKey);
      if (cached) {
        m.QuantityOnhand = cached.QuantityOnhand;
        m.AvailableToTransact = cached.AvailableToTransact;
        m.OnHandMessage = cached.OnHandMessage;
      } else {
        m.QuantityOnhand = m.QuantityOnhand ?? 0;
        m.AvailableToTransact = m.AvailableToTransact ?? 0;
        m.OnHandMessage = m.OnHandMessage ?? 'Cargando...';
      }
    });
    return filtered;
  }

  EquipmentResourcesForOperation(operationSequence: number) {
    const resources = this.selectedWorkOrder?.Resources?.items || [];
    const filtered = resources.filter((r: any) =>
      r.OperationSequenceNumber === operationSequence && r.ResourceType === 'EQUIPMENT'
    );
    const plannedQty = this.getPlannedQuantity();
    filtered.forEach((r: any) => {
      r.Standard = (r.RequiredUsage || 0) / plannedQty;
      r.StandardReal = (r.Standard || 0) * (this.totalGlobal || 0);
    });
    return filtered;
  }

  LaborResourcesForOperation(operationSequence: number) {
    const resources = this.selectedWorkOrder?.Resources?.items || [];
    const filtered = resources.filter((r: any) =>
      r.OperationSequenceNumber === operationSequence && r.ResourceType === 'LABOR'
    );
    const plannedQty = this.getPlannedQuantity();
    filtered.forEach((r: any) => {
      r.Standard = (r.RequiredUsage || 0) / plannedQty;
      r.StandardReal = (r.Standard || 0) * (this.totalGlobal || 0);
    });
    return filtered;
  }

  // ──── Stock on-hand ───────────────────────────────────────────────────────────

  private async LoadAllMaterialsOnHand() {
    const materials = this.selectedWorkOrder?.Materials?.items || [];
    if (!materials.length) return;

    const promises = materials.map(async (material: any) => {
      const cacheKey = `${material.ItemNumber}_${material.SupplySubinventory}`;
      if (this.materialOnHandCache.has(cacheKey) || this.loadingMaterials.has(cacheKey)) return;

      this.loadingMaterials.add(cacheKey);
      const payload = {
        OrganizationCode: this.organizationSelected.Code,
        ItemNumber: material.ItemNumber,
        Subinventory: material.SupplySubinventory
      };

      try {
        const response: any = await this.apiService.PostRequestFusion('availableQuantityDetails', payload, false);
        const parsed = typeof response === 'string' ? JSON.parse(response) : response;
        const result = {
          QuantityOnhand: parsed.QuantityOnhand || 0,
          AvailableToTransact: parsed.AvailableToTransact || 0,
          OnHandMessage: parsed.ReturnStatus
        };
        this.materialOnHandCache.set(cacheKey, result);
        material.QuantityOnhand = result.QuantityOnhand;
        material.AvailableToTransact = result.AvailableToTransact;
        material.OnHandMessage = result.OnHandMessage;
      } catch (error: any) {
        this.materialOnHandCache.set(cacheKey, { QuantityOnhand: 0, AvailableToTransact: 0, OnHandMessage: `Error: ${error.message || error}` });
      } finally {
        this.loadingMaterials.delete(cacheKey);
      }
    });

    await Promise.all(promises);
    this.validateMaterialStock();
  }

  private validateMaterialStock() {
    const materials = this.selectedWorkOrder?.Materials?.items || [];
    this.hasInsufficientStock = materials.some((m: any) => {
      const cached = this.materialOnHandCache.get(`${m.ItemNumber}_${m.SupplySubinventory}`);
      return cached && cached.AvailableToTransact <= 0;
    });
  }

  // ──── Backflush a Oracle Fusion + snapshot en backend IoT ────────────────────
  // Flujo: 0) cambio de tipos a manual → 1) operaciones secuencial →
  //         2) materiales + salidas (todas las ops) → 3) recursos (todas las ops) → 4) IoT

  async ConfirmDispatch() {
    if (!this.selectedWorkOrder || !this.completeGlobal || this.completeGlobal <= 0) {
      this.alerts.Warning('Ingrese una cantidad válida a despachar'); return;
    }

    const allOps = [...(this.selectedWorkOrder.Operations?.items || [])]
      .sort((a: any, b: any) => a.OperationSequenceNumber - b.OperationSequenceNumber);
    if (!allOps.length) { this.alerts.Warning('La orden de trabajo no tiene operaciones'); return; }

    const orgCode  = this.organizationSelected.Code;
    const woNumber = this.selectedWorkOrder.WorkOrderNumber;
    const isProcess = this.selectedWorkOrder._type === 'P';
    const ratio    = this.completeGlobal / (this.selectedWorkOrder.PlannedQuantity || 1);

    await this.alerts.ShowLoading();
    try {
      // ── PASO 0: Cambiar tipos de consumo a MANUAL en Fusion ─────────────────
      // Deshabilitado hasta confirmar los nombres exactos de los campos ID en la
      // API de Oracle Fusion (WorkOrderOperationId, ResourceUniqID, etc.).
      // if (isProcess) { await this.ChangeSupplyTypesToManual(...); }

      // ── PASO 1: Operaciones secuencialmente ─────────────────────────────────
      const { snapshotOps, opErrorsCount, anyOpFailed } =
        await this.PostOperationsSequentially(allOps, orgCode, woNumber);

      // ── PASO 2: Materiales + Salidas (todas las operaciones) ────────────────
      const matItems = this.BuildAllMaterialItems(orgCode, woNumber, ratio);
      const outItems = this.BuildAllOutputItems(allOps, orgCode, woNumber, ratio);
      const { snapshotMaterials, snapshotOutputs, materialErrorsCount, outputErrorsCount } =
        await this.PostMaterialsAndOutputs(matItems, outItems, anyOpFailed);

      // ── PASO 3: Recursos (todas las operaciones) ────────────────────────────
      const resItems = this.BuildAllResourceItems(orgCode, woNumber, ratio);
      const { snapshotResources, resourceErrorsCount } =
        await this.PostResources(resItems, anyOpFailed);

      // ── PASO 4: Snapshot en backend IoT ────────────────────────────────────
      const internalWoId = this.selectedWorkOrder.InternalWorkOrderId;
      if (!internalWoId) {
        this.alerts.Warning('No se pudo resolver el ID interno de la OT. Verifique que la orden exista en el sistema.');
        return;
      }

      const errorsCount = opErrorsCount + materialErrorsCount + outputErrorsCount + resourceErrorsCount;
      const errorsByPayload = {
        Operations: opErrorsCount,
        Materials:  materialErrorsCount,
        Outputs:    outputErrorsCount,
        Resources:  resourceErrorsCount
      };

      await this.apiService.PostRequestRender('workDispatch/batch', {
        WorkOrderId:      internalWoId,
        WorkOrderNumber:  woNumber,
        OrganizationId:   this.selectedWorkOrder.InternalOrganizationId ?? this.organizationSelected.OrganizationId,
        OrganizationCode: orgCode,
        CreatedBy:        this.userData?.UserId ?? null,
        ErrorsCount:      errorsCount,
        WorkExecutionIds: [],
        ErrorsByPayload:  errorsByPayload,
        Operations:       snapshotOps,
        Outputs:          snapshotOutputs,
        Materials:        snapshotMaterials,
        Resources:        snapshotResources
      }, false);

      if (errorsCount > 0) {
        const failedSections = Object.entries(errorsByPayload)
          .filter(([, n]) => n > 0).map(([s]) => s).join(', ');
        this.alerts.Warning(`Despacho parcial — errores en: ${failedSections}. Revise el historial.`);
      } else {
        await this.alerts.Success(`Despacho de la OT ${woNumber} registrado correctamente`);
        this.isModalOpen = false;
      }

      await this.LoadHistory();
    } finally {
      await this.alerts.HideLoading();
    }
  }

  // ── Paso 0: batch update SupplyType/ChargeType/CompletionType a MANUAL ──────
  // Los IDs de Fusion se obtienen con una consulta específica (wo_dispatch_ids)
  // para no contaminar la query principal de despacho.

  private async ChangeSupplyTypesToManual(woFusionId: string, allOps: any[]) {
    // Obtener IDs internos de Fusion para materiales, recursos y salidas
    let idsData: any = null;
    try {
      const raw = await this.apiService.GetRequestFusion(
        this.endPoints.Path('wo_dispatch_ids', this.organizationSelected.Code,
          this.selectedWorkOrder.WorkOrderNumber), false
      );
      idsData = raw ? JSON.parse(raw) : null;
    } catch {
      console.warn('No se pudieron obtener IDs para batch supply-type update');
      return;
    }

    const idsWO = idsData?.items?.[0];
    if (!idsWO) return;

    const opsWithIds: any[]  = idsWO.Operation?.items        || [];
    const matsWithIds: any[] = idsWO.ProcessWorkOrderMaterial?.items || [];
    const resWithIds: any[]  = idsWO.ProcessWorkOrderResource?.items || [];
    const outWithIds: any[]  = idsWO.ProcessWorkOrderOutput?.items   || [];

    const parts: any[] = [];
    let partId = 1;

    for (const op of allOps) {
      const opSeq    = op.OperationSequenceNumber;
      const opIdRow  = opsWithIds.find((o: any) => o.OperationSequenceNumber === opSeq);
      const opFusionId = opIdRow?.WorkOrderOperationId;
      if (!opFusionId) continue;

      matsWithIds
        .filter((m: any) => m.OperationSequenceNumber === opSeq && m.WorkOrderOperationMaterialId)
        .forEach((m: any) => parts.push({
          id: String(partId++),
          path: `/processWorkOrders/${woFusionId}/child/Operation/${opFusionId}/child/Material/${m.WorkOrderOperationMaterialId}`,
          operation: 'update', payload: { SupplyType: '1' }
        }));

      resWithIds
        .filter((r: any) => r.OperationSequenceNumber === opSeq && r.ResourceUniqID)
        .forEach((r: any) => parts.push({
          id: String(partId++),
          path: `/processWorkOrders/${woFusionId}/child/Operation/${opFusionId}/child/Resource/${r.ResourceUniqID}`,
          operation: 'update', payload: { ChargeType: 'MANUAL' }
        }));

      outWithIds
        .filter((o: any) => o.OperationSequenceNumber === opSeq && o.WorkOrderOutputId)
        .forEach((o: any) => parts.push({
          id: String(partId++),
          path: `/processWorkOrders/${woFusionId}/child/Operation/${opFusionId}/child/Output/${o.WorkOrderOutputId}`,
          operation: 'update', payload: { CompletionType: 'MANUAL' }
        }));
    }

    if (!parts.length) return;
    try {
      await this.apiService.PostRequestBatchFusion('', { parts });
    } catch {
      console.warn('Batch supply-type update failed, continuing with dispatch');
    }
  }

  // ── Paso 1: operaciones secuenciales ────────────────────────────────────────

  private async PostOperationsSequentially(
    allOps: any[], orgCode: string, woNumber: string
  ): Promise<{ snapshotOps: any[]; opErrorsCount: number; anyOpFailed: boolean }> {
    const snapshotOps: any[] = [];
    let opErrorsCount = 0;
    let anyOpFailed   = false;
    const lastSeq = allOps[allOps.length - 1].OperationSequenceNumber;

    for (const op of allOps) {
      const opSeq  = op.OperationSequenceNumber;
      const isLast = opSeq === lastSeq;
      const uom    = op.UnitOfMeasure || this.selectedWorkOrder.UoM;
      const opItems = this.BuildOpItems(opSeq, uom, orgCode, woNumber, isLast);

      if (anyOpFailed) {
        // No enviar — operación anterior falló
        opItems.forEach((item: any) => {
          snapshotOps.push({
            ...this.OpItemToSnapshot(item), TransactionSuccessfulFlag: false,
            Error: { ErrorMessages: 'Operación anterior falló — no enviada', ErrorMessageNames: '' }
          });
          opErrorsCount++;
        });
        continue;
      }

      const raw  = await this.apiService.PostRequestFusion('operationTransactions', {
        SourceSystemCode: 'FUSION_MOBILE', SourceSystemType: 'EXTERNAL',
        OperationTransactionDetail: opItems
      }, false);
      const resp = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;

      // Fusion puede responder con .items paginado o array directo
      const respItems: any[] = resp?.OperationTransactionDetail?.items ??
        (Array.isArray(resp?.OperationTransactionDetail) ? resp.OperationTransactionDetail : []);

      const hasErrors = resp?.ErrorsExistFlag === 'true' || respItems.some((d: any) => d.ErrorMessages);
      if (hasErrors) anyOpFailed = true;

      const errMap = new Map(
        respItems.filter((d: any) => d.ErrorMessages).map((d: any) => [d.ToDispatchState, d])
      );

      opItems.forEach((sent: any) => {
        const err    = errMap.get(sent.ToDispatchState);
        const failed = !!(err || (hasErrors && !errMap.size));
        if (failed) opErrorsCount++;
        snapshotOps.push({
          ...this.OpItemToSnapshot(sent),
          ...(err ? { Error: { ErrorMessages: err.ErrorMessages, ErrorMessageNames: err.ErrorMessageNames } }
               : failed ? { TransactionSuccessfulFlag: false, Error: { ErrorMessages: 'Error en operación', ErrorMessageNames: '' } } : {})
        });
      });
    }

    return { snapshotOps, opErrorsCount, anyOpFailed };
  }

  private BuildOpItems(opSeq: number, uom: string, orgCode: string, woNumber: string, isLast: boolean): any[] {
    const base = {
      SourceSystemCode: 'FUSION_MOBILE', OrganizationCode: orgCode,
      TransactionUnitOfMeasure: uom, WoOperationSequenceNumber: opSeq,
      WorkOrderNumber: woNumber, FromDispatchState: 'READY'
    };
    const items: any[] = [{ ...base, TransactionQuantity: this.completeGlobal, ToDispatchState: 'COMPLETE' }];
    if (isLast && this.scrapGlobal  > 0)
      items.push({ ...base, TransactionQuantity: this.scrapGlobal,  ToDispatchState: 'SCRAP'  });
    if (isLast && this.rejectGlobal > 0)
      items.push({ ...base, TransactionQuantity: this.rejectGlobal, ToDispatchState: 'REJECT' });
    return items;
  }

  private OpItemToSnapshot(sent: any): any {
    return {
      WoOperationSequenceNumber: sent.WoOperationSequenceNumber,
      TransactionQuantity:       sent.TransactionQuantity,
      TransactionUnitOfMeasure:  sent.TransactionUnitOfMeasure,
      FromDispatchState:         sent.FromDispatchState,
      ToDispatchState:           sent.ToDispatchState
    };
  }

  // ── Paso 2: materiales + salidas ────────────────────────────────────────────

  private BuildAllMaterialItems(orgCode: string, woNumber: string, ratio: number): any[] {
    return (this.selectedWorkOrder.Materials?.items || []).map((m: any) => ({
      OrganizationCode: orgCode, WorkOrderNumber: woNumber,
      WoOperationSequenceNumber: m.OperationSequenceNumber,
      TransactionTypeCode: 'MATERIAL_ISSUE',
      InventoryItemNumber: m.ItemNumber,
      TransactionQuantity: Round((m.Quantity || 0) * ratio),
      TransactionUnitOfMeasure: m.UOMCode,
      SubinventoryCode: m.SupplySubinventory,
      TransactionLot: m.LotNumber
        ? [{ LotNumber: m.LotNumber, TransactionQuantity: Round((m.Quantity || 0) * ratio) }] : []
    }));
  }

  private BuildAllOutputItems(allOps: any[], orgCode: string, woNumber: string, ratio: number): any[] {
    if (this.selectedWorkOrder.Outputs?.items?.length) {
      // Proceso: salidas definidas en la OT (pueden ser varias por operación)
      return (this.selectedWorkOrder.Outputs.items as any[]).map((out: any) => ({
        OrganizationCode: orgCode, WorkOrderNumber: woNumber,
        WoOperationSequenceNumber: out.OperationSequenceNumber,
        TransactionTypeCode: 'PRODUCT_COMPLETION',
        InventoryItemNumber: out.ItemNumber,
        TransactionQuantity: Round((out.OutputQuantity || 0) * ratio),
        TransactionUnitOfMeasure: out.UOMCode,
        SubinventoryCode: out.ComplSubinventoryCode || '',
        TransactionLot: []
      }));
    }
    // Discreta: una salida del producto principal en la última operación
    const lastOp = allOps[allOps.length - 1];
    return lastOp ? [{
      OrganizationCode: orgCode, WorkOrderNumber: woNumber,
      WoOperationSequenceNumber: lastOp.OperationSequenceNumber,
      TransactionTypeCode: 'PRODUCT_COMPLETION',
      InventoryItemNumber: this.selectedWorkOrder.ItemNumber,
      TransactionQuantity: this.completeGlobal,
      TransactionUnitOfMeasure: this.selectedWorkOrder.UoM,
      SubinventoryCode: '', TransactionLot: []
    }] : [];
  }

  private async PostMaterialsAndOutputs(
    matItems: any[], outItems: any[], skipFusion: boolean
  ): Promise<{ snapshotMaterials: any[]; snapshotOutputs: any[]; materialErrorsCount: number; outputErrorsCount: number }> {
    let materialErrorsCount = 0;
    let outputErrorsCount   = 0;

    if (skipFusion) {
      // Alguna operación falló — no enviar a Fusion
      const markFailed = (items: any[]) => items.map(s => ({
        ...s, TransactionSuccessfulFlag: false,
        Error: { ErrorMessages: 'Operación anterior falló — no enviada', ErrorMessageNames: '' }
      }));
      materialErrorsCount = matItems.length;
      outputErrorsCount   = outItems.length;
      return { snapshotMaterials: markFailed(matItems), snapshotOutputs: markFailed(outItems),
               materialErrorsCount, outputErrorsCount };
    }

    if (!matItems.length && !outItems.length) {
      return { snapshotMaterials: [], snapshotOutputs: [], materialErrorsCount: 0, outputErrorsCount: 0 };
    }

    const raw  = await this.apiService.PostRequestFusion('materialTransactions', {
      SourceSystemCode: 'FUSION_MOBILE', SourceSystemType: 'EXTERNAL',
      MaterialTransactionDetail: [...matItems, ...outItems]
    }, false);
    const resp = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;

    const respItems: any[] = resp?.MaterialTransactionDetail?.items ??
      (Array.isArray(resp?.MaterialTransactionDetail) ? resp.MaterialTransactionDetail : []);
    const globalError = resp?.ErrorsExistFlag === 'true' && !respItems.some((d: any) => d.ErrorMessages);
    const errMap = new Map(respItems.filter((d: any) => d.ErrorMessages).map((d: any) => [d.InventoryItemNumber, d]));

    const mapItem = (sent: any, isOutput: boolean) => {
      const err    = errMap.get(sent.InventoryItemNumber);
      const failed = !!(err || globalError);
      if (failed) isOutput ? outputErrorsCount++ : materialErrorsCount++;
      const base: any = {
        WoOperationSequenceNumber: sent.WoOperationSequenceNumber,
        InventoryItemNumber:       sent.InventoryItemNumber,
        SubinventoryCode:          sent.SubinventoryCode,
        TransactionQuantity:       sent.TransactionQuantity,
        TransactionUnitOfMeasure:  sent.TransactionUnitOfMeasure,
        TransactionTypeCode:       sent.TransactionTypeCode,
        TransactionLot:            sent.TransactionLot ?? []
      };
      if (err) {
        base.Error = { ErrorMessages: err.ErrorMessages, ErrorMessageNames: err.ErrorMessageNames };
      } else if (globalError) {
        base.TransactionSuccessfulFlag = false;
        base.Error = { ErrorMessages: isOutput ? 'Error en salida' : 'Error en material', ErrorMessageNames: '' };
      }
      return base;
    };

    return {
      snapshotMaterials: matItems.map(s => mapItem(s, false)),
      snapshotOutputs:   outItems.map(s => mapItem(s, true)),
      materialErrorsCount, outputErrorsCount
    };
  }

  // ── Paso 3: recursos ────────────────────────────────────────────────────────

  private BuildAllResourceItems(orgCode: string, woNumber: string, ratio: number): any[] {
    return (this.selectedWorkOrder.Resources?.items || []).map((r: any) => ({
      ResourceCode:             r.ResourceCode,
      TransactionUnitOfMeasure: r.UOMCode,
      OperationSequenceNumber:  r.OperationSequenceNumber,
      OrganizationCode:         orgCode,
      TransactionTypeCode:      'RESOURCE_CHARGE',
      TransactionQuantity:      Round((r.RequiredUsage || 0) * ratio),
      WorkOrderNumber:          woNumber,
      ResourceSequenceNumber:   r.ResourceSequenceNumber
    }));
  }

  private async PostResources(
    resItems: any[], skipFusion: boolean
  ): Promise<{ snapshotResources: any[]; resourceErrorsCount: number }> {
    if (!resItems.length) return { snapshotResources: [], resourceErrorsCount: 0 };

    if (skipFusion) {
      return {
        snapshotResources: resItems.map(s => ({
          ...s, TransactionSuccessfulFlag: false,
          Error: { ErrorMessages: 'Operación anterior falló — no enviada', ErrorMessageNames: '' }
        })),
        resourceErrorsCount: resItems.length
      };
    }

    const raw  = await this.apiService.PostRequestFusion('resourceTransactions', {
      SourceSystemCode: 'FUSION_MOBILE', SourceSystemType: 'EXTERNAL',
      ResourceTransactionDetail: resItems
    }, false);
    const resp = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;

    const respItems: any[] = resp?.ResourceTransactionDetail?.items ??
      (Array.isArray(resp?.ResourceTransactionDetail) ? resp.ResourceTransactionDetail : []);
    const globalError = resp?.ErrorsExistFlag === 'true' && !respItems.some((d: any) => d.ErrorMessages);
    const errMap = new Map(respItems.filter((d: any) => d.ErrorMessages).map((d: any) => [d.ResourceCode, d]));

    let resourceErrorsCount = 0;
    const snapshotResources = resItems.map((sent: any) => {
      const err    = errMap.get(sent.ResourceCode);
      const failed = !!(err || globalError);
      if (failed) resourceErrorsCount++;
      const base: any = {
        OperationSequenceNumber:  sent.OperationSequenceNumber,
        ResourceCode:             sent.ResourceCode,
        TransactionQuantity:      sent.TransactionQuantity,
        TransactionUnitOfMeasure: sent.TransactionUnitOfMeasure,
        TransactionTypeCode:      sent.TransactionTypeCode
      };
      if (err) {
        base.Error = { ErrorMessages: err.ErrorMessages, ErrorMessageNames: err.ErrorMessageNames };
      } else if (globalError) {
        base.TransactionSuccessfulFlag = false;
        base.Error = { ErrorMessages: 'Error en recurso', ErrorMessageNames: '' };
      }
      return base;
    });

    return { snapshotResources, resourceErrorsCount };
  }

  // ──── Helpers para el diálogo de detalle (agrupación por operación) ──────────
  // El RequestPayload tiene Operations[], Resources[] y Materials[] planos.
  // El detalle se muestra agrupado por WoOperationSequenceNumber, igual que el modal de despacho.

  DetailSequences(): number[] {
    if (!this.detailPayload) return [];
    const seqs = new Set<number>();
    (this.detailPayload.Operations || []).forEach((o: any) => seqs.add(o.WoOperationSequenceNumber));
    (this.detailPayload.Resources  || []).forEach((r: any) => seqs.add(r.OperationSequenceNumber));
    (this.detailPayload.Materials  || []).forEach((m: any) => seqs.add(m.WoOperationSequenceNumber));
    (this.detailPayload.Outputs    || []).forEach((o: any) => seqs.add(o.WoOperationSequenceNumber));
    return Array.from(seqs).sort((a, b) => a - b);
  }

  DetailOpsForSeq(seq: number): any[] {
    return (this.detailPayload?.Operations || []).filter((o: any) => o.WoOperationSequenceNumber === seq);
  }

  // Outputs = array separado del payload (PRODUCT_COMPLETION)
  DetailOutputsForSeq(seq: number): any[] {
    return (this.detailPayload?.Outputs || []).filter((o: any) => o.WoOperationSequenceNumber === seq);
  }

  // Materials = solo MATERIAL_ISSUE
  DetailMaterialsForSeq(seq: number): any[] {
    return (this.detailPayload?.Materials || []).filter((m: any) => m.WoOperationSequenceNumber === seq);
  }

  DetailResourcesForSeq(seq: number): any[] {
    return (this.detailPayload?.Resources || []).filter((r: any) => r.OperationSequenceNumber === seq);
  }

  // Etiqueta legible para el ToDispatchState de cada fila de operación
  DispatchLabel(toDispatchState: string): string {
    if (toDispatchState === 'COMPLETE') return 'COMPLETO';
    if (toDispatchState === 'SCRAP')    return 'DESPERDICIO';
    if (toDispatchState === 'REJECT')   return 'RECHAZO';
    return toDispatchState;
  }

  LotLabel(transactionLot: any[]): string {
    if (!transactionLot?.length) return '';
    return transactionLot.map((l: any) => l.LotNumber).join(', ');
  }

  // ──── Utilidades ──────────────────────────────────────────────────────────────

  ResetAll() {
    this.selectedWorkOrder = null;
    this.matchList = [];
    this.completeGlobal = 0;
    this.scrapGlobal = 0;
    this.rejectGlobal = 0;
    this.isModalOpen = false;
    this.scanValue = '';
    this.FocusScanInput();
  }

  ClearScan() {
    this.scanValue = '';
    this.FocusScanInput();
  }

  async CopyScan() {
    if (!this.scanValue) return;
    try {
      await navigator.clipboard.writeText(this.scanValue);
      this.alerts.Success('Código copiado');
    } catch {
      // El clipboard puede estar bloqueado en algunos contextos nativos
    }
  }

  private FocusScanInput() {
    setTimeout(() => this.scanInputRef?.nativeElement?.focus(), 100);
  }

  private LastOperation(): any {
    const operations = this.selectedWorkOrder?.Operations?.items || [];
    if (!operations.length) return null;
    // El backflush móvil completa únicamente la última operación del ruteo (estación de escaneo).
    return [...operations].sort((a: any, b: any) => a.OperationSequenceNumber - b.OperationSequenceNumber).pop();
  }

  // trackBy evita que *ngFor recree nodos del DOM cuando los objetos no cambian de identidad
  trackByOperation = (_: number, op: any) => op.OperationSequenceNumber;
  trackByItem = (_: number, item: any) => item.ItemNumber ?? item.ResourceCode ?? _;
  trackByDispatch = (_: number, d: any) => d.WorkDispatchId;

  protected readonly ToggleMenu = ToggleMenu;
  protected readonly Truncate = Truncate;
}
