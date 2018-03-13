"use strict";
define([
    'knockout',
    'text!./activity-block-component.html',
    '../constants',
    '../i18n',

    // non-referenced:
    'css!./activity-block-component.css',
    '../utils/ko-text-highlighted-binding',
    '../utils/ko-enter-pressed-binding',
    '../utils/ko-escape-pressed-binding'
], (ko,
    template,
    constants,
    i18n) => {

    const STATUS_CLASS_POSITIVE = 'positive';
    const STATUS_CLASS_NEUTRAL = 'neutral';
    const STATUS_CLASS_NEGATIVE = 'negative';
    const STATUS_CLASS_DISABLED = 'disabled';

    class ActivityBlockComponent {
        constructor(params, componentInfo) {
            /** @type ActivityModel */
            this.activity = ko.unwrap(params.activity);
            //this.nextActivity = ko.unwrap(params.nextActivity);

            //console.log('activity',this.activity);
            //console.log('this.activity.toggleEditor',this.activity.toggleEditor);
            //console.log('this.activity.appt_number',this.activity.appt_number);
            //console.log('nextActivity',this.nextActivity);
            this.attributeDescription = params.attributeDescription;

            this.searchString = params.searchString || null;

            /** @type Element */
            this.elementConainer = componentInfo.element;

            this.title = this.outputProperty(constants.ACTIVITY_PROPERTY_SEARCH_BY);
            this.consLect = this.outputProperty(constants.ACTIVITY_PROPERTY_CONS_LECT);
            this.address = this.outputProperty(constants.ACTIVITY_PROPERTY_ADDRESS);
            this.customer_number = this.outputProperty(constants.ACTIVITY_PROPERTY_CUST_NUMBER);
            this.appt_number = this.outputProperty(constants.ACTIVITY_PROPERTY_APPT_NUMBER);
            /*this.toggleEditorText = ko.pureComputed(() => {
                return this.activity.toggleEditor;
            });*/

            this.meterReading = ko.observable(this.activity.meterReading);
            this.enteredMeterReading = ko.observable(this.meterReading());
            this.meterReadingError = ko.observable(null);
            this.confirmedMeterReading = ko.observable(this.activity.confirmedMeterReading);
            this.obsvMeterReading = ko.observable(this.activity.obsvMeterReading);
            this.obsvationsMeterReading = ko.observable(this.activity.obsvationsMeterReading);
            this.selectedCNLGDO = ko.observable(36);
            this.selectedOBSGDO = ko.observable(30);
            this.selectedCNLSTG = ko.observable(36);
            this.selectedOBSSTG = ko.observable(30);

            this.meterReadingEntered = params.meterReadingEntered;
            this.activityDetailsRequested = params.activityDetailsRequested;

            this.status = '';
            this.statusClass = '';
            this.statusDetails = ko.pureComputed(() => {
                if (this.activity.isComplete() && this.meterReading()) {
                    return this.meterReading();
                }
                return '';
            });

            this.isExpanded = ko.observable(false);
            this.enteredMeterReadingOk = ko.observable(false);

            this.blockExpandedSignal = params.blockExpandedSignal;
            this.submitBlockedSignal = params.submitBlockedSignal;
            this.submitUnlockedSignal = params.submitUnlockedSignal;

            if (this.activity.isComplete()) {
                this.statusClass = STATUS_CLASS_POSITIVE;
                if (this.activity.isAwaitingSynchronization()) {
                    this.status = this.i18n('activity-status-complete');
                } else {
                    this.status = this.i18n('activity-status-complete');
                    this.statusClass = STATUS_CLASS_DISABLED;
                }
            } else if (!this.activity.isPending() && !this.activity.isComplete()) {
                switch (this.activity.status) {
                    case constants.ACTIVITY_STATUS_COMPLETE:
                        this.status = this.i18n('activity-status-complete');
                        this.statusClass = STATUS_CLASS_POSITIVE;
                        break;
                    case constants.ACTIVITY_STATUS_STARTED:
                        this.status = this.i18n('activity-status-started');
                        this.statusClass = STATUS_CLASS_NEUTRAL;
                        break;
                    case constants.ACTIVITY_STATUS_DELETED:
                        // very rare situation:
                        this.status = this.i18n('activity-status-deleted');
                        this.statusClass = STATUS_CLASS_NEGATIVE;
                        break;
                    case constants.ACTIVITY_STATUS_SUSPENDED:
                        this.status = this.i18n('activity-status-suspended');
                        this.statusClass = STATUS_CLASS_NEUTRAL;
                        break;
                    case constants.ACTIVITY_STATUS_NOTDONE:
                        this.status = this.i18n('activity-status-notdone');
                        this.statusClass = STATUS_CLASS_NEGATIVE;
                        break;
                }
            }

            //this.isApplyButtonDisabled = ko.pureComputed(() => this.enteredMeterReading() == this.meterReading());
            this.isApplyButtonDisabled = ko.pureComputed(() =>{
                if(
                    ((this.enteredMeterReading() == this.meterReading()) &&
                      (this.isGDO() && !this.isGDOCNL()) &&
                        (this.isSTG() && !this.isSTGCNL())
                    )
                //(this.activity.isPending() || this.activity.isComplete() && this.activity.isAwaitingSynchronization())
               ){
                 return true;
                }
                return false;
            });

            this.isActivityEditable = ko.pureComputed(() =>{
                //console.log('isActivityEditable this.activity.toggleEditor',this.activity.toggleEditor);
                if(this.activity.isPending() || this.activity.isComplete() && this.activity.isAwaitingSynchronization()){
                    return true;
                }
                return false;
             });

            this.blockExpandedSignalSubscription = this.blockExpandedSignal.add((activity) => {
                if (this.isExpanded() && activity !== this.activity) {
                    this.toggleEditor(true);
                }
            });

            this.isViObsvMeterReading = ko.observable(false);

            if(this.activity.toggleEditor){
                this.toggleEditor(true);
            }

            this.isGDO = ko.pureComputed(() =>{
                if(this.activity.isGDO()){
                    return true;
                }
                return false;
            });


            this.isSTG = ko.pureComputed(() =>{
                if(this.activity.isSTG()){
                    return true;
                }
                return false;
            });

            this.isGDOCNL = ko.pureComputed(() =>{
                if((this.enteredMeterReading() == this.meterReading()) &&
                (this.activity.isPending() || this.activity.isComplete() && this.activity.isAwaitingSynchronization())
                && (this.activity.isGDO())
                && !(this.enteredMeterReading() > 0 )
                ){
                    return true;
                }
                return false;
            });

            this.isSTGCNL = ko.pureComputed(() =>{
                if((this.enteredMeterReading() == this.meterReading()) &&
                (this.activity.isPending() || this.activity.isComplete() && this.activity.isAwaitingSynchronization())
                && (this.activity.isSTG())
                && !(this.enteredMeterReading() > 0 )
                ){
                    return true;
                }
                return false;
            });
        }

        outputProperty(propertyName) {
            let value = this.activity.properties[propertyName];
            let attributeDescription = this.attributeDescription[propertyName];
            if (!attributeDescription) {
                return value;
            }
            if (attributeDescription.type === 'enum' && attributeDescription.enum && attributeDescription.enum[value] && attributeDescription.enum[value].text) {
                value = attributeDescription.enum[value] && attributeDescription.enum[value].text || value;
            }
            return value;
        }

        focusOnInput() {
            let meterReadingInput = this.elementConainer.querySelector('.meter-reading-input');
            if (meterReadingInput) {
                meterReadingInput.focus();
                setTimeout(() => meterReadingInput.select(), 50);
            }
        }

        focusOnInputC() {
            let cmeterReadingInput = this.elementConainer.querySelector('.conf-meter-reading-input');
            if (cmeterReadingInput) {
                cmeterReadingInput.focus();
                setTimeout(() => cmeterReadingInput.select(), 50);
            }
        }

        collapseEditor() {
            if (this.isExpanded()) {
                this.toggleEditor();
            }
        }

        toggleEditor(quietMode) {
            if (!this.isExpanded()) {
                this.enteredMeterReading(this.meterReading());
                this.isExpanded(true);
                this.blockExpandedSignal.dispatch(this.activity);
                //this.submitBlockedSignal.dispatch();
                this.focusOnInput();
            } else {
                this.isExpanded(false);
                this.enteredMeterReading(this.meterReading());
                this.meterReadingError(false);
                if (quietMode !== true) {
                    this.submitUnlockedSignal.dispatch();
                }
            }
        }

        /**
        * Validacion de la lectura y la confirmacion
        * @return false - Credenciales incorrectas
        * true - Credenciales correctas
        */
        validateMeterOk(){
            this.meterReadingError(null);
            this.enteredMeterReadingOk(false);

            //Valida que la lectura sea mayor de cero
            if(this.enteredMeterReading().length == 0  ){
                return true;
            }

            //console.log('enteredMeterReading',this.enteredMeterReading());
            //console.log('confirmedMeterReading',this.confirmedMeterReading());
            //Valida cin el campo lectura y el campo confirmacion son iguales
            if(this.enteredMeterReading() == this.confirmedMeterReading()){
                return true;
            }

            //Validar el rango de la lectura
            if(!(this.enteredMeterReading() >= this.activity.ranLectMin  && this.enteredMeterReading() <= this.activity.ranLectMax)){
                //mostrar mensaje de error
                this.MsgError = i18n('error-range-meter-reading-value');
                //this.MsgError = this.MsgError.replace('#RANGMIN#', this.activity.ranLectMin);
                //this.MsgError = this.MsgError.replace('#RANGMAX#', this.activity.ranLectMax);

                this.meterReadingError(this.MsgError);

                this.enteredMeterReadingOk(true);
                this.focusOnInputC();
                return false;
            }
            return true;
        }

        applyMeterReading() {
            //Hace el llamado al metodo que valida si la lectura difitado
            //est ok y si confirma si es necesario
            //console.log('applyMeterReading validateMeter');
            let validateMeter = this.validateMeterOk();
            //console.log('validateMeter',validateMeter);

            //Si la lectura no cumple no aplica los cambios
            if(!validateMeter){
                return;
            }

            //Valida si es GDO para validar si enviar Causald e no lectura
            //o envia observacion de lectura
            if(this.isGDO()  ){
                if(this.isGDOCNL()){
                    this.obsvMeterReading(this.selectedCNLGDO());
                }else{
                    this.obsvMeterReading(this.selectedOBSGDO());
                }
            }
            //console.log('obsvMeterReading',this.obsvMeterReading());

            //Valida si es GDO para validar si enviar Causald e no lectura
            //o envia observacion de lectura
            if(this.isSTG() ){
                if(this.isGDOCNL()){
                    this.obsvMeterReading(this.selectedCNLSTG());
                }else{
                    this.obsvMeterReading(this.selectedOBSSTG());
                }
            }
            //console.log('obsvMeterReading',this.obsvMeterReading());
            //console.log('obsvationsMeterReading',this.obsvationsMeterReading());
            //console.log('applyMeterReading',this.enteredMeterReading());
            if (this.isApplyButtonDisabled() || !this.isActivityEditable()) {
                return;
            }
            //console.log('applyMeterReading',this.enteredMeterReading());
            this.meterReadingError(null);

            let applyResult = this.meterReadingEntered(this.activity, this.enteredMeterReading(),this.obsvMeterReading(),this.obsvationsMeterReading());

            if (applyResult === true) {
                //console.log('Aplica');
                this.meterReading(this.enteredMeterReading());
                this.isExpanded(false);
                //si la actividad esta editble cone l toggle se desactiva
                if(this.activity.toggleEditor){
                    this.activity.toggleEditor = false;
                }

                //this.activity = this.nextActivity;
                //console.log('ActividadNext:',this.nextActivity);
                //console.log('Actividad:',this.activity);
                this.enteredMeterReading(0);
                this.enteredMeterReading(null);
                this.toggleEditor();
                this.submitUnlockedSignal.dispatch();
            } else if (typeof applyResult === 'string') {
                // text error - show it
                this.meterReadingError(applyResult);
                this.focusOnInput();
            } else {
                // unexpected error
                this.focusOnInput();
            }
        }

        goToDetails() {
            this.activityDetailsRequested(this.activity);
        }

        onInputFocus() {
            this.submitBlockedSignal.dispatch();
        }

        onInputFocusC() {
            this.submitBlockedSignal.dispatch();
        }

        onInputBlur() {
            //Se hace el llamado al metodo que valida si la lectura digitrada y la confirmacion estan OK
            this.validateMeterOk();
            this.submitUnlockedSignal.dispatch();
        }

        onInputBlurC() {
            this.submitUnlockedSignal.dispatch();
        }

        i18n(label) {
            return i18n(label);
        }

        dispose() {
            if (this.isExpanded()) {
                this.submitUnlockedSignal.dispatch();
            }
            this.blockExpandedSignalSubscription && this.blockExpandedSignalSubscription.detach && this.blockExpandedSignalSubscription.detach();
            this.blockExpandedSignalSubscription = null;
        }
    }

    ko.components.register('activity-block', {
        viewModel: {
            createViewModel: (params, componentInfo) => {
                return new ActivityBlockComponent(params, componentInfo);
            }
        },
        template
    });
});