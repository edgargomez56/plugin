"use strict";
define([
    '../constants'
], (constants) => {

    class ActivityModel {

    constructor(properties) {
        this.properties = properties;

        this._syncAwaiting = false;
        this.toggleEditor = false;
    }

    get id() {
        return this.properties[constants.ACTIVITY_PROPERTY_ID] || '';
    }

    get searchKey() {
        return this.properties[constants.ACTIVITY_PROPERTY_SEARCH_BY] || '';
    }

    get sortKey() {
        return this.properties[constants.ACTIVITY_PROPERTY_SORT] && parseInt(this.properties[constants.ACTIVITY_PROPERTY_SORT], 10) || 0;
    }

    get meterReading() {
        return this.properties[constants.ACTIVITY_PROPERTY_METER_READING] || '';
    }

    set meterReading(value) {
        this.properties[constants.ACTIVITY_PROPERTY_METER_READING] = value;
    }

    get confirmedMeterReading() {
        return this.properties[constants.ACTIVITY_PROPERTY_CONFIRMED_METER_READING] || '';
    }

    set confirmedMeterReading(value) {
        this.properties[constants.ACTIVITY_PROPERTY_CONFIRMED_METER_READING] = value;
    }

    get obsvMeterReading() {
        //console.log('get obsvMeterReading this.meterReading',(this.meterReading.length));
        if(this.meterReading.length > 0){
            return this.properties[constants.ACTIVITY_PROPERTY_OBSV_METER_READING] || '';
        }else{
            return this.properties[constants.ACTIVITY_PROPERTY_CNL_METER_READING] || '';
        }
    }

    set obsvMeterReading(value) {
        //console.log('set obsvMeterReading this.meterReading',(this.meterReading.length));
        if(this.meterReading.length > 0) {
            this.properties[constants.ACTIVITY_PROPERTY_OBSV_METER_READING] = value;
        }else{
            this.properties[constants.ACTIVITY_PROPERTY_CNL_METER_READING] = value;
        }
    }

    get obsvationsMeterReading() {
        return this.properties[constants.ACTIVITY_PROPERTY_OBSVATIONS_METER_READING] || '';
    }

    set obsvationsMeterReading(value) {
        this.properties[constants.ACTIVITY_PROPERTY_OBSVATIONS_METER_READING] = value;
    }

    get completionOrder() {
        return this.properties[constants.ACTIVITY_PROPERTY_COMPLETION_ORDER] && parseInt(this.properties[constants.ACTIVITY_PROPERTY_COMPLETION_ORDER], 10) || 0;
    }

    set completionOrder(value) {
        this.properties[constants.ACTIVITY_PROPERTY_COMPLETION_ORDER] = value;
    }

    get status() {
        return this.properties[constants.ACTIVITY_PROPERTY_STATUS] || '';
    }

    get address() {
        return this.properties[constants.ACTIVITY_PROPERTY_ADDRESS] || '';
    }

    get consLect() {
        return this.properties[constants.ACTIVITY_PROPERTY_CONS_LECT] || '';
    }

    set consLect(value) {
        this.properties[constants.ACTIVITY_PROPERTY_CONS_LECT] = value;
    }

    get ranLectMin() {
        return this.properties[constants.ACTIVITY_PROPERTY_RAN_LECT_MIN] && parseInt(this.properties[constants.ACTIVITY_PROPERTY_RAN_LECT_MIN], 10) || 0;
    }

    set ranLectMin(value) {
        this.properties[constants.ACTIVITY_PROPERTY_RAN_LECT_MIN] = value;
    }

    get ranLectMax() {
        return this.properties[constants.ACTIVITY_PROPERTY_RAN_LECT_MAX] && parseInt(this.properties[constants.ACTIVITY_PROPERTY_RAN_LECT_MAX], 10) || 0;
    }

    set ranLectMax(value) {
        this.properties[constants.ACTIVITY_PROPERTY_RAN_LECT_MAX] = value;
    }

    get customer_number() {
        return this.properties[constants.ACTIVITY_PROPERTY_CUST_NUMBER] && parseInt(this.properties[constants.ACTIVITY_PROPERTY_CUST_NUMBER], 10) || 0;
    }

    get appt_number() {
        return this.properties[constants.ACTIVITY_PROPERTY_APPT_NUMBER] || '';
    }

    set appt_number(value) {
        this.properties[constants.ACTIVITY_PROPERTY_APPT_NUMBER] = value;
    }

    cancel() {
        this.properties[constants.ACTIVITY_PROPERTY_STATUS] = constants.ACTIVITY_STATUS_CANCELLED;
        this._syncAwaiting = true;
    }

    undoCancel() {
        this.properties[constants.ACTIVITY_PROPERTY_STATUS] = constants.ACTIVITY_STATUS_PENDING;
        this._syncAwaiting = false;
    }

    isPending() {
        return constants.ACTIVITY_STATUS_PENDING === this.status;
    }

    isStarted() {
        return constants.ACTIVITY_STATUS_STARTED === this.status;
    }

    isComplete() {
        return constants.ACTIVITY_STATUS_CANCELLED === this.status;
    }

    isAwaitingSynchronization() {
        return this.isComplete() && this._syncAwaiting;
    }

    isGDO() {
        var sbCompany = this.properties[constants.ACTIVITY_PROPERTY_APPT_NUMBER].substr(0, 3);
        if(constants.PREFIX_COMPANY_GDO.trim() === sbCompany.trim()){
            return true;
        }else{
            return false;
        }
    }

    isSTG() {
        var sbCompany = this.properties[constants.ACTIVITY_PROPERTY_APPT_NUMBER].substr(0, 3);
        if(constants.PREFIX_COMPANY_STG.trim() === sbCompany.trim()){
            return true;
        }else{
            return false;
        }
    }

}

return ActivityModel;
});