(function () {
  'use strict';

  var money = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  var sales = [
    { id:1, name:'Web La Terraza', client:'Restaurante La Terraza', base:1450, paid:50, irpf:true, iva:true, extra:0, date:'28 jun', status:'50% cobrado' },
    { id:2, name:'Web Bodega Norte', client:'Bodega Norte', base:980, paid:100, irpf:true, iva:true, extra:0, date:'24 jun', status:'Completada' },
    { id:3, name:'Web Casa Limón', client:'Casa Limón', base:1250, paid:100, irpf:true, iva:true, extra:0, date:'19 jun', status:'Completada' },
    { id:4, name:'Carta digital Mar y Sal', client:'Mar y Sal', base:760, paid:50, irpf:false, iva:true, extra:0, date:'14 jun', status:'50% cobrado' },
    { id:5, name:'Web El Olivo', client:'El Olivo', base:1200, paid:100, irpf:true, iva:true, extra:0, date:'8 jun', status:'Completada' },
    { id:6, name:'Web Brasa', client:'Brasa Cocina', base:850, paid:100, irpf:true, iva:true, extra:0, date:'3 jun', status:'Completada' }
  ];
  var expenses = [
    { id:1, name:'Fotografía La Terraza', category:'Fotografía', type:'business', amount:170, date:'27 jun', method:'Transferencia', deductible:true },
    { id:2, name:'Framer Pro', category:'Suscripciones', type:'business', amount:94, date:'25 jun', method:'Tarjeta', deductible:true },
    { id:3, name:'Impresión códigos QR', category:'Impresión QR', type:'business', amount:48.20, date:'22 jun', method:'Tarjeta', deductible:true },
    { id:4, name:'Reloj Festina', category:'Ocio y lujos', type:'personal', amount:170, date:'18 jun', method:'Tarjeta', deductible:false },
    { id:5, name:'Zapatillas running', category:'Deporte', type:'personal', amount:139.90, date:'12 jun', method:'Tarjeta', deductible:false },
    { id:6, name:'Comida', category:'Comida', type:'personal', amount:86.45, date:'7 jun', method:'Efectivo', deductible:false }
  ];
  var clients = [
    { initials:'LT', name:'La Terraza', contact:'Marta Ruiz', email:'marta@laterraza.es', nif:'B-67291034', sales:2, billed:2480 },
    { initials:'BN', name:'Bodega Norte', contact:'Álvaro Gil', email:'hola@bodeganorte.es', nif:'B-10458923', sales:1, billed:980 },
    { initials:'CL', name:'Casa Limón', contact:'Carmen León', email:'carmen@casalimon.es', nif:'B-56420188', sales:1, billed:1250 },
    { initials:'MS', name:'Mar y Sal', contact:'Diego Serra', email:'diego@marysal.es', nif:'B-87012540', sales:1, billed:760 },
    { initials:'EO', name:'El Olivo', contact:'Nuria Sol', email:'nuria@elolivo.es', nif:'B-45339021', sales:1, billed:1200 },
    { initials:'BC', name:'Brasa Cocina', contact:'Luis Mora', email:'luis@brasa.es', nif:'B-88522014', sales:1, billed:850 }
  ];

  function calcSale(sale) {
    var paidBase = sale.base * sale.paid / 100;
    var irpf = sale.irpf ? paidBase * 0.09 : 0;
    var iva = sale.iva ? paidBase * 0.21 : 0;
    var extra = paidBase * (sale.extra || 0) / 100;
    return { paidBase:paidBase, irpf:irpf, iva:iva, extra:extra, net:paidBase-irpf-extra, clientPaid:paidBase+iva-irpf-extra };
  }
  function totals() {
    var income = sales.reduce(function (sum, sale) { return sum + calcSale(sale).net; }, 0);
    var iva = sales.reduce(function (sum, sale) { return sum + calcSale(sale).iva; }, 0);
    var irpf = sales.reduce(function (sum, sale) { return sum + calcSale(sale).irpf; }, 0);
    var expense = expenses.reduce(function (sum, item) { return sum + item.amount; }, 0);
    return { income:income, iva:iva, irpf:irpf, expense:expense, available:income-expense };
  }
  function setText(id, value) { var el=document.getElementById(id); if(el) el.textContent=value; }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, function (char) { return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[char]; }); }

  function renderTotals() {
    var t=totals();
    setText('available-balance', money.format(t.available));
    setText('income-total', money.format(t.income));
    setText('expense-total', '−'+money.format(t.expense));
    setText('vat-total', money.format(t.iva));
    setText('irpf-total', money.format(t.irpf));
    setText('sales-net-metric', money.format(t.income));
    setText('expenses-metric', money.format(t.expense));
    setText('business-expenses', money.format(expenses.filter(function(e){return e.type==='business';}).reduce(function(a,b){return a+b.amount;},0)));
    setText('personal-expenses', money.format(expenses.filter(function(e){return e.type==='personal';}).reduce(function(a,b){return a+b.amount;},0)));
    setText('tax-vat-card', money.format(t.iva));
    setText('tax-irpf-card', money.format(t.irpf));
    setText('donut-total', money.format(t.expense).replace(',00',''));
  }

  function renderMovements(filter) {
    var list=document.getElementById('movement-list'); if(!list) return;
    var rows=[];
    sales.forEach(function(s){ var c=calcSale(s); rows.push({name:s.name,meta:s.client+' · '+s.date,amount:c.net,type:'business',kind:'sale',date:s.id+20}); });
    expenses.forEach(function(e){ rows.push({name:e.name,meta:e.category+' · '+e.date,amount:-e.amount,type:e.type,kind:e.type,date:e.id+10}); });
    rows=rows.filter(function(r){return !filter||filter==='all'||r.type===filter;}).sort(function(a,b){return b.date-a.date;}).slice(0,6);
    list.innerHTML=rows.map(function(row){
      var initials=row.kind==='sale'?'↗':row.type==='business'?'N':'P';
      return '<div class="movement-row"><span class="movement-logo '+row.kind+' '+row.type+'">'+initials+'</span><div class="movement-main"><strong>'+escapeHtml(row.name)+'</strong><span>'+escapeHtml(row.meta)+'</span></div><div class="movement-amount"><strong class="'+(row.amount>0?'positive':'')+'">'+(row.amount>0?'+':'−')+money.format(Math.abs(row.amount))+'</strong><small>'+(row.amount>0?'beneficio neto':'confirmado')+'</small></div></div>';
    }).join('');
  }

  function renderLegend() {
    var cats=[
      {name:'Personal',amount:396.35,color:'#de654f'}, {name:'Fotografía',amount:170,color:'#4d7f91'},
      {name:'Suscripciones',amount:94,color:'#e6b94a'}, {name:'Impresión QR',amount:48.20,color:'#7567a8'}, {name:'Otros',amount:0,color:'#8a9a90'}
    ];
    var total=expenses.reduce(function(a,b){return a+b.amount;},0);
    var markup=cats.map(function(c){return '<div class="legend-item"><i style="background:'+c.color+'"></i><span>'+c.name+'</span><strong>'+Math.round(c.amount/total*100)+'%</strong></div>';}).join('');
    var home=document.getElementById('category-legend'); if(home) home.innerHTML=markup;
    var stats=document.getElementById('stats-legend'); if(stats) stats.innerHTML=markup;
  }

  function renderChart(id, values, grouped) {
    var chart=document.getElementById(id); if(!chart) return;
    var max=Math.max.apply(null, values.map(function(v){return Math.max(v[1],v[2]||0);}));
    chart.innerHTML=values.map(function(v){ var first=Math.max(8,Math.round(v[1]/max*86)); var second=v[2]!=null?'<i class="expense" style="height:'+Math.max(5,Math.round(v[2]/max*86))+'%"></i>':''; return '<div class="bar-column"><i style="height:'+first+'%"></i>'+second+'<span>'+v[0]+'</span></div>'; }).join('');
  }

  function renderSales() {
    var table=document.getElementById('sales-table'); if(!table) return;
    var header='<div class="table-row header"><span>Venta / cliente</span><span>Base</span><span>Cobrado</span><span>Beneficio real</span><span>Estado</span><span></span></div>';
    var rows=sales.map(function(s){var c=calcSale(s); return '<div class="table-row"><div class="cell-main"><span class="movement-logo sale">'+s.client.slice(0,2).toUpperCase()+'</span><div><strong>'+escapeHtml(s.name)+'</strong><small>'+escapeHtml(s.client)+' · '+s.date+'</small></div></div><strong>'+money.format(s.base)+'</strong><span>'+s.paid+'% · '+money.format(c.clientPaid)+'</span><strong>'+money.format(c.net)+'</strong><span class="badge '+(s.paid===100?'done':'partial')+'">'+s.status+'</span><button class="icon-button">···</button></div>';}).join('');
    table.innerHTML=header+rows;
  }

  function renderExpenses(filter) {
    var table=document.getElementById('expenses-table'); if(!table) return;
    var visible=expenses.filter(function(e){return !filter||filter==='all'||e.type===filter;});
    var header='<div class="table-row header"><span>Gasto</span><span>Categoría</span><span>Tipo</span><span>Método</span><span>Importe</span><span></span></div>';
    table.innerHTML=header+visible.map(function(e){return '<div class="table-row"><div class="cell-main"><span class="movement-logo '+e.type+'">'+(e.type==='business'?'N':'P')+'</span><div><strong>'+escapeHtml(e.name)+'</strong><small>'+e.date+(e.deductible?' · Deducible':'')+'</small></div></div><span>'+e.category+'</span><span class="badge '+e.type+'">'+(e.type==='business'?'Negocio':'Personal')+'</span><span>'+e.method+'</span><strong>−'+money.format(e.amount)+'</strong><button class="icon-button">···</button></div>';}).join('');
  }

  function renderTaxTables() {
    ['vat','irpf'].forEach(function(kind){ var table=document.getElementById(kind+'-table'); if(!table)return; var label=kind==='vat'?'IVA':'IRPF'; table.innerHTML='<div class="table-row header"><span>Venta</span><span>Base cobrada</span><span>'+label+'</span></div>'+sales.map(function(s){var c=calcSale(s); var amount=kind==='vat'?c.iva:c.irpf; return '<div class="table-row"><div><strong>'+escapeHtml(s.name)+'</strong><small style="display:block;color:var(--muted)">'+s.date+'</small></div><span>'+money.format(c.paidBase)+'</span><strong>'+(amount?money.format(amount):'Desactivado')+'</strong></div>';}).join(''); });
  }

  function renderClients() {
    var grid=document.getElementById('client-grid'); if(!grid)return;
    grid.innerHTML=clients.map(function(c){return '<article class="client-card"><div class="client-top"><div class="client-id"><span class="avatar">'+c.initials+'</span><div><strong>'+escapeHtml(c.name)+'</strong><p>'+escapeHtml(c.contact)+'</p></div></div><button class="icon-button">···</button></div><div class="client-stats"><div><span>Ventas</span><strong>'+c.sales+'</strong></div><div><span>Base facturada</span><strong>'+money.format(c.billed)+'</strong></div></div><p style="color:var(--muted);font-size:10px;margin:16px 0 0">'+c.email+' · '+c.nif+'</p></article>';}).join('');
  }

  function renderAll() { renderTotals(); renderMovements('all'); renderLegend(); renderSales(); renderExpenses('all'); renderTaxTables(); renderClients(); renderChart('home-chart',[['Ene',1520],['Feb',1880],['Mar',1610],['Abr',2390],['May',2890],['Jun',3773]]); renderChart('stats-chart',[['Abr',3150,980],['May',3520,1120],['Jun',4935,1161]],true); }

  var pageMeta={
    inicio:['Resumen financiero','Buenos días, Bosco'], ventas:['Ingresos','Ventas y cobros'], gastos:['Salidas','Gastos'],
    impuestos:['Fiscalidad','Impuestos'], estadisticas:['Análisis','Estadísticas'], clientes:['Relaciones','Clientes'], objetivos:['Planificación','Objetivos'], ajustes:['Preferencias','Ajustes']
  };
  function navigate(view) {
    document.querySelectorAll('.view').forEach(function(el){el.classList.toggle('active',el.id===view);});
    document.querySelectorAll('[data-view]').forEach(function(el){el.classList.toggle('active',el.getAttribute('data-view')===view);});
    var meta=pageMeta[view]||pageMeta.inicio; setText('eyebrow',meta[0]); setText('page-title',meta[1]);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function saleForm(model) {
    return '<form id="sale-form" class="form-grid"><div class="field full"><label>Modelo de venta</label><select id="sale-template"><option>Venta personalizada</option><option'+(model?' selected':'')+'>Web restaurante completa</option><option>Carta digital + QR</option><option>Mantenimiento mensual</option></select></div><div class="field full"><label>Nombre de la venta</label><input id="sale-name" required value="'+(model?'Web restaurante completa':'')+'" placeholder="Ej. Web Restaurante Mirador"></div><div class="field full"><label>Cliente</label><input id="sale-client" required placeholder="Nombre del cliente"></div><div class="field"><label>Precio base sin IVA</label><input id="sale-base" type="number" min="0" step="0.01" value="'+(model?'950':'1000')+'"></div><div class="field"><label>Porcentaje cobrado ahora</label><select id="sale-paid"><option value="50">50% · Inicio</option><option value="100">100% · Completo</option><option value="25">25%</option><option value="75">75%</option></select></div><div class="field"><label>Fecha de cobro</label><input type="date" value="2026-06-30"></div><div class="field"><label>Método de pago</label><select><option>Transferencia</option><option>Tarjeta</option><option>Efectivo</option><option>Bizum</option></select></div><div class="form-section"><h3>Impuestos de esta venta</h3><p>Puedes desactivarlos aquí sin cambiar el resto de ventas.</p><div class="tax-toggle"><div><strong>IVA · 21%</strong><small>Se separa y no entra en tu saldo disponible</small></div><label class="switch"><input id="sale-iva" type="checkbox" checked><span></span></label></div><div class="tax-toggle"><div><strong>IRPF · 9%</strong><small>Se descuenta del beneficio real</small></div><label class="switch"><input id="sale-irpf" type="checkbox" checked><span></span></label></div></div><div class="field full"><label>Impuesto o retención adicional (%)</label><input id="sale-extra" type="number" min="0" step="0.1" value="0"></div><div class="calculation-box"><div class="calc-row"><span>Base cobrada ahora</span><strong id="calc-base">500,00 €</strong></div><div class="calc-row"><span>IVA separado</span><strong id="calc-iva">105,00 €</strong></div><div class="calc-row"><span>IRPF aplicado</span><strong id="calc-irpf">−45,00 €</strong></div><div class="calc-row"><span>El cliente paga ahora</span><strong id="calc-client">560,00 €</strong></div><div class="calc-row total"><span>Entra en dinero disponible</span><strong id="calc-net">455,00 €</strong></div><div class="calc-note">Solo se suma el pago confirmado. El segundo 50% se añadirá cuando marques que lo has cobrado.</div></div><div class="field full"><label>Descripción y notas</label><textarea placeholder="Detalles, condiciones o próximos pasos"></textarea></div><div class="field full"><label>Visibilidad</label><select><option>Visible para todos los miembros</option><option>Solo yo</option><option>Elegir miembros...</option></select></div><div class="drawer-footer"><button type="button" class="secondary-button" data-close-drawer>Cancelar</button><button type="submit" class="primary-button">Guardar venta</button></div></form>';
  }
  function expenseForm() {
    return '<form id="expense-form" class="form-grid"><div class="field full"><label>Nombre del gasto</label><input id="expense-name" required placeholder="Ej. Reloj Festina"></div><div class="field"><label>Importe</label><input id="expense-amount" required type="number" min="0" step="0.01" placeholder="0,00"></div><div class="field"><label>Tipo</label><select id="expense-type"><option value="business">Negocio</option><option value="personal">Personal</option></select></div><div class="field"><label>Categoría</label><select id="expense-category"><option>Suscripciones</option><option>Fotografía</option><option>Impresión QR</option><option>Equipamiento</option><option>Comida</option><option>Ropa</option><option>Deporte</option><option>Ocio y lujos</option><option>Otros</option></select></div><div class="field"><label>Subcategoría</label><input placeholder="Opcional"></div><div class="field"><label>Fecha</label><input type="date" value="2026-06-30"></div><div class="field"><label>Método de pago</label><select id="expense-method"><option>Tarjeta</option><option>Transferencia</option><option>Efectivo</option><option>Bizum</option></select></div><div class="tax-toggle full"><div><strong>Marcar como deducible</strong><small>Solo para identificar y filtrar</small></div><label class="switch"><input id="expense-deductible" type="checkbox"><span></span></label></div><div class="tax-toggle full"><div><strong>Convertir en gasto recurrente</strong><small>Clario te avisará y tú confirmarás cada pago</small></div><label class="switch"><input type="checkbox"><span></span></label></div><div class="field full"><label>Descripción</label><textarea placeholder="Añade cualquier detalle que quieras recordar"></textarea></div><label class="file-drop">＋ Adjuntar factura, recibo o fotografía<input type="file" accept="image/*,.pdf" hidden></label><div class="field full"><label>Visibilidad</label><select><option>Visible para todos los miembros</option><option>Solo yo</option><option>Elegir miembros...</option></select></div><div class="drawer-footer"><button type="button" class="secondary-button" data-close-drawer>Cancelar</button><button type="submit" class="primary-button">Confirmar gasto</button></div></form>';
  }

  function updateSaleCalculation() {
    var base=Number(document.getElementById('sale-base').value)||0; var paid=Number(document.getElementById('sale-paid').value)||0; var paidBase=base*paid/100;
    var iva=document.getElementById('sale-iva').checked?paidBase*.21:0; var irpf=document.getElementById('sale-irpf').checked?paidBase*.09:0; var extra=paidBase*(Number(document.getElementById('sale-extra').value)||0)/100;
    setText('calc-base',money.format(paidBase)); setText('calc-iva',money.format(iva)); setText('calc-irpf','−'+money.format(irpf)); setText('calc-client',money.format(paidBase+iva-irpf-extra)); setText('calc-net',money.format(paidBase-irpf-extra));
  }
  function openDrawer(type,model) {
    setText('drawer-eyebrow',type==='sale'?'Cobro real':'Salida de dinero'); setText('drawer-title',type==='sale'?'Registrar venta':'Registrar gasto');
    document.getElementById('drawer-body').innerHTML=type==='sale'?saleForm(model):expenseForm(); document.getElementById('drawer').classList.add('open'); document.getElementById('drawer-backdrop').classList.add('open'); document.getElementById('drawer').setAttribute('aria-hidden','false');
    if(type==='sale'){['sale-base','sale-paid','sale-iva','sale-irpf','sale-extra'].forEach(function(id){document.getElementById(id).addEventListener('input',updateSaleCalculation);}); updateSaleCalculation(); document.getElementById('sale-form').addEventListener('submit',saveSale);} else {document.getElementById('expense-form').addEventListener('submit',saveExpense);}
  }
  function closeDrawer(){document.getElementById('drawer').classList.remove('open');document.getElementById('drawer-backdrop').classList.remove('open');document.getElementById('drawer').setAttribute('aria-hidden','true');}
  function saveSale(event){event.preventDefault(); sales.unshift({id:Date.now(),name:document.getElementById('sale-name').value,client:document.getElementById('sale-client').value,base:Number(document.getElementById('sale-base').value),paid:Number(document.getElementById('sale-paid').value),irpf:document.getElementById('sale-irpf').checked,iva:document.getElementById('sale-iva').checked,extra:Number(document.getElementById('sale-extra').value)||0,date:'Hoy',status:document.getElementById('sale-paid').value==='100'?'Completada':document.getElementById('sale-paid').value+'% cobrado'}); closeDrawer();renderAll();showToast('Venta guardada. El saldo real ya está actualizado.');}
  function saveExpense(event){event.preventDefault();expenses.unshift({id:Date.now(),name:document.getElementById('expense-name').value,category:document.getElementById('expense-category').value,type:document.getElementById('expense-type').value,amount:Number(document.getElementById('expense-amount').value),date:'Hoy',method:document.getElementById('expense-method').value,deductible:document.getElementById('expense-deductible').checked});closeDrawer();renderAll();showToast('Gasto confirmado y restado del dinero disponible.');}
  function showToast(message){var toast=document.getElementById('toast');toast.textContent=message;toast.classList.add('show');clearTimeout(window.clarioToast);window.clarioToast=setTimeout(function(){toast.classList.remove('show');},2600);}
  function setTheme(theme){ if(theme==='system')theme=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.body.classList.toggle('dark',theme==='dark');localStorage.setItem('clario-theme',theme); }

  document.addEventListener('click',function(event){
    var viewTarget=event.target.closest('[data-view]'); if(viewTarget){event.preventDefault();navigate(viewTarget.getAttribute('data-view'));}
    var drawerTarget=event.target.closest('[data-open-drawer]'); if(drawerTarget)openDrawer(drawerTarget.getAttribute('data-open-drawer'));
    if(event.target.closest('[data-close-drawer]'))closeDrawer();
    var moveFilter=event.target.closest('[data-movement-filter]'); if(moveFilter){document.querySelectorAll('[data-movement-filter]').forEach(function(b){b.classList.remove('active');});moveFilter.classList.add('active');renderMovements(moveFilter.getAttribute('data-movement-filter'));}
    var expenseFilter=event.target.closest('#expense-type-filter button'); if(expenseFilter){document.querySelectorAll('#expense-type-filter button').forEach(function(b){b.classList.remove('active');});expenseFilter.classList.add('active');renderExpenses(expenseFilter.getAttribute('data-type'));}
    var settings=event.target.closest('[data-settings]'); if(settings){var panel=settings.getAttribute('data-settings');document.querySelectorAll('[data-settings]').forEach(function(b){b.classList.toggle('active',b===settings);});document.querySelectorAll('[data-settings-panel]').forEach(function(p){p.classList.toggle('active',p.getAttribute('data-settings-panel')===panel);});}
    var theme=event.target.closest('[data-theme]'); if(theme){setTheme(theme.getAttribute('data-theme'));document.querySelectorAll('[data-theme]').forEach(function(b){b.classList.toggle('active',b===theme);});}
    var accept=event.target.closest('.goal-accept'); if(accept){accept.textContent='Añadido';accept.disabled=true;showToast('Objetivo añadido a tu planificación.');}
  });
  document.getElementById('close-drawer').addEventListener('click',closeDrawer); document.getElementById('drawer-backdrop').addEventListener('click',closeDrawer);
  document.getElementById('theme-toggle').addEventListener('click',function(){setTheme(document.body.classList.contains('dark')?'light':'dark');});
  document.getElementById('notification-toggle').addEventListener('click',function(){document.getElementById('notification-popover').classList.toggle('open');});
  document.getElementById('close-notifications').addEventListener('click',function(){document.getElementById('notification-popover').classList.remove('open');});
  document.getElementById('sale-model-button').addEventListener('click',function(){openDrawer('sale',true);});
  document.getElementById('confirm-recurring').addEventListener('click',function(){expenses.unshift({id:Date.now(),name:'Adobe Creative Cloud',category:'Suscripciones',type:'business',amount:66.55,date:'Hoy',method:'Tarjeta',deductible:true});document.querySelector('.recurring-band').style.display='none';renderAll();showToast('Pago recurrente confirmado.');});
  document.getElementById('skip-recurring').addEventListener('click',function(){document.querySelector('.recurring-band').style.display='none';showToast('Recordatorio omitido. No se ha restado nada.');});
  ['new-client-button','new-goal-button','invite-button'].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener('click',function(){showToast('Esta acción estará disponible en el siguiente prototipo.');});});
  document.getElementById('export-button').addEventListener('click',function(){showToast('Excel preparado con las secciones y fechas elegidas.');});

  var deferredInstall;
  window.addEventListener('beforeinstallprompt',function(event){event.preventDefault();deferredInstall=event;});
  document.getElementById('install-button').addEventListener('click',function(){if(deferredInstall){deferredInstall.prompt();}else{showToast('En móvil, usa “Añadir a pantalla de inicio”.');}});
  if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}
  setTheme(localStorage.getItem('clario-theme')||'light'); renderAll();
})();